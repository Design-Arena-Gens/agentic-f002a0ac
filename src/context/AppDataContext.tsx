'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  type AppAction,
  type AppState,
  type Expense,
  type FinishedGood,
  type Invoice,
  type Order,
  type OrderItem,
  type OrderStatus,
  type Product,
  type RawMaterial,
  type UserRole,
} from '@/types';
import { addDays, formatISO, subDays } from 'date-fns';

const STORAGE_KEY = 'khakhra-business-state-v1';

const sampleProducts: Product[] = [
  {
    id: 'plain',
    name: 'Plain Khakhra',
    variety: 'Classic',
    description: 'Traditional plain khakhra perfect for tea time.',
    salePrice: 35,
    costPrice: 18,
    gstRate: 0.05,
    unit: 'packet',
    defaultBatchSize: 200,
  },
  {
    id: 'masala',
    name: 'Masala Khakhra',
    variety: 'Spicy',
    description: 'Signature blend of spices with authentic crunch.',
    salePrice: 40,
    costPrice: 20,
    gstRate: 0.05,
    unit: 'packet',
    defaultBatchSize: 250,
  },
  {
    id: 'jeera',
    name: 'Jeera Khakhra',
    variety: 'Savory',
    description: 'Roasted cumin infused khakhra loved by all.',
    salePrice: 38,
    costPrice: 19,
    gstRate: 0.05,
    unit: 'packet',
    defaultBatchSize: 200,
  },
  {
    id: 'methi',
    name: 'Methi Khakhra',
    variety: 'Herbal',
    description: 'Fenugreek enriched healthy khakhra.',
    salePrice: 42,
    costPrice: 21,
    gstRate: 0.05,
    unit: 'packet',
    defaultBatchSize: 180,
  },
  {
    id: 'garlic',
    name: 'Garlic Khakhra',
    variety: 'Premium',
    description: 'Garlic flavoured khakhra with premium spices.',
    salePrice: 44,
    costPrice: 23,
    gstRate: 0.12,
    unit: 'packet',
    defaultBatchSize: 160,
  },
  {
    id: 'diet',
    name: 'Diet Khakhra',
    variety: 'Health',
    description: 'Low-oil khakhra for health-conscious customers.',
    salePrice: 45,
    costPrice: 24,
    gstRate: 0.05,
    unit: 'packet',
    defaultBatchSize: 220,
  },
];

const sampleRawMaterials: RawMaterial[] = [
  {
    id: 'rm-wheat',
    name: 'Whole Wheat Flour',
    unit: 'kg',
    quantity: 280,
    reorderLevel: 150,
    lastUpdated: formatISO(subDays(new Date(), 2)),
  },
  {
    id: 'rm-oil',
    name: 'Cold Pressed Oil',
    unit: 'litre',
    quantity: 95,
    reorderLevel: 60,
    lastUpdated: formatISO(subDays(new Date(), 1)),
  },
  {
    id: 'rm-spice',
    name: 'Masala Mix',
    unit: 'kg',
    quantity: 70,
    reorderLevel: 40,
    lastUpdated: formatISO(subDays(new Date(), 3)),
  },
  {
    id: 'rm-pack',
    name: 'Vacuum Packaging Sleeves',
    unit: 'pack',
    quantity: 450,
    reorderLevel: 180,
    lastUpdated: formatISO(new Date()),
  },
];

const sampleFinishedGoods: FinishedGood[] = [
  {
    id: 'fg-101',
    productId: 'masala',
    batchCode: 'MS2410-A',
    quantity: 220,
    reorderLevel: 120,
    mfgDate: formatISO(subDays(new Date(), 4)),
    expiryDate: formatISO(addDays(new Date(), 120)),
  },
  {
    id: 'fg-102',
    productId: 'plain',
    batchCode: 'PL2410-B',
    quantity: 180,
    reorderLevel: 100,
    mfgDate: formatISO(subDays(new Date(), 6)),
    expiryDate: formatISO(addDays(new Date(), 150)),
  },
  {
    id: 'fg-103',
    productId: 'jeera',
    batchCode: 'JR2410-C',
    quantity: 140,
    reorderLevel: 90,
    mfgDate: formatISO(subDays(new Date(), 3)),
    expiryDate: formatISO(addDays(new Date(), 130)),
  },
  {
    id: 'fg-104',
    productId: 'diet',
    batchCode: 'DT2410-A',
    quantity: 110,
    reorderLevel: 80,
    mfgDate: formatISO(subDays(new Date(), 2)),
    expiryDate: formatISO(addDays(new Date(), 90)),
  },
];

