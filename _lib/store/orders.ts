import type { TOrderPayment, TOrderResponse, TOrderStatus, TProduct, TSupplyItem } from "@/app/(app)/order/interface";
import { computeOrderTotal, decrementOrRemoveItem, mergeOrderItem } from "@/app/(app)/order/order-math";
import { supabase } from "@/_lib/supabase/client";
import { getEstablishmentId } from "@/_lib/supabase/establishment";
import { adjustSupplyItemStock } from "./supply-items";
import { getMaxProducibleQuantity } from "@/_lib/recipe-cost";
import { notifyStoreChange } from "@/_lib/store/notify-store-change";
import { mapProductRow, mapSupplyItemRow, type TProductRow, type TSupplyItemRow } from "@/_lib/store/shared";

export interface TOrderItemInput {
  productId: number;
  quantity: number;
}

export interface TUpdateOrderStatusInput {
  orderId: number;
  status: Exclude<TOrderStatus, "OPEN">;
  observation?: string;
  customerName?: string;
  isTakeout?: boolean;
  groupWithOrderId?: number | null;
  payments?: TOrderPayment[];
}

interface TOrderRow {
  id: number;
  customer_name: string;
  status: TOrderStatus;
  created_at: string;
  total: number;
  order_items: TOrderResponse["orderItems"];
  observation: string | null;
  printed_item_quantities: Record<number, number>;
  is_takeout: boolean;
  operator_name: string | null;
  payments: TOrderPayment[];
  group_id: number | null;
  conta_settled_at: string | null;
}

function fromRow(row: TOrderRow): TOrderResponse {
  return {
    id: row.id,
    customerName: row.customer_name,
    status: row.status,
    createdAt: row.created_at,
    total: Number(row.total),
    orderItems: row.order_items ?? [],
    observation: row.observation,
    printedItemQuantities: row.printed_item_quantities ?? {},
    isTakeout: row.is_takeout,
    operatorName: row.operator_name,
    payments: row.payments ?? [],
    groupId: row.group_id,
    contaSettledAt: row.conta_settled_at,
  };
}

async function fetchOrderRow(orderId: number): Promise<TOrderRow> {
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TOrderRow;
}

async function fetchProduct(productId: number): Promise<TProduct | null> {
  const { data, error } = await supabase.from("products").select("*, category:categories(id, name)").eq("id", productId).single();

  if (error) {
    return null;
  }

  return mapProductRow(data as unknown as TProductRow);
}

async function fetchSupplyItemsByIds(ids: number[]): Promise<TSupplyItem[]> {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from("supply_items").select("*").in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return (data as TSupplyItemRow[]).map(mapSupplyItemRow);
}

async function fetchProductsByIds(ids: number[]): Promise<TProduct[]> {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase.from("products").select("*, category:categories(id, name)").in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as TProductRow[]).map(mapProductRow);
}

async function fetchTakeoutFee(): Promise<number> {
  const { data, error } = await supabase.from("settings").select("takeout_fee").single();

  if (error) {
    throw new Error(error.message);
  }

  return Number(data.takeout_fee);
}

