'use client';

import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { formatCurrency, formatDate } from '@/lib/format';
import { calculateOrderCost, calculateOrderRevenue } from '@/lib/calculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GST_LABEL = 'GSTIN: 24ABCDE1234F1Z5';

export const BillingCenter = () => {
  const { orders, invoices, customers, products, createInvoiceForOrder, role } = useAppData();

  const createInvoicePdf = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;
    const order = orders.find((ord) => ord.id === invoice.orderId);
    if (!order) return;
    const customer = customers.find((cust) => cust.id === order.customerId);

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Khakhra Command Center - Tax Invoice', 14, 20);
    doc.setFontSize(10);
    doc.text(GST_LABEL, 14, 28);

    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 14, 40);
    doc.text(`Invoice Date: ${formatDate(invoice.issuedOn)}`, 14, 46);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 14, 52);

    doc.text('Bill To:', 14, 64);
    doc.text(`${customer?.name ?? ''}`, 14, 70);
    if (customer?.gstNumber) doc.text(`GST: ${customer.gstNumber}`, 14, 76);
    doc.text(`${customer?.phone ?? ''}`, 14, 82);

    const tableData = order.items.map((item) => {
      const product = products.find((prod) => prod.id === item.productId);
      const amount = item.unitPrice * item.quantity;
      const gstRate = (product?.gstRate ?? 0) * 100;
      const gstValue = amount * (product?.gstRate ?? 0);
      return [
        product?.name ?? item.productId,
        item.quantity,
        formatCurrency(item.unitPrice),
        `${gstRate.toFixed(0)}%`,
        formatCurrency(amount + gstValue),
      ];
    });

    autoTable(doc, {
      head: [['Product', 'Qty', 'Rate', 'GST', 'Amount']],
      body: tableData,
      startY: 92,
    });

    const autoTableMeta = (doc as unknown as {
      lastAutoTable?: { finalY: number };
    }).lastAutoTable;
    const summaryStart = (autoTableMeta?.finalY ?? 120) + 10;
    doc.text(`Sub Total: ${formatCurrency(calculateOrderRevenue(order))}`, 140, summaryStart);
    doc.text(`GST: ${formatCurrency(invoice.gstAmount)}`, 140, summaryStart + 6);
    doc.text(`Total: ${formatCurrency(invoice.amount)}`, 140, summaryStart + 12);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const pendingOrders = orders.filter((order) => !invoices.some((invoice) => invoice.orderId === order.id));

  return (
    <div className="space-y-6">
      {(role === 'admin' || role === 'accountant') && (
        <SectionCard
          title="Generate GST Invoices"
          description="Create statutory invoices from delivered orders with a single click."
        >
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-neutral-500">All orders are invoiced. Great job keeping books updated!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingOrders.map((order) => {
                const customer = customers.find((cust) => cust.id === order.customerId);
                const revenue = calculateOrderRevenue(order);
                const cost = calculateOrderCost(order);
                return (
                  <div
                    key={order.id}
                    className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{order.orderNumber}</p>
                        <p className="text-xs text-neutral-500">{customer?.name}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Gross profit margin {(100 * (revenue - cost) / revenue).toFixed(1)}%
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30"
                      onClick={() => createInvoiceForOrder(order.id)}
                    >
                      Generate invoice
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        title="Invoice Library"
        description="All GST compliant invoices with payment tracking for finance and compliance."
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Invoice #</th>
              <th className="px-3 py-2">Order #</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Issued</th>
              <th className="px-3 py-2">GST</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoices.map((invoice) => {
              const order = orders.find((o) => o.id === invoice.orderId);
              const customer = customers.find((cust) => cust.id === order?.customerId);
              return (
                <tr key={invoice.id}>
                  <td className="px-3 py-3 font-semibold text-neutral-800">{invoice.invoiceNumber}</td>
                  <td className="px-3 py-3 text-neutral-600">{order?.orderNumber}</td>
                  <td className="px-3 py-3 text-neutral-600">{customer?.name}</td>
                  <td className="px-3 py-3 text-xs text-neutral-500">{formatDate(invoice.issuedOn)}</td>
                  <td className="px-3 py-3 text-neutral-700">{formatCurrency(invoice.gstAmount)}</td>
                  <td className="px-3 py-3 font-semibold text-neutral-800">{formatCurrency(invoice.amount)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        invoice.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-600'
                          : invoice.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => createInvoicePdf(invoice.id)}
                      className="rounded-lg border border-orange-200 px-3 py-1 text-xs font-semibold text-orange-600"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
};
