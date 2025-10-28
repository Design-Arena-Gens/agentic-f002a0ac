'use client';

import { useMemo } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { SectionCard } from '@/components/SectionCard';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';
import {
  calculateRepeatRate,
  summarizeOrders,
} from '@/lib/calculations';

const tileBase = 'flex flex-col gap-1 rounded-2xl border border-white/40 bg-gradient-to-br p-4 shadow-lg text-white';

export const KpiTiles = () => {
  const { orders, expenses, inventory } = useAppData();

  const data = useMemo(() => {
    const summary = summarizeOrders(orders);
    const expenseTotal = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const repeatRate = calculateRepeatRate(orders);
    const lowStock = inventory.finishedGoods.filter((item) => item.quantity <= item.reorderLevel).length;
    return {
      revenue: formatCurrency(summary.revenue),
      grossProfit: formatCurrency(summary.grossProfit),
      expense: formatCurrency(expenseTotal),
      gst: formatCurrency(summary.gst),
      delivered: formatNumber(summary.delivered),
      repeatRate: formatPercentage(repeatRate),
      lowStock,
    };
  }, [orders, expenses, inventory.finishedGoods]);

  return (
    <SectionCard
      title="Business Pulse"
      description="Snapshot of collective operations across orders, finance, and inventory."
    >
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <article className={`${tileBase} from-orange-400/90 to-rose-500/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">Revenue (MTD)</span>
          <p className="text-2xl font-semibold">{data.revenue}</p>
          <p className="text-xs text-white/70">Total order value booked this month</p>
        </article>
        <article className={`${tileBase} from-orange-500/90 to-amber-500/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">Gross Profit</span>
          <p className="text-2xl font-semibold">{data.grossProfit}</p>
          <p className="text-xs text-white/70">After accounting for raw material cost</p>
        </article>
        <article className={`${tileBase} from-rose-500/90 to-red-500/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">Expenses (MTD)</span>
          <p className="text-2xl font-semibold">{data.expense}</p>
          <p className="text-xs text-white/70">Operational spends recorded this month</p>
        </article>
        <article className={`${tileBase} from-emerald-500/90 to-teal-500/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">GST Collected</span>
          <p className="text-2xl font-semibold">{data.gst}</p>
          <p className="text-xs text-white/70">Accrued GST value from invoices</p>
        </article>
        <article className={`${tileBase} from-indigo-500/90 to-purple-500/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">Orders Delivered</span>
          <p className="text-2xl font-semibold">{data.delivered}</p>
          <p className="text-xs text-white/70">Completed orders contributing to revenue</p>
        </article>
        <article className={`${tileBase} from-lime-500/90 to-green-500/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">Repeat Customer Rate</span>
          <p className="text-2xl font-semibold">{data.repeatRate}</p>
          <p className="text-xs text-white/70">Percentage of customers ordering again</p>
        </article>
        <article className={`${tileBase} from-slate-500/90 to-neutral-600/90`}>
          <span className="text-xs uppercase tracking-wide text-white/80">Low Stock Alerts</span>
          <p className="text-2xl font-semibold">{formatNumber(data.lowStock)}</p>
          <p className="text-xs text-white/70">Finished goods batches nearing reorder</p>
        </article>
      </div>
    </SectionCard>
  );
};