function nextItemId(items: TOrderResponse["orderItems"]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

async function consumeRecipeStock(product: TProduct, quantitySold: number, preFetchedSupplyItems?: TSupplyItem[]): Promise<void> {
  if (product.recipe.length === 0) {
    return;
  }

  const supplyItems = preFetchedSupplyItems ?? (await fetchSupplyItemsByIds(product.recipe.map((item) => item.supplyItemId)));

  await Promise.all(
    product.recipe.map(async (recipeItem) => {
      const supplyItem = supplyItems.find((item) => item.id === recipeItem.supplyItemId);

      if (!supplyItem) {
        return;
      }

      adjustSupplyItemStock(supplyItem, recipeItem.quantity * quantitySold);

      const { error } = await supabase.from("supply_items").update({ quantity: supplyItem.quantity }).eq("id", supplyItem.id);

      if (error) {
        throw new Error(error.message);
      }
    }),
  );
}

// Validates and merges a whole batch of cart lines in one pass (one products fetch, one
// supply-items fetch) instead of the one-network-round-trip-per-line the interactive PDV
// add-to-cart flow uses — that's fine for a single click, but sending a multi-item cart
// doesn't need to serialize N separate reads and writes to do the same job.
async function prepareBatchOrderItems(items: TOrderItemInput[]): Promise<{
  orderItems: TOrderResponse["orderItems"];
  total: number;
  applyStockChanges: () => Promise<void>;
}> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const [products, takeoutFee] = await Promise.all([fetchProductsByIds(productIds), fetchTakeoutFee()]);

  const supplyItemIds = [
    ...new Set(
      items.flatMap(
        ({ productId }) =>
          products.find((product) => product.id === productId)?.recipe.map((recipeItem) => recipeItem.supplyItemId) ?? [],
      ),
    ),
  ];

  const supplyItems = await fetchSupplyItemsByIds(supplyItemIds);

  // Every recipe-based line draws from the same shared supply, so a shared ingredient has
  // to be checked against what the whole batch needs at once — checking each line against
  // the raw supply-item quantity independently would let two lines each look affordable
  // alone while together overselling the same ingredient.
  const supplyItemConsumption = new Map<number, number>();

  for (const { productId, quantity } of items) {
    const product = products.find((candidate) => candidate.id === productId);

    if (!product) {
      throw new Error("Produto não encontrado");
    }

    if (product.trackStock && product.quantity < quantity) {
      throw new Error(`Estoque insuficiente para "${product.name}".`);
    }

    product.recipe.forEach((recipeItem) => {
      supplyItemConsumption.set(
        recipeItem.supplyItemId,
        (supplyItemConsumption.get(recipeItem.supplyItemId) ?? 0) + recipeItem.quantity * quantity,
      );
    });
  }

  for (const [supplyItemId, consumedQuantity] of supplyItemConsumption) {
    const supplyItem = supplyItems.find((item) => item.id === supplyItemId);

    if (!supplyItem || supplyItem.quantity < consumedQuantity) {
      const productUsingIt = items
        .map(({ productId }) => products.find((candidate) => candidate.id === productId))
        .find((candidate) => candidate?.recipe.some((recipeItem) => recipeItem.supplyItemId === supplyItemId));

      throw new Error(`Estoque insuficiente para "${productUsingIt?.name ?? "um dos itens"}".`);
    }
  }

  let orderItems: TOrderResponse["orderItems"] = [];
  let nextId = 1;

  for (const { productId, quantity } of items) {
    const product = products.find((candidate) => candidate.id === productId) as TProduct;

    orderItems = mergeOrderItem(orderItems, product, quantity, () => nextId++);
  }

  const total = computeOrderTotal(orderItems, false, takeoutFee);

  async function applyStockChanges(): Promise<void> {
    await Promise.all([
      ...[...supplyItemConsumption.entries()].map(async ([supplyItemId, consumedQuantity]) => {
        const supplyItem = supplyItems.find((item) => item.id === supplyItemId);

        if (!supplyItem) {
          return;
        }

        adjustSupplyItemStock(supplyItem, consumedQuantity);

        const { error } = await supabase.from("supply_items").update({ quantity: supplyItem.quantity }).eq("id", supplyItemId);

        if (error) {
          throw new Error(error.message);
        }
      }),
      ...items
        .map(({ productId, quantity }) => ({ product: products.find((candidate) => candidate.id === productId), quantity }))
        .filter((entry): entry is { product: TProduct; quantity: number } => Boolean(entry.product?.trackStock))
        .map(async ({ product, quantity }) => {
          const { error } = await supabase
            .from("products")
            .update({ quantity: product.quantity - quantity })
            .eq("id", product.id);

          if (error) {
            throw new Error(error.message);
          }
        }),
    ]);
  }

  return { orderItems, total, applyStockChanges };
}

