export type UserRole = "admin" | "staff" | "accountant";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  isWholesale?: boolean;
  lastOrderDate?: string;
  repeatCount?: number;
}

export interface Product {
  id: string;
  name: string;
  variety: string;
  description: string;
  salePrice: number;
  costPrice: number;
  gstRate: number;
  unit: "packet" | "box";
  defaultBatchSize: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: "kg" | "litre" | "g" | "pack";
  quantity: number;
  reorderLevel: number;
  lastUpdated: string;
}

export interface FinishedGood {
  id: string;
  productId: string;
  batchCode: string;
  quantity: number;
  reorderLevel: number;
  mfgDate: string;
  expiryDate: string;
}

export interface InventoryState {
  rawMaterials: RawMaterial[];
  finishedGoods: FinishedGood[];
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: "upi" | "cash" | "card" | "bank_transfer";
  note?: string;
  createdAt: string;
  expectedShipDate?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  discountAmount?: number;
  shippingCost?: number;
  gstAmount?: number;
  totalAmount: number;
  invoiceNumber?: string;
}

export interface Expense {
  id: string;
  category:
    | "raw_materials"
    | "packaging"
    | "delivery"
    | "utilities"
    | "labor"
    | "marketing"
    | "maintenance"
    | "other";
  description: string;
  amount: number;
  paidTo: string;
  date: string;
  paymentMode: "upi" | "cash" | "card" | "bank_transfer";
  recurring?: boolean;
}

export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  issuedOn: string;
  dueDate: string;
  amount: number;
  gstAmount: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  notes?: string;
}

export interface ProfitLossRow {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

export interface DashboardKpi {
  title: string;
  value: string;
  subtitle: string;
  trend?: number;
  highlight?: boolean;
}

export interface AppState {
  customers: Customer[];
  products: Product[];
  inventory: InventoryState;
  orders: Order[];
  expenses: Expense[];
  invoices: Invoice[];
}

export type AppAction =
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER_STATUS"; payload: { id: string; status: OrderStatus } }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "ADD_INVOICE"; payload: Invoice }
  | {
      type: "SET_APP_STATE";
      payload: AppState;
    }
  | {
      type: "ADJUST_RAW_MATERIAL";
      payload: { id: string; quantity: number; lastUpdated?: string };
    }
  | {
      type: "ADJUST_FINISHED_GOOD";
      payload: { id: string; quantity: number };
    }
  | {
      type: "CREATE_FINISHED_GOOD_BATCH";
      payload: FinishedGood;
    };
