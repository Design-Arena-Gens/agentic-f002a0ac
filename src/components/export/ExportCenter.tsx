'use client';

import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/format';
import { calculateOrderRevenue, calculateOrderCost } from '@/lib/calculations';

export const ExportCenter = () => {
  const { orders, expenses, inventory, products, invoices } = useAppData();

  const exportToExcel = (sheetName: string) => {
    const workbook = XLSX.utils.book_new();

    if (sheetName === 'orders' || sheetName === 'all') {
      const orderSheet = XLSX.utils.json_to_sheet(
        orders.map((order) => ({
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          status: order.status,
          createdAt: order.createdAt,
          revenue: calculateOrderRevenue(order),
          gst: order.gstAmount ?? 0,
          total: order.totalAmount,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, orderSheet, 'Orders');
    }

    if (sheetName === 'inventory' || sheetName === 'all') {
      const rawSheet = XLSX.utils.json_to_sheet(
        inventory.rawMaterials.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
          lastUpdated: item.lastUpdated,
        })),
      );
      const finishedSheet = XLSX.utils.json_to_sheet(
        inventory.finishedGoods.map((item) => ({
          id: item.id,
          productId: item.productId,
          batchCode: item.batchCode,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
          mfgDate: item.mfgDate,
          expiryDate: item.expiryDate,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, rawSheet, 'RawMaterials');
      XLSX.utils.book_append_sheet(workbook, finishedSheet, 'FinishedGoods');
    }

    if (sheetName === 'finance' || sheetName === 'all') {
      const invoiceSheet = XLSX.utils.json_to_sheet(
        invoices.map((invoice) => ({
          invoiceNumber: invoice.invoiceNumber,
          orderId: invoice.orderId,
          issuedOn: invoice.issuedOn,
          amount: invoice.amount,
          gst: invoice.gstAmount,
          paymentStatus: invoice.paymentStatus,
        })),
      );
      const expenseSheet = XLSX.utils.json_to_sheet(
        expenses.map((expense) => ({
          date: expense.date,
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          paidTo: expense.paidTo,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, invoiceSheet, 'Invoices');
      XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Expenses');
    }

    XLSX.writeFile(workbook, `khakhra-${sheetName}.xlsx`);
  };

  const exportSummaryPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Khakhra Command Center - Executive Summary', 14, 18);
    doc.setFontSize(10);

    const revenue = orders.reduce((acc, order) => acc + calculateOrderRevenue(order), 0);
    const cogs = orders.reduce((acc, order) => acc + calculateOrderCost(order), 0);
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const gstCollected = orders.reduce((acc, order) => acc + (order.gstAmount ?? 0), 0);

    const overview = [
      ['Total Orders', orders.length.toString()],
      ['Revenue', formatCurrency(revenue)],
      ['COGS', formatCurrency(cogs)],
      ['Gross Profit', formatCurrency(revenue - cogs)],
      ['Expenses', formatCurrency(totalExpenses)],
      ['GST Collected', formatCurrency(gstCollected)],
    ];

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: overview,
      startY: 30,
    });

    const lastTableMeta = (doc as unknown as {
      lastAutoTable?: { finalY: number };
    }).lastAutoTable;
    const inventoryStart = (lastTableMeta?.finalY ?? 120) + 10;
    doc.text('Low Stock Finished Goods', 14, inventoryStart);
    const lowStock = inventory.finishedGoods.filter((item) => item.quantity <= item.reorderLevel);
    autoTable(doc, {
      head: [['Batch', 'Product', 'Quantity', 'Reorder Level']],
      body: lowStock.map((item) => {
        const product = products.find((prod) => prod.id === item.productId);
        return [item.batchCode, product?.name ?? item.productId, item.quantity.toString(), item.reorderLevel.toString()];
      }),
      startY: inventoryStart + 6,
    });

    doc.save('khakhra-summary.pdf');
  };

  return (
    <SectionCard
      title="Exports & Reporting"
      description="Share structured data with distribution partners, auditors and accounting software."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white/70 p-4 text-sm">
          <h3 className="font-semibold text-neutral-800">Orders & Sales</h3>
          <p className="mt-2 text-neutral-600">
            Export order books with customer mapping, revenue, GST and payment method for CRM or ERP uploads.
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30"
            onClick={() => exportToExcel('orders')}
          >
            Download Excel
          </button>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white/70 p-4 text-sm">
          <h3 className="font-semibold text-neutral-800">Inventory Health</h3>
          <p className="mt-2 text-neutral-600">
            Provide stock positions for raw and finished goods to procurement teams and offline warehouses.
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30"
            onClick={() => exportToExcel('inventory')}
          >
            Export Inventory XLSX
          </button>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white/70 p-4 text-sm">
          <h3 className="font-semibold text-neutral-800">Finance Pack</h3>
          <p className="mt-2 text-neutral-600">
            Bundle invoices and expenses to hand over to accountants or to import inside Tally/Zoho Books.
          </p>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              className="w-full rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30"
              onClick={() => exportToExcel('finance')}
            >
              Export Finance XLSX
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-600"
              onClick={exportSummaryPdf}
            >
              PDF Summary
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-dashed border-neutral-300 bg-white/40 p-4 text-xs text-neutral-500">
        All exports are generated client-side, ensuring your data stays within your trusted environment before sharing externally.
      </div>
    </SectionCard>
  );
};