export const orderStore = {
  getOrders: async (): Promise<TOrderResponse[]> => {
    const { data, error } = await supabase.from("orders").select("*").order("id");

    if (error) {
      throw new Error(error.message);
    }

    return (data as TOrderRow[]).map(fromRow);
  },

  getOrdersInRange: async (startIso: string, endIso: string): Promise<TOrderResponse[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "PAID")
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("id");

    if (error) {
      throw new Error(error.message);
    }

    return (data as TOrderRow[]).map(fromRow);
  },

  getOrder: async (orderId: number): Promise<TOrderResponse | undefined> => {
    const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? fromRow(data as TOrderRow) : undefined;
  },

  addOrderItem: async (orderId: number, productId: number, quantity: number): Promise<TOrderResponse> => {
    const [orderRow, product, takeoutFee] = await Promise.all([
      fetchOrderRow(orderId),
      fetchProduct(productId),
      fetchTakeoutFee(),
    ]);

    if (!product) {
      throw new Error("Pedido ou produto não encontrado");
    }

    if (product.trackStock && product.quantity < quantity) {
      throw new Error(`Estoque insuficiente para "${product.name}".`);
    }

    let recipeSupplyItems: TSupplyItem[] | undefined;

    if (product.recipe.length > 0) {
      recipeSupplyItems = await fetchSupplyItemsByIds(product.recipe.map((item) => item.supplyItemId));
      const maxProducible = getMaxProducibleQuantity(product.recipe, recipeSupplyItems) ?? 0;

      if (maxProducible < quantity) {
        throw new Error(`Estoque insuficiente para "${product.name}".`);
      }
    }

    const order = fromRow(orderRow);

    const newOrderItems = mergeOrderItem(order.orderItems, product, quantity, () => nextItemId(order.orderItems));
    const total = computeOrderTotal(newOrderItems, order.isTakeout, takeoutFee);

    await consumeRecipeStock(product, quantity, recipeSupplyItems);

    if (product.trackStock) {
      const { error } = await supabase.from("products").update({ quantity: product.quantity - quantity }).eq("id", productId);

      if (error) {
        throw new Error(error.message);
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ order_items: newOrderItems, total })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders", "products", "supplyItems"]);

    return fromRow(data as TOrderRow);
  },

  // Creates a brand-new order pre-loaded with every line from the cart in one batch — used
  // when sending a draft comanda for the first time, instead of an empty createOrder()
  // followed by one addOrderItem() per line.
  createOrderWithItems: async (
    customerName: string,
    operatorName: string | null | undefined,
    items: TOrderItemInput[],
  ): Promise<TOrderResponse> => {
    const establishmentId = await getEstablishmentId();

    const { orderItems, total, applyStockChanges } = await prepareBatchOrderItems(items);

    await applyStockChanges();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName.trim(),
        status: "OPEN",
        operator_name: operatorName?.trim() || null,
        order_items: orderItems,
        total,
        establishment_id: establishmentId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders", "products", "supplyItems"]);

    return fromRow(data as TOrderRow);
  },

  removeOrderItem: async (orderId: number, itemId: number): Promise<TOrderResponse> => {
    const [orderRow, takeoutFee] = await Promise.all([fetchOrderRow(orderId), fetchTakeoutFee()]);
    const order = fromRow(orderRow);

    const removedItem = order.orderItems.find((item) => item.id === itemId);
    const newOrderItems = decrementOrRemoveItem(order.orderItems, itemId);
    const total = computeOrderTotal(newOrderItems, order.isTakeout, takeoutFee);

    const printedItemQuantities = { ...order.printedItemQuantities };

    if (removedItem) {
      const product = await fetchProduct(removedItem.product.id);

      if (product) {
        if (product.trackStock) {
          const { error } = await supabase.from("products").update({ quantity: product.quantity + 1 }).eq("id", product.id);

          if (error) {
            throw new Error(error.message);
          }
        }

        await consumeRecipeStock(product, -1);
      }

      const updatedItem = newOrderItems.find((item) => item.id === itemId);
      const printed = printedItemQuantities[itemId] ?? 0;

      if (updatedItem) {
        printedItemQuantities[itemId] = Math.min(printed, updatedItem.quantity);
      } else {
        delete printedItemQuantities[itemId];
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ order_items: newOrderItems, total, printed_item_quantities: printedItemQuantities })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders", "products", "supplyItems"]);

    return fromRow(data as TOrderRow);
  },

  updateOrderStatus: async ({
    orderId,
    status,
    observation,
    customerName,
    isTakeout,
    groupWithOrderId,
    payments,
  }: TUpdateOrderStatusInput): Promise<TOrderResponse> => {
    const orderRow = await fetchOrderRow(orderId);
    const order = fromRow(orderRow);

    const update: Record<string, unknown> = { status };

    if (observation !== undefined) {
      update.observation = observation || null;
    }

    if (customerName !== undefined) {
      update.customer_name = customerName.trim();
    }

    if (isTakeout !== undefined) {
      const takeoutFee = await fetchTakeoutFee();

      update.is_takeout = isTakeout;
      update.total = computeOrderTotal(order.orderItems, isTakeout, takeoutFee);
    }

    if (groupWithOrderId !== undefined) {
      if (groupWithOrderId === null) {
        update.group_id = null;
      } else {
        const targetRow = await fetchOrderRow(groupWithOrderId);
        const groupId = targetRow.group_id ?? targetRow.id;

        const { error: targetError } = await supabase.from("orders").update({ group_id: groupId }).eq("id", groupWithOrderId);

        if (targetError) {
          throw new Error(targetError.message);
        }

        update.group_id = groupId;
      }
    }

    if (payments !== undefined) {
      update.payments = payments;
    }

    const { data, error } = await supabase.from("orders").update(update).eq("id", orderId).select().single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders", "report"]);

    return fromRow(data as TOrderRow);
  },

  markOrderItemsPrinted: async (orderId: number, printedItemQuantities: Record<number, number>): Promise<TOrderResponse> => {
    const { data, error } = await supabase
      .from("orders")
      .update({ printed_item_quantities: { ...printedItemQuantities } })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders"]);

    return fromRow(data as TOrderRow);
  },

  deleteOrder: async (orderId: number): Promise<void> => {
    const orderRow = await fetchOrderRow(orderId);
    const order = fromRow(orderRow);

    const products = await fetchProductsByIds([...new Set(order.orderItems.map((item) => item.product.id))]);

    await Promise.all(
      order.orderItems.map(async (item) => {
        const product = products.find((candidate) => candidate.id === item.product.id);

        if (!product) {
          return;
        }

        if (product.trackStock) {
          const { error } = await supabase
            .from("products")
            .update({ quantity: product.quantity + item.quantity })
            .eq("id", product.id);

          if (error) {
            throw new Error(error.message);
          }
        }

        await consumeRecipeStock(product, -item.quantity);
      }),
    );

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders", "products", "supplyItems"]);
  },

  setContaSettled: async (orderId: number, settled: boolean): Promise<TOrderResponse> => {
    const { data, error } = await supabase
      .from("orders")
      .update({ conta_settled_at: settled ? new Date().toISOString() : null })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    notifyStoreChange(["orders"]);

    return fromRow(data as TOrderRow);
  },
};