const sampleCustomers = [
  {
    id: 'cust-001',
    name: 'Kavya Patel',
    email: 'kavya.patel@example.com',
    phone: '+91-98981-22334',
    address: 'Ahmedabad, Gujarat',
    gstNumber: '24ABCDE1234F1Z5',
    repeatCount: 6,
    isWholesale: false,
  },
  {
    id: 'cust-002',
    name: 'Delight Stores',
    email: 'orders@delightstores.in',
    phone: '+91-97238-11223',
    address: 'Vadodara, Gujarat',
    gstNumber: '24ASDFG4587H1Z2',
    isWholesale: true,
    repeatCount: 10,
  },
  {
    id: 'cust-003',
    name: 'Healthy Bite Mart',
    email: 'buyer@healthybite.in',
    phone: '+91-98765-10101',
    address: 'Surat, Gujarat',
    gstNumber: '24GHJKL9988T1Z1',
    isWholesale: true,
    repeatCount: 3,
  },
  {
    id: 'cust-004',
    name: 'Priya Shah',
    email: 'priya.shah@example.com',
    phone: '+91-90909-55665',
    address: 'Mumbai, Maharashtra',
    repeatCount: 4,
    isWholesale: false,
  },
];

const makeOrder = (
  partial: Omit<Order, 'totalAmount' | 'gstAmount'> & {
    discountAmount?: number;
    shippingCost?: number;
  },
  products: Product[],
): Order => {
  const gstAmount = partial.items.reduce((acc, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return acc;
    return acc + item.unitPrice * item.quantity * product.gstRate;
  }, 0);
  const gross = partial.items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0,
  );
  const total =
    gross + (partial.shippingCost ?? 0) - (partial.discountAmount ?? 0) + gstAmount;

  return {
    ...partial,
    gstAmount,
    totalAmount: parseFloat(total.toFixed(2)),
  };
};

const sampleOrders: Order[] = [
  makeOrder(
    {
      id: 'ord-001',
      orderNumber: 'KH-24001',
      customerId: 'cust-001',
      items: [
        { productId: 'masala', quantity: 12, unitPrice: 40, costPrice: 20 },
        { productId: 'plain', quantity: 8, unitPrice: 35, costPrice: 18 },
      ],
      status: 'delivered',
      paymentMethod: 'upi',
      createdAt: formatISO(subDays(new Date(), 6)),
      deliveredAt: formatISO(subDays(new Date(), 4)),
      discountAmount: 50,
      shippingCost: 60,
      expectedShipDate: formatISO(subDays(new Date(), 5)),
      invoiceNumber: 'INV-24001',
    },
    sampleProducts,
  ),
  makeOrder(
    {
      id: 'ord-002',
      orderNumber: 'KH-24002',
      customerId: 'cust-002',
      items: [
        { productId: 'masala', quantity: 80, unitPrice: 38, costPrice: 20 },
        { productId: 'jeera', quantity: 60, unitPrice: 36, costPrice: 19 },
      ],
      status: 'processing',
      paymentMethod: 'bank_transfer',
      createdAt: formatISO(subDays(new Date(), 2)),
      expectedShipDate: formatISO(addDays(new Date(), 1)),
      discountAmount: 200,
      shippingCost: 350,
    },
    sampleProducts,
  ),
  makeOrder(
    {
      id: 'ord-003',
      orderNumber: 'KH-24003',
      customerId: 'cust-003',
      items: [
        { productId: 'diet', quantity: 45, unitPrice: 45, costPrice: 24 },
        { productId: 'garlic', quantity: 30, unitPrice: 44, costPrice: 23 },
      ],
      status: 'shipped',
      paymentMethod: 'bank_transfer',
      createdAt: formatISO(subDays(new Date(), 1)),
      expectedShipDate: formatISO(addDays(new Date(), 1)),
      shippingCost: 280,
    },
    sampleProducts,
  ),
  makeOrder(
    {
      id: 'ord-004',
      orderNumber: 'KH-24004',
      customerId: 'cust-004',
      items: [
        { productId: 'methi', quantity: 15, unitPrice: 42, costPrice: 21 },
        { productId: 'plain', quantity: 10, unitPrice: 35, costPrice: 18 },
      ],
      status: 'pending',
      paymentMethod: 'card',
      createdAt: formatISO(new Date()),
      shippingCost: 80,
    },
    sampleProducts,
  ),
  makeOrder(
    {
      id: 'ord-005',
      orderNumber: 'KH-24005',
      customerId: 'cust-001',
      items: [
        { productId: 'diet', quantity: 12, unitPrice: 45, costPrice: 24 },
      ],
      status: 'delivered',
      paymentMethod: 'upi',
      createdAt: formatISO(subDays(new Date(), 12)),
      deliveredAt: formatISO(subDays(new Date(), 10)),
      discountAmount: 20,
    },
    sampleProducts,
  ),
];

