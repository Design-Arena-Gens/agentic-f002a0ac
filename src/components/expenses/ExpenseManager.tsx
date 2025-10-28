'use client';

import { useState } from 'react';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { Expense } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

const categories: Array<{ value: Expense['category']; label: string }> = [
  { value: 'raw_materials', label: 'Raw Materials' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'delivery', label: 'Delivery & Logistics' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'labor', label: 'Labor' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

export const ExpenseManager = () => {
  const { expenses, recordExpense, removeExpense, role } = useAppData();
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    category: 'raw_materials',
    description: '',
    amount: 0,
    paidTo: '',
    date: new Date().toISOString(),
    paymentMode: 'upi',
    recurring: false,
  });

  const updateField = <K extends keyof Omit<Expense, 'id'>>(
    key: K,
    value: Omit<Expense, 'id'>[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitExpense = () => {
    if (!form.description || form.amount <= 0) return;
    recordExpense(form);
    setForm({
      category: 'raw_materials',
      description: '',
      amount: 0,
      paidTo: '',
      date: new Date().toISOString(),
      paymentMode: 'upi',
      recurring: false,
    });
  };

  const totalSpend = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  return (
    <SectionCard
      title="Expense Control"
      description="Log packaging, delivery, labor and other operational spends for cashflow accuracy."
      actionSlot={<span className="text-xs font-semibold text-neutral-500">MTD Spend: {formatCurrency(totalSpend)}</span>}
    >
      {(role === 'admin' || role === 'accountant') && (
        <div className="mb-6 grid gap-4 rounded-3xl border border-neutral-200 bg-white/70 p-4 md:grid-cols-2">
          <div className="space-y-3">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Category
              <select
                value={form.category}
                onChange={(event) => updateField('category', event.target.value as Expense['category'])}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Description
              <input
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                placeholder="Eg. Courier charges for south zone"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Paid To
              <input
                value={form.paidTo}
                onChange={(event) => updateField('paidTo', event.target.value)}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                placeholder="Supplier / Vendor"
              />
            </label>
          </div>
          <div className="space-y-3">
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Amount (₹)
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={(event) => updateField('amount', Number(event.target.value))}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Date
              <input
                type="date"
                value={form.date.slice(0, 10)}
                onChange={(event) => updateField('date', new Date(event.target.value).toISOString())}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Payment Mode
              <select
                value={form.paymentMode}
                onChange={(event) => updateField('paymentMode', event.target.value as Expense['paymentMode'])}
                className="rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              >
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(event) => updateField('recurring', event.target.checked)}
              />
              Recurring expense
            </label>
            <button
              type="button"
              onClick={submitExpense}
              className="w-full rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30"
            >
              Log expense
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Mode</th>
              {(role === 'admin' || role === 'accountant') && <th className="px-3 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="px-3 py-3 text-xs text-neutral-500">{formatDate(expense.date)}</td>
                <td className="px-3 py-3 font-medium text-neutral-800">
                  {categories.find((category) => category.value === expense.category)?.label ??
                    expense.category}
                </td>
                <td className="px-3 py-3 text-neutral-600">{expense.description}</td>
                <td className="px-3 py-3 text-neutral-600">{expense.paidTo}</td>
                <td className="px-3 py-3 font-semibold text-neutral-800">{formatCurrency(expense.amount)}</td>
                <td className="px-3 py-3 text-neutral-600 uppercase">{expense.paymentMode}</td>
                {(role === 'admin' || role === 'accountant') && (
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => removeExpense(expense.id)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};
