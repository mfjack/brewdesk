export interface TMenuList {
  order: TOrderResponse | null;
  onRemoveItem: (itemId: number) => void;
  onSendOrder: () => void;
  isSending: boolean;
  isRemovingItem: boolean;
  observation?: string;
  onObservationChange: (observation: string) => void;
  printedItemQuantities?: Record<number, number>;
  onPrintAdditional?: () => void;

  isNameDialogOpen: boolean;
  onNameDialogOpenChange: (open: boolean) => void;
  customerNameDraft: string;
  onCustomerNameDraftChange: (value: string) => void;
  onConfirmCustomerName: () => void;
}

export interface TOrderPanel {
  categories: TCategory[];
  selectedCategory: TCategory | null;
  handleCategoryClick: (categoryId: number) => void;
  hasActiveOrder: boolean;
  filteredProducts: TProduct[] | undefined;
  onAddProduct: (product: TProduct) => void;
  order: TOrderResponse | null;
}

export interface TCategory {
  id: number;
  name: string;
}

export interface TProduct {
  id: number;
  name: string;
  price: number;
  category: TCategory;
}

export interface TOrderItem {
  id: number;
  product: TProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  observation: string | null;
}

export interface TOrderResponse {
  id: number;
  customerName: string;
  status: "OPEN" | "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "PAID";
  createdAt: string;
  total: number;
  orderItems: TOrderItem[];
  observation: string | null;
  printedItemQuantities?: Record<number, number>;
}