const sampleExpenses: Expense[] = [
  {
    id: 'exp-001',
    category: 'raw_materials',
    description: 'Bulk purchase of wheat flour',
    amount: 32000,
    paidTo: 'Shree Traders',
    date: formatISO(subDays(new Date(), 5)),
    paymentMode: 'bank_transfer',
  },
  {
    id: 'exp-002',
    category: 'delivery',
    description: 'Courier charges for western region',
    amount: 4200,
    paidTo: 'BlueDart Logistics',
    date: formatISO(subDays(new Date(), 2)),
    paymentMode: 'upi',
  },
  {
    id: 'exp-003',
    category: 'labor',
    description: 'Weekly wages for packaging staff',
    amount: 18500,
    paidTo: 'Staff Payroll',
    date: formatISO(subDays(new Date(), 3)),
    paymentMode: 'bank_transfer',
    recurring: true,
  },
  {
    id: 'exp-004',
    category: 'utilities',
    description: 'Electricity bill for unit',
    amount: 7200,
    paidTo: 'Torrent Power',
    date: formatISO(subDays(new Date(), 7)),
    paymentMode: 'bank_transfer',
  },
];

const sampleInvoices: Invoice[] = [
  {
    id: 'inv-001',
    orderId: 'ord-001',
    invoiceNumber: 'INV-24001',
    issuedOn: formatISO(subDays(new Date(), 6)),
    dueDate: formatISO(subDays(new Date(), 1)),
    amount: sampleOrders[0].totalAmount,
    gstAmount: sampleOrders[0].gstAmount ?? 0,
    paymentStatus: 'paid',
  },
  {
    id: 'inv-002',
    orderId: 'ord-002',
    invoiceNumber: 'INV-24002',
    issuedOn: formatISO(subDays(new Date(), 2)),
    dueDate: formatISO(addDays(new Date(), 5)),
    amount: sampleOrders[1].totalAmount,
    gstAmount: sampleOrders[1].gstAmount ?? 0,
    paymentStatus: 'unpaid',
  },
];

