import type { SupplyUnit } from "@/_lib/supply-units";
import type { Weekday, DeliveryPeriod } from "@/_lib/delivery-schedule";
import type { TOperatorRole } from "@/_lib/operator-roles";

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

  onRequestPayment: () => void;
  isPaymentDialogOpen: boolean;
  onPaymentDialogOpenChange: (open: boolean) => void;
  paymentMethod: TPaymentMethod;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;
  onConfirmPayment: () => void;
  isConfirmingPayment: boolean;
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

export interface TRecipeItem {
  supplyItemId: number;
  quantity: number;
  unit: SupplyUnit;
}

export interface TProduct {
  id: number;
  name: string;
  description: string | null;
  photoUrl: string | null;
  price: number;
  costPrice: number;
  quantity: number;
  trackStock: boolean;
  lowStockThreshold: number;
  category: TCategory;
  supplierId: number | null;
  recipe: TRecipeItem[];
}

export interface TSupplier {
  id: number;
  companyName: string;
  whatsapp: string | null;
  suppliesDescription: string | null;
  paymentTerms: string | null;
  deliveryDays: Weekday[];
  deliveryPeriod: DeliveryPeriod | null;
}

export interface TSupplyItem {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  initialQuantity: number;
  unit: SupplyUnit;
  minQuantity: number;
  costPrice: number;
  supplierId: number | null;
  expiresAt: string | null;
}

export interface TOrderItemProduct {
  id: number;
  name: string;
}

export interface TOrderItem {
  id: number;
  product: TOrderItemProduct;
  quantity: number;
  unitPrice: number;
  costPrice: number;
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
  role: TOperatorRole;
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
