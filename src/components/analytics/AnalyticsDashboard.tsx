'use client';

import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import {
  buildRevenueSeries,
  buildTopProducts,
  calculateSeasonalDemand,
  calculateRepeatRate,
} from '@/lib/calculations';
import { formatCurrency } from '@/lib/format';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const tooltipFormatter = (value: number) => formatCurrency(value);

export const AnalyticsDashboard = () => {
  const { orders, products } = useAppData();

  const topProducts = buildTopProducts(orders, products);
  const revenueSeries = buildRevenueSeries(orders);
  const seasonalDemand = calculateSeasonalDemand(orders);
  const repeatRate = calculateRepeatRate(orders).toFixed(1);

  return (
    <SectionCard
      title="Sales Intelligence"
      description="Visualise growth patterns, product traction and repeat business for smarter planning."
      actionSlot={<span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Repeat Rate {repeatRate}%</span>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl border border-neutral-200 bg-white/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={tooltipFormatter} labelStyle={{ color: '#374151' }} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={1} yAxisId={1} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-72 rounded-3xl border border-neutral-200 bg-white/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={tooltipFormatter} labelStyle={{ color: '#374151' }} />
              <Bar dataKey="revenue" fill="#fb923c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="h-72 rounded-3xl border border-neutral-200 bg-white/80 p-4">
          <h3 className="mb-2 text-sm font-semibold text-neutral-700">Seasonal Demand (Revenue)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonalDemand}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={tooltipFormatter} labelStyle={{ color: '#374151' }} />
              <Bar dataKey="revenue" fill="#34d399" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white/80 p-6">
          <h3 className="text-sm font-semibold text-neutral-700">Insights</h3>
          <ul className="mt-3 space-y-3 text-sm text-neutral-600">
            <li>
              • Masala and Diet variants lead revenue; ensure consistent raw material supply for these
              products.
            </li>
            <li>• Revenue peaks align with recent retail promotions—plan upcoming offers around high demand months.</li>
            <li>• Repeat customer rate signifies strong loyalty; consider subscription packs for metros.</li>
          </ul>
        </div>
      </div>
    </SectionCard>
  );
};
