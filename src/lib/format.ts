import { format, parseISO } from 'date-fns';

export const formatCurrency = (value: number, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);

export const formatDate = (value?: string) => {
  if (!value) return '—';
  return format(parseISO(value), 'dd MMM yyyy');
};

export const formatPercentage = (value: number, decimals = 1) =>
  `${value.toFixed(decimals)}%`;
