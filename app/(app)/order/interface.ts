import type { SupplyUnit } from "@/_lib/supply-units";
import type { Weekday, DeliveryPeriod } from "@/_lib/delivery-schedule";

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

  categories: TCategory[];
  selectedCategory: TCategory | null;
  onCategoryClick: (categoryId: number) => void;
  filteredProducts: TProduct[] | undefined;
  products: TProduct[] | undefined;
  supplyItems: TSupplyItem[] | undefined;
  onAddProduct: (product: TProduct) => void;
  stockError?: string | null;
  isEditOrderDialogOpen: boolean;
  onEditOrderDialogOpenChange: (open: boolean) => void;
  onResendFullOrder: () => void;
  isResendingFullOrder: boolean;
  isSelfServiceEnabled: boolean;

  isNameDialogOpen: boolean;
  onNameDialogOpenChange: (open: boolean) => void;
  nameDialogIntent: "send" | "payment";
  customerNameDraft: string;
  onCustomerNameDraftChange: (value: string) => void;
  onConfirmCustomerName: () => void;
  nameError?: string | null;
  isTakeoutDraft: boolean;
  onIsTakeoutDraftChange: (value: boolean) => void;
  groupableOrders: TOrderResponse[];
  groupWithOrderId: number | null;
  onGroupWithOrderIdChange: (orderId: number | null) => void;
  groupedOrders: TOrderResponse[];

  onRegisterConta: () => void;

  onRequestPayment: () => void;
  isPaymentDialogOpen: boolean;
  onPaymentDialogOpenChange: (open: boolean) => void;
  onEditOrderFromPayment?: () => void;
  isPayingExistingComanda: boolean;
  paymentMethod: TPaymentMethod | null;
  onPaymentMethodChange: (method: TPaymentMethod) => void;
  amountReceived: string;
  onAmountReceivedChange: (value: string) => void;
  onConfirmPayment: () => void;
  isConfirmingPayment: boolean;
  isSplitOpen: boolean;
  onSplitOpenChange: (open: boolean) => void;
  onConfirmSplitPayment: (payments: TOrderPayment[]) => void | Promise<void>;

  onRequestCancelOrder: () => void;
  isCancelDialogOpen: boolean;
  onCancelDialogOpenChange: (open: boolean) => void;
  onConfirmCancelOrder: () => void;
  isCancelling: boolean;
}

export interface TOrderPanel {
  categories: TCategory[];
  selectedCategory: TCategory | null;
  handleCategoryClick: (categoryId: number) => void;
  filteredProducts: TProduct[] | undefined;
  products: TProduct[] | undefined;
  supplyItems: TSupplyItem[] | undefined;
  onAddProduct: (product: TProduct) => void;
  order: TOrderResponse | null;
  stockError?: string | null;
  hideHeader?: boolean;
  listLayout?: boolean;
  isSelfServiceEnabled?: boolean;
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
  recipe: TRecipeItem[];
}

export interface TSupplier {
  id: number;
  companyName: string;
  whatsapp: string | null;
  suppliesDescription: string | null;
  purchaseLink: string | null;
  deliveryDays: Weekday[];
  deliveryPeriod: DeliveryPeriod | null;
  observation: string | null;
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

export type TPaymentMethod = "CREDIT" | "DEBIT" | "PIX" | "CASH" | "CONTA";

export interface TOrderPayment {
  method: TPaymentMethod;
  amount: number;
  amountReceived: number | null;
  changeDue: number | null;
}

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
  payments: TOrderPayment[];
  groupId: number | null;
  contaSettledAt: string | null;
}

export interface TOperator {
  id: number;
  name: string;
  pin: string;
  allowedRoutes: string[];
  isSelfService: boolean;
}

export interface TFeatureFlags {
  takeout: boolean;
  orderGrouping: boolean;
  splitBill: boolean;
  creditSale: boolean;
  orderTickets: boolean;
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
  featureFlags: TFeatureFlags;
  takeoutFee: number;
}
