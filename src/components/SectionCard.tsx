'use client';

import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  actionSlot?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ title, description, actionSlot, children }: SectionCardProps) => {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-xl shadow-orange-100/60 backdrop-blur">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          {description && <p className="text-sm text-neutral-500">{description}</p>}
        </div>
        {actionSlot}
      </header>
      <div className="overflow-x-auto text-sm text-neutral-700">{children}</div>
    </section>
  );
};
