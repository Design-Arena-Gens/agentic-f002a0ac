'use client';

import { useState } from 'react';
import { SectionCard } from '@/components/SectionCard';
import { useAppData } from '@/context/AppDataContext';
import { formatDate, formatNumber } from '@/lib/format';
import { addDays, formatISO } from 'date-fns';

export const InventoryManagement = () => {
  const {
    inventory,
    products,
    replenishRawMaterial,
    consumeRawMaterial,
    produceFinishedBatch,
    consumeFinishedGoods,
    role,
  } = useAppData();

  const [rawAdjustment, setRawAdjustment] = useState<Record<string, number>>({});
  const [consumeQty, setConsumeQty] = useState<Record<string, number>>({});
  const [batchProductId, setBatchProductId] = useState(products[0]?.id ?? '');
  const [batchQuantity, setBatchQuantity] = useState(180);

  const handleRawUpdate = (id: string, value: number) => {
    setRawAdjustment((prev) => ({ ...prev, [id]: value }));
  };

  const commitRawAdjustment = (id: string, direction: 'add' | 'consume') => {
    const value = rawAdjustment[id];
    if (!value || value <= 0) return;
    if (direction === 'add') {
      replenishRawMaterial(id, value);
    } else {
      consumeRawMaterial(id, value);
    }
    setRawAdjustment((prev) => ({ ...prev, [id]: 0 }));
  };

  const commitFinishedConsumption = (productId: string) => {
    const value = consumeQty[productId];
    if (!value || value <= 0) return;
    consumeFinishedGoods(productId, value);
    setConsumeQty((prev) => ({ ...prev, [productId]: 0 }));
  };

  const makeBatch = () => {
    const product = products.find((prod) => prod.id === batchProductId);
    if (!product) return;
    const today = new Date();
    produceFinishedBatch({
      productId: product.id,
      batchCode: `${product.id.toUpperCase()}-${today.getMonth() + 1}${today.getDate()}-${
        Math.floor(Math.random() * 90) + 10
      }`,
      quantity: batchQuantity,
      reorderLevel: Math.round(batchQuantity * 0.4),
      mfgDate: formatISO(today),
      expiryDate: formatISO(addDays(today, 120)),
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Raw Material Stores"
        description="Track wheat, oil, spices and packaging inventory with actionable replenishment controls."
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">On Hand</th>
              <th className="px-3 py-2">Reorder Level</th>
              <th className="px-3 py-2">Last Updated</th>
              {(role === 'admin' || role === 'staff') && <th className="px-3 py-2">Adjust</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {inventory.rawMaterials.map((material) => {
              const balanceClass =
                material.quantity <= material.reorderLevel
                  ? 'text-red-600'
                  : material.quantity <= material.reorderLevel * 1.5
                    ? 'text-amber-600'
                    : 'text-emerald-700';
              return (
                <tr key={material.id} className="align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-neutral-800">{material.name}</div>
                    <div className="text-xs text-neutral-500">#{material.id}</div>
                  </td>
                  <td className={`px-3 py-3 font-semibold ${balanceClass}`}>
                    {formatNumber(material.quantity)} {material.unit}
                  </td>
                  <td className="px-3 py-3 text-neutral-600">
                    {formatNumber(material.reorderLevel)} {material.unit}
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-500">
                    {formatDate(material.lastUpdated)}
                  </td>
                  {(role === 'admin' || role === 'staff') && (
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          className="w-24 rounded-xl border border-neutral-200 px-3 py-1 text-sm"
                          placeholder="Qty"
                          value={rawAdjustment[material.id] ?? ''}
                          onChange={(event) => handleRawUpdate(material.id, Number(event.target.value))}
                        />
                        <button
                          type="button"
                          onClick={() => commitRawAdjustment(material.id, 'add')}
                          className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => commitRawAdjustment(material.id, 'consume')}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500"
                        >
                          Consume
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard
        title="Finished Goods Batches"
        description="Maintain visibility on current khakhra batches and generate fresh production lots."
        actionSlot={
          (role === 'admin' || role === 'staff') && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-200 bg-white/50 p-3 text-sm">
              <select
                className="rounded-xl border border-neutral-200 px-3 py-2"
                value={batchProductId}
                onChange={(event) => setBatchProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={10}
                value={batchQuantity}
                onChange={(event) => setBatchQuantity(Number(event.target.value))}
                className="w-24 rounded-xl border border-neutral-200 px-3 py-2"
              />
              <button
                type="button"
                onClick={makeBatch}
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/30"
              >
                Create Batch
              </button>
            </div>
          )
        }
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Reorder</th>
              <th className="px-3 py-2">MFG → EXP</th>
              {(role === 'admin' || role === 'staff') && <th className="px-3 py-2">Reserve / Consume</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {inventory.finishedGoods.map((batch) => {
              const product = products.find((prod) => prod.id === batch.productId);
              const lowStock = batch.quantity <= batch.reorderLevel;
              return (
                <tr key={batch.id} className={lowStock ? 'bg-red-50/40' : undefined}>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-neutral-800">{batch.batchCode}</div>
                    <div className="text-xs text-neutral-500">#{batch.id}</div>
                  </td>
                  <td className="px-3 py-3 text-neutral-700">{product?.name}</td>
                  <td className="px-3 py-3 font-semibold text-neutral-800">
                    {formatNumber(batch.quantity)} pkts
                  </td>
                  <td className="px-3 py-3 text-neutral-600">
                    {formatNumber(batch.reorderLevel)} pkts
                  </td>
                  <td className="px-3 py-3 text-xs text-neutral-500">
                    {formatDate(batch.mfgDate)} → {formatDate(batch.expiryDate)}
                  </td>
                  {(role === 'admin' || role === 'staff') && (
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          className="w-24 rounded-xl border border-neutral-200 px-3 py-1 text-sm"
                          value={consumeQty[batch.productId] ?? ''}
                          onChange={(event) =>
                            setConsumeQty((prev) => ({
                              ...prev,
                              [batch.productId]: Number(event.target.value),
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => commitFinishedConsumption(batch.productId)}
                          className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-600"
                        >
                          Reserve for orders
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
};
