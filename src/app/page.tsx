'use client';

import { useAppData } from '@/context/AppDataContext';
import { RoleSelector } from '@/components/RoleSelector';
import { KpiTiles } from '@/components/dashboard/KpiTiles';
import { OrderManagement } from '@/components/orders/OrderManagement';
import { InventoryManagement } from '@/components/inventory/InventoryManagement';
import { BillingCenter } from '@/components/billing/BillingCenter';
import { ProfitLossPanel } from '@/components/finance/ProfitLossPanel';
import { ExpenseManager } from '@/components/expenses/ExpenseManager';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ExportCenter } from '@/components/export/ExportCenter';

export default function Home() {
  const { role, setRole } = useAppData();

  if (!role) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
        <div className="mx-auto flex min-h-[80vh] items-center justify-center">
          <RoleSelector />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 pb-16">
      <header className="sticky top-0 z-30 border-b border-orange-100/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Khakhra Command Center</h1>
            <p className="text-sm text-neutral-500">
              Unified control on customer orders, manufacturing inventory, billing, and intelligent analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Active Role: {role}
            </span>
            <button
              type="button"
              onClick={() => setRole(null)}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:border-orange-300"
            >
              Switch role
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <KpiTiles />
        <OrderManagement />
        <InventoryManagement />
        <BillingCenter />
        <ProfitLossPanel />
        <ExpenseManager />
        <AnalyticsDashboard />
        <ExportCenter />
      </div>
    </main>
  );
}
