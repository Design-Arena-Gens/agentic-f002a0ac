import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { Expense, Order, Product } from '@/types';

export const calculateOrderRevenue = (order: Order) =>
  order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

export const calculateOrderCost = (order: Order) =>
  order.items.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);

export const calculateOrderGrossProfit = (order: Order) =>
  calculateOrderRevenue(order) - calculateOrderCost(order);

export const calculateOrderNetProfit = (order: Order, allocatedExpenses = 0) =>
  calculateOrderGrossProfit(order) - allocatedExpenses;

interface ProfitLossAggregate {
  revenue: number;
  costOfGoodsSold: number;
  expenses: number;
}

const periodFormat: Record<'daily' | 'weekly' | 'monthly', string> = {
  daily: 'dd MMM',
  weekly: "wo 'week'",
  monthly: 'MMM yyyy',
};

const getPeriodKey = (date: Date, mode: keyof typeof periodFormat) => {
  switch (mode) {
    case 'daily':
      return format(date, 'yyyy-MM-dd');
    case 'weekly':
      return format(date, "yyyy-'W'II");
    case 'monthly':
    default:
      return format(date, 'yyyy-MM');
  }
};

export const buildProfitLoss = (
  orders: Order[],
  expenses: Expense[],
  mode: 'daily' | 'weekly' | 'monthly',
) => {
  const map = new Map<string, ProfitLossAggregate>();

  orders.forEach((order) => {
    const date = parseISO(order.createdAt);
    const key = getPeriodKey(date, mode);
    const entry = map.get(key) ?? { revenue: 0, costOfGoodsSold: 0, expenses: 0 };
    entry.revenue += calculateOrderRevenue(order);
    entry.costOfGoodsSold += calculateOrderCost(order);
    map.set(key, entry);
  });

  expenses.forEach((expense) => {
    const date = parseISO(expense.date);
    const key = getPeriodKey(date, mode);
    const entry = map.get(key) ?? { revenue: 0, costOfGoodsSold: 0, expenses: 0 };
    entry.expenses += expense.amount;
    map.set(key, entry);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([key, value]) => ({
      periodKey: key,
      label: format(parseISO(`${key}-01`), periodFormat[mode]),
      revenue: Number(value.revenue.toFixed(2)),
      costOfGoodsSold: Number(value.costOfGoodsSold.toFixed(2)),
      expenses: Number(value.expenses.toFixed(2)),
      netProfit: Number((value.revenue - value.costOfGoodsSold - value.expenses).toFixed(2)),
      grossProfit: Number((value.revenue - value.costOfGoodsSold).toFixed(2)),
    }));
};

export const summarizeOrders = (orders: Order[]) => {
  const revenue = orders.reduce((acc, order) => acc + calculateOrderRevenue(order), 0);
  const cost = orders.reduce((acc, order) => acc + calculateOrderCost(order), 0);
  const gst = orders.reduce((acc, order) => acc + (order.gstAmount ?? 0), 0);
  const delivered = orders.filter((order) => order.status === 'delivered').length;
  const cancelled = orders.filter((order) => order.status === 'cancelled').length;

  return {
    revenue,
    cost,
    gst,
    grossProfit: revenue - cost,
    delivered,
    cancelled,
  };
};

export const buildTopProducts = (orders: Order[], products: Product[]) => {
  const map = new Map<string, { quantity: number; revenue: number; cost: number }>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return;
      const entry = map.get(product.name) ?? { quantity: 0, revenue: 0, cost: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.unitPrice * item.quantity;
      entry.cost += item.costPrice * item.quantity;
      map.set(product.name, entry);
    });
  });

  return Array.from(map.entries())
    .map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: Number(stats.revenue.toFixed(2)),
      profit: Number((stats.revenue - stats.cost).toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
};

export const buildRevenueSeries = (orders: Order[]) => {
  const map = new Map<string, { revenue: number; orders: number }>();
  orders.forEach((order) => {
    const day = format(startOfDay(parseISO(order.createdAt)), 'yyyy-MM-dd');
    const entry = map.get(day) ?? { revenue: 0, orders: 0 };
    entry.revenue += calculateOrderRevenue(order);
    entry.orders += 1;
    map.set(day, entry);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([date, value]) => ({
      date,
      label: format(parseISO(date), 'dd MMM'),
      revenue: Number(value.revenue.toFixed(2)),
      orders: value.orders,
    }));
};

export const calculateRepeatRate = (orders: Order[]) => {
  const counts = new Map<string, number>();
  orders.forEach((order) => {
    const current = counts.get(order.customerId) ?? 0;
    counts.set(order.customerId, current + 1);
  });
  const totalCustomers = counts.size;
  const repeaters = Array.from(counts.values()).filter((count) => count > 1).length;
  return totalCustomers === 0 ? 0 : (repeaters / totalCustomers) * 100;
};

export const calculateSeasonalDemand = (orders: Order[]) => {
  const monthMap = new Map<string, number>();
  orders.forEach((order) => {
    const month = format(parseISO(order.createdAt), 'MMM yyyy');
    const existing = monthMap.get(month) ?? 0;
    monthMap.set(month, existing + calculateOrderRevenue(order));
  });
  return Array.from(monthMap.entries())
    .map(([name, value]) => ({ name, revenue: Number(value.toFixed(2)) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
};

export const filterOrdersByDate = (orders: Order[], start: string, end: string) => {
  const startDate = startOfDay(parseISO(start));
  const endDate = endOfDay(parseISO(end));
  return orders.filter((order) => {
    const date = parseISO(order.createdAt);
    return date >= startDate && date <= endDate;
  });
};
