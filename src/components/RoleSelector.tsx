'use client';

import { useAppData } from '@/context/AppDataContext';
import { UserRole } from '@/types';
import { useState } from 'react';

const roleDescriptions: Record<UserRole, string> = {
  admin: 'Full access to orders, inventory, analytics, and configuration.',
  staff: 'Manage production batches, inventory movements, and order fulfilment.',
  accountant: 'View invoices, track P&L, manage expenses and exports.',
};

const options: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff (Packing & Fulfilment)' },
  { value: 'accountant', label: 'Accountant' },
];

export const RoleSelector = () => {
  const { setRole } = useAppData();
  const [selected, setSelected] = useState<UserRole>('admin');

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-orange-200 bg-white/70 p-8 shadow-xl shadow-orange-200/40 backdrop-blur">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Khakhra Command Center Login
          </h1>
          <p className="text-sm text-neutral-600">
            Choose your responsibility area to continue managing the business operations.
          </p>
        </div>

        <div className="space-y-4">
          {options.map((option) => (
            <label
              key={option.value}
              className={`block cursor-pointer rounded-xl border p-4 transition hover:shadow-lg ${
                selected === option.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={selected === option.value}
                  onChange={() => setSelected(option.value)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-neutral-900">{option.label}</p>
                  <p className="text-sm text-neutral-600">{roleDescriptions[option.value]}</p>
                </div>
              </div>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRole(selected)}
          className="w-full rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
        >
          Enter Command Center
        </button>
      </div>
    </div>
  );
};
