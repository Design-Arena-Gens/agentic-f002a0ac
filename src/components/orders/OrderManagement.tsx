'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { OrderStatus } from '@/types';
import { SectionCard } from '@/components/SectionCard';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateOrderRevenue } from '@/lib/calculations';

const statusOptions: { label: string; value: OrderStatus }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface OrderItemDraft {
  productId: string;
  quantity: number;
}

export const OrderManagement = () => {
  const { customers, products, orders, createOrder, updateOrderStatus, role } = useAppData();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [items, setItems] = useState<OrderItemDraft[]>([
    { productId: products[0]?.id ?? '', quantity: 10 },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'bank_transfer'>(
    'upi',
  );
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(80);
  const [note, setNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  const orderPreview = useMemo(() => {
    const enriched = items
      .map((item) => {
        const product = products.find((prod) => prod.id === item.productId);
        if (!product) return null;
        return {
          ...item,
          name: product.name,
          salePrice: product.salePrice,
          total: product.salePrice * item.quantity,
        };
      })
      .filter(Boolean) as Array<{ productId: string; quantity: number; name: string; salePrice: number; total: number }>;

    const subTotal = enriched.reduce((acc, item) => acc + item.total, 0);
    const gst = enriched.reduce((acc, item) => {
      const product = products.find((prod) => prod.id === item.productId);
      return product ? acc + item.total * product.gstRate : acc;
    }, 0);
    const grandTotal = subTotal + gst + shippingCost - discountAmount;
    return { items: enriched, subTotal, gst, grandTotal };
  }, [items, products, discountAmount, shippingCost]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  const handleItemChange = (index: number, patch: Partial<OrderItemDraft>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addProductRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: products[Math.min(prev.length, products.length - 1)]?.id ?? '', quantity: 10 },
    ]);
  };

  const removeProductRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateOrder = () => {
    if (!customerId || items.some((item) => !item.productId || item.quantity <= 0)) return;
    const order = createOrder({
      customerId,
      items,
      paymentMethod,
      discountAmount,
      shippingCost,
      note,
    });
    setItems([{ productId: products[0]?.id ?? '', quantity: 10 }]);
    setDiscountAmount(0);
    setShippingCost(80);
    setNote('');
    if (order) {
      const customer = customers.find((c) => c.id === order.customerId);
      alert(`Order ${order.orderNumber} created for ${customer?.name ?? 'customer'}`);
    }
  };

  return (
    <div className="space-y-6">
      {(role === 'admin' || role === 'staff') && (
        <SectionCard
          title="Customer Order Creation"
          description="Capture new online orders, assign production priorities, and auto compute GST inclusive totals."
          actionSlot={
            <div className="flex gap-3">
              <select
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as OrderStatus | 'all')}
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    View {status.label}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Customer
                  </span>
                  <select
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                  >
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Payment Method
                  </span>
                  <select
                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as typeof paymentMethod)
                    }
                  >
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-700">Order Lines</p>
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600"
                  >
                    + Add product
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="grid gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-3 sm:grid-cols-[2fr_1fr_auto]"
                    >
                      <select
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        value={item.productId}
                        onChange={(event) =>
                          handleItemChange(index, { productId: event.target.value })
                        }
                      >
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        value={item.quantity}
                        onChange={(event) =>
                          handleItemChange(index, { quantity: Number(event.target.value) })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeProductRow(index)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-500"
                        disabled={items.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Internal note / packing instructions
                </span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="E.g. Use double vacuum for masala khakhra, add tasting pack"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-orange-200 bg-orange-50/70 p-4">
                <header className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-orange-700">Order Summary</p>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                    {items.length} Products
                  </span>
                </header>
                <div className="space-y-3 text-sm text-orange-900">
                  {orderPreview.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <span>
                        {item.name} <em className="text-xs text-orange-700">× {item.quantity}</em>
                      </span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <hr className="border-orange-200" />
                  <div className="flex items-center justify-between">
                    <span>Sub total</span>
                    <span>{formatCurrency(orderPreview.subTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <input
                      type="number"
                      value={shippingCost}
                      onChange={(event) => setShippingCost(Number(event.target.value))}
                      className="w-24 rounded-lg border border-orange-200 bg-white/80 px-2 py-1 text-right text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(event) => setDiscountAmount(Number(event.target.value))}
                      className="w-24 rounded-lg border border-orange-200 bg-white/80 px-2 py-1 text-right text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST (auto)</span>
                    <span>{formatCurrency(orderPreview.gst)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span>Grand total</span>
                    <span>{formatCurrency(orderPreview.grandTotal)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
                  disabled={orderPreview.items.length === 0}
                >
                  Create & reserve inventory
                </button>
              </div>
              <p className="text-xs text-neutral-500">
                Inventory for finished goods will be automatically reduced from the oldest batch. Update
                status as production progresses to keep finance and shipping teams aligned.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      <SectionCard
        title="Order Tracker"
        description="Monitor every customer order from creation to delivery with live status controls."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Products</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.map((order) => {
                const customer = customers.find((cust) => cust.id === order.customerId);
                return (
                  <tr key={order.id} className="align-top">
                    <td className="px-3 py-3 font-semibold text-neutral-800">{order.orderNumber}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-800">{customer?.name}</span>
                        <span className="text-xs text-neutral-500">{customer?.phone}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <ul className="space-y-1">
                        {order.items.map((item) => {
                          const product = products.find((p) => p.id === item.productId);
                          return (
                            <li key={`${order.id}-${item.productId}`} className="text-xs text-neutral-600">
                              {product?.name} × {item.quantity}
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : order.status === 'processing'
                              ? 'bg-amber-100 text-amber-700'
                              : order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-700'
                                : order.status === 'pending'
                                  ? 'bg-neutral-100 text-neutral-700'
                                  : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-neutral-500">
                      <div className="flex flex-col gap-1">
                        <span>Created: {formatDate(order.createdAt)}</span>
                        {order.deliveredAt && <span>Delivered: {formatDate(order.deliveredAt)}</span>}
                        {order.expectedShipDate && (
                          <span>Dispatch ETA: {formatDate(order.expectedShipDate)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-neutral-800">
                      {formatCurrency(calculateOrderRevenue(order))}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                              order.status === option.value
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-orange-300'
                            }`}
                            onClick={() => updateOrderStatus(order.id, option.value)}
                            disabled={order.status === option.value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};