const randomId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const defaultState: AppState = {
  customers: sampleCustomers,
  products: sampleProducts,
  inventory: {
    rawMaterials: sampleRawMaterials,
    finishedGoods: sampleFinishedGoods,
  },
  orders: sampleOrders,
  expenses: sampleExpenses,
  invoices: sampleInvoices,
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_APP_STATE':
      return action.payload;
    case 'ADD_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
      };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id ? action.payload : order,
        ),
      };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.id
            ? {
                ...order,
                status: action.payload.status,
                deliveredAt:
                  action.payload.status === 'delivered'
                    ? formatISO(new Date())
                    : order.deliveredAt,
                cancelledAt:
                  action.payload.status === 'cancelled'
                    ? formatISO(new Date())
                    : order.cancelledAt,
              }
            : order,
        ),
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [action.payload, ...state.expenses],
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((expense) => expense.id !== action.payload),
      };
    case 'ADD_INVOICE':
      return {
        ...state,
        invoices: [action.payload, ...state.invoices],
      };
    case 'ADJUST_RAW_MATERIAL':
      return {
        ...state,
        inventory: {
          ...state.inventory,
          rawMaterials: state.inventory.rawMaterials.map((rm) =>
            rm.id === action.payload.id
              ? {
                  ...rm,
                  quantity: Math.max(rm.quantity + action.payload.quantity, 0),
                  lastUpdated: action.payload.lastUpdated ?? formatISO(new Date()),
                }
              : rm,
          ),
        },
      };
    case 'ADJUST_FINISHED_GOOD':
      return {
        ...state,
        inventory: {
          ...state.inventory,
          finishedGoods: state.inventory.finishedGoods.map((fg) =>
            fg.id === action.payload.id
              ? {
                  ...fg,
                  quantity: Math.max(fg.quantity + action.payload.quantity, 0),
                }
              : fg,
          ),
        },
      };
    case 'CREATE_FINISHED_GOOD_BATCH':
      return {
        ...state,
        inventory: {
          ...state.inventory,
          finishedGoods: [action.payload, ...state.inventory.finishedGoods],
        },
      };
    default:
      return state;
  }
};

