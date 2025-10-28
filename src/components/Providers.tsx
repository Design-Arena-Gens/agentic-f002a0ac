'use client';

import { AppDataProvider } from '@/context/AppDataContext';

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <AppDataProvider>{children}</AppDataProvider>;
};
