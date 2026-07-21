export interface TMenuList {
  order: TOrderResponse | null;
  onRemoveItem: (itemId: number) => void;
  onSendOrder: () => void;
  isSending: boolean;
  isRemovingItem: boolean;
  observation?: string;
  onObservationChange: (observation: string) => void;
}

export interface TOrderPanel {
  categories: TCategory[];
  selectedCategory: TCategory | null;
  handleCategoryClick: (categoryId: number) => void;
  customerName: string;
  onCustomerNameChange: (value: string) => void;
  onOpenOrder: () => void;
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
  status: "OPEN" | "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED";
  createdAt: string;
  total: number;
  orderItems: TOrderItem[];
  observation: string | null;
}