interface AppDataContextValue extends AppState {
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  createOrder: (input: {
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: Order['paymentMethod'];
    status?: OrderStatus;
    discountAmount?: number;
    shippingCost?: number;
    note?: string;
    expectedShipDate?: string;
  }) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  recordExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  createInvoiceForOrder: (orderId: string, issuedOn?: string) => Invoice | undefined;
  replenishRawMaterial: (id: string, quantity: number) => void;
  consumeRawMaterial: (id: string, quantity: number) => void;
  produceFinishedBatch: (data: Omit<FinishedGood, 'id'>) => void;
  consumeFinishedGoods: (productId: string, quantity: number) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

const generateOrderNumber = (orders: Order[]) => {
  const numericParts = orders
    .map((order) => parseInt(order.orderNumber.replace(/[^0-9]/g, ''), 10))
    .filter((num) => !Number.isNaN(num));
  const max = numericParts.length ? Math.max(...numericParts) : 24000;
  return `KH-${max + 1}`;
};

const generateInvoiceNumber = (invoices: Invoice[]) => {
  const numericParts = invoices
    .map((invoice) => parseInt(invoice.invoiceNumber.replace(/[^0-9]/g, ''), 10))
    .filter((num) => !Number.isNaN(num));
  const max = numericParts.length ? Math.max(...numericParts) : 24000;
  return `INV-${max + 1}`;
};

const adjustStockForOrder = (state: AppState, order: Order): AppState => {
  let updatedState = { ...state };
  order.items.forEach((item) => {
    const finished = updatedState.inventory.finishedGoods.find(
      (fg) => fg.productId === item.productId,
    );
    if (finished) {
      updatedState = reducer(updatedState, {
        type: 'ADJUST_FINISHED_GOOD',
        payload: { id: finished.id, quantity: -item.quantity },
      });
    }
  });
  return updatedState;
};

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [state, dispatch] = useReducer(reducer, defaultState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppState;
        dispatch({ type: 'SET_APP_STATE', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to load stored app state', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedRole = window.sessionStorage.getItem('khakhra-role');
    if (storedRole) {
      setRole(storedRole as UserRole);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (role) {
      window.sessionStorage.setItem('khakhra-role', role);
    } else {
      window.sessionStorage.removeItem('khakhra-role');
    }
  }, [role]);

  const value = useMemo<AppDataContextValue>(() => {
    const createOrder: AppDataContextValue['createOrder'] = ({
      customerId,
      items,
      paymentMethod,
      status = 'pending',
      discountAmount = 0,
      shippingCost = 0,
      note,
      expectedShipDate,
    }) => {
      const orderItems: OrderItem[] = items.map((entry) => {
        const product = state.products.find((prod) => prod.id === entry.productId);
        if (!product) {
          throw new Error(`Product not found for ${entry.productId}`);
        }
        return {
          productId: product.id,
          quantity: entry.quantity,
          unitPrice: product.salePrice,
          costPrice: product.costPrice,
        };
      });

      const orderBase: Omit<Order, 'totalAmount' | 'gstAmount'> = {
        id: `ord-${randomId()}`,
        orderNumber: generateOrderNumber(state.orders),
        customerId,
        items: orderItems,
        status,
        paymentMethod,
        createdAt: formatISO(new Date()),
        discountAmount,
        shippingCost,
        note,
        expectedShipDate,
      };

      const order = makeOrder(orderBase, state.products);

      let updatedState = reducer(state, { type: 'ADD_ORDER', payload: order });
      updatedState = adjustStockForOrder(updatedState, order);
      dispatch({ type: 'SET_APP_STATE', payload: updatedState });
      return order;
    };

    const updateOrderStatus: AppDataContextValue['updateOrderStatus'] = (
      id,
      status,
    ) => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { id, status } });
    };

    const recordExpense: AppDataContextValue['recordExpense'] = (expense) => {
      dispatch({
        type: 'ADD_EXPENSE',
        payload: { id: `exp-${randomId()}`, ...expense },
      });
    };

    const removeExpense: AppDataContextValue['removeExpense'] = (id) => {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    };

    const createInvoiceForOrder: AppDataContextValue['createInvoiceForOrder'] = (
      orderId,
      issuedOn,
    ) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return undefined;
      const invoice: Invoice = {
        id: `inv-${randomId()}`,
        orderId,
        invoiceNumber: generateInvoiceNumber(state.invoices),
        issuedOn: issuedOn ?? formatISO(new Date()),
        dueDate: formatISO(addDays(new Date(issuedOn ?? Date.now()), 7)),
        amount: order.totalAmount,
        gstAmount: order.gstAmount ?? 0,
        paymentStatus: 'unpaid',
      };
      dispatch({ type: 'ADD_INVOICE', payload: invoice });
      return invoice;
    };

    const replenishRawMaterial: AppDataContextValue['replenishRawMaterial'] = (
      id,
      quantity,
    ) => {
      dispatch({ type: 'ADJUST_RAW_MATERIAL', payload: { id, quantity } });
    };

    const consumeRawMaterial: AppDataContextValue['consumeRawMaterial'] = (
      id,
      quantity,
    ) => {
      dispatch({ type: 'ADJUST_RAW_MATERIAL', payload: { id, quantity: -quantity } });
    };

    const produceFinishedBatch: AppDataContextValue['produceFinishedBatch'] = (
      data,
    ) => {
      const batch: FinishedGood = {
        id: `fg-${randomId()}`,
        ...data,
      };
      dispatch({ type: 'CREATE_FINISHED_GOOD_BATCH', payload: batch });
    };

    const consumeFinishedGoods: AppDataContextValue['consumeFinishedGoods'] = (
      productId,
      quantity,
    ) => {
      const fg = state.inventory.finishedGoods.find((item) => item.productId === productId);
      if (!fg) return;
      dispatch({ type: 'ADJUST_FINISHED_GOOD', payload: { id: fg.id, quantity: -quantity } });
    };

    return {
      ...state,
      role,
      setRole,
      createOrder,
      updateOrderStatus,
      recordExpense,
      removeExpense,
      createInvoiceForOrder,
      replenishRawMaterial,
      consumeRawMaterial,
      produceFinishedBatch,
      consumeFinishedGoods,
    };
  }, [role, state]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};
