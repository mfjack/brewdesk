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
  nameError?: string | null;
  isTakeoutDraft: boolean;
  onIsTakeoutDraftChange: (value: boolean) => void;
}

export interface TOrderPanel {
  categories: TCategory[];
  selectedCategory: TCategory | null;
  handleCategoryClick: (categoryId: number) => void;
  filteredProducts: TProduct[] | undefined;
  onAddProduct: (product: TProduct) => void;
  order: TOrderResponse | null;
  stockError?: string | null;
}

export interface TCategory {
  id: number;
  name: string;
}

export interface TProduct {
  id: number;
  name: string;
  description: string | null;
  photoUrl: string | null;
  price: number;
  quantity: number;
  trackStock: boolean;
  lowStockThreshold: number;
  category: TCategory;
}

export interface TOrderItem {
  id: number;
  product: TProduct;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type TOrderStatus = "OPEN" | "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED" | "PAID";

export type TPaymentMethod = "CASH" | "CREDIT" | "DEBIT" | "PIX";

export interface TOrderResponse {
  id: number;
  customerName: string;
  status: TOrderStatus;
  createdAt: string;
  total: number;
  orderItems: TOrderItem[];
  observation: string | null;
  printedItemQuantities?: Record<number, number>;
  isTakeout: boolean;
  operatorName: string | null;
  paymentMethod: TPaymentMethod | null;
  amountReceived: number | null;
  changeDue: number | null;
}

export interface TOperator {
  id: number;
  name: string;
  pin: string;
}

export interface TStoreSettings {
  name: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  receiptFooterMessage: string | null;
  operators: TOperator[];
  pixQrCodeUrl: string | null;
}
