'use client';

import { useMemo, useState } from 'react';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { buildProfitLoss } from '@/lib/calculations';
import { formatCurrency } from '@/lib/format';

const views = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

export const ProfitLossPanel = () => {
  const { orders, expenses } = useAppData();
  const [mode, setMode] = useState<(typeof views)[number]['value']>('weekly');

  const rows = useMemo(() => buildProfitLoss(orders, expenses, mode), [mode, orders, expenses]);

  return (
    <SectionCard
      title="Profit & Loss Ledger"
      description="Automated COGS and expense reconciliation to surface real profitability across timelines."
      actionSlot={
        <div className="flex gap-2 rounded-full border border-neutral-200 bg-white/70 p-1 text-xs">
          {views.map((view) => (
            <button
              key={view.value}
              type="button"
              onClick={() => setMode(view.value)}
              className={`rounded-full px-4 py-1 font-semibold ${
                mode === view.value
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/40'
                  : 'text-neutral-600'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2">COGS</th>
              <th className="px-3 py-2">Gross Profit</th>
              <th className="px-3 py-2">Expenses</th>
              <th className="px-3 py-2">Net Profit</th>
              <th className="px-3 py-2">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => {
              const margin = row.revenue === 0 ? 0 : ((row.netProfit / row.revenue) * 100).toFixed(1);
              return (
                <tr key={row.periodKey}>
                  <td className="px-3 py-3 font-semibold text-neutral-800">{row.label}</td>
                  <td className="px-3 py-3 text-neutral-700">{formatCurrency(row.revenue)}</td>
                  <td className="px-3 py-3 text-neutral-700">{formatCurrency(row.costOfGoodsSold)}</td>
                  <td className="px-3 py-3 font-medium text-emerald-700">{formatCurrency(row.grossProfit)}</td>
                  <td className="px-3 py-3 text-neutral-700">{formatCurrency(row.expenses)}</td>
                  <td className={`px-3 py-3 font-semibold ${row.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatCurrency(row.netProfit)}
                  </td>
                  <td className="px-3 py-3 text-neutral-700">{margin}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};
