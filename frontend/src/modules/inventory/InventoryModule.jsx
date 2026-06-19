import React, { useState, useMemo } from "react";
import { Package, Layers, ArrowDownCircle, ArrowUpCircle, Boxes, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DataTable, MetricCard, StatusBadge, EmptyState } from "@/shared/components";
import { useInventory } from "@/hooks/os";

/**
 * Módulo Inventario — Punto Cero OS (estructura base, SOLO UI).
 * Pestañas: Productos · Categorías · Entradas · Salidas · Stock · Alertas.
 * Reutiliza shared/ (DataTable, MetricCard, StatusBadge). Sin backend aún.
 */
const TABS = [
  { key: "products", label: "Productos", icon: Package },
  { key: "categories", label: "Categorías", icon: Layers },
  { key: "in", label: "Entradas", icon: ArrowDownCircle },
  { key: "out", label: "Salidas", icon: ArrowUpCircle },
  { key: "stock", label: "Stock", icon: Boxes },
  { key: "alerts", label: "Alertas", icon: AlertTriangle },
];

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

export function InventoryModule() {
  const { data } = useInventory();
  const { PRODUCTS, CATEGORIES, MOVEMENTS_IN, MOVEMENTS_OUT } = data;
  const [tab, setTab] = useState("products");

  const lowStock = useMemo(() => PRODUCTS.filter((p) => p.stock <= p.min), [PRODUCTS]);

  return (
    <div className="space-y-6">
      {/* Aviso de módulo demo */}
      <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] px-4 py-2.5 text-xs text-[#f59e0b]">
        Módulo Inventario en fase de arquitectura · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Productos" value={PRODUCTS.length} icon={Package} accent="#3b82f6" />
        <MetricCard title="Categorías" value={CATEGORIES.length} icon={Layers} accent="#8b5cf6" />
        <MetricCard title="Stock total" value={PRODUCTS.reduce((s, p) => s + p.stock, 0)} icon={Boxes} accent="#10b981" />
        <MetricCard title="Alertas de stock" value={lowStock.length} icon={AlertTriangle} accent="#ef4444" subtitle="bajo mínimo" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              tab === t.key
                ? "bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 text-white border-[#f97316]/30"
                : "text-white/60 border-white/10 hover:text-white hover:bg-white/5"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "products" && (
        <DataTable
          data={PRODUCTS}
          columns={[
            { key: "sku", label: "SKU", sortable: true },
            { key: "name", label: "Producto", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
            { key: "category", label: "Categoría", sortable: true },
            { key: "stock", label: "Stock", sortable: true },
            { key: "price", label: "Precio", sortable: true, render: (r) => money(r.price) },
            { key: "status", label: "Estado", render: (r) => <StatusBadge tone={r.status} /> },
          ]}
        />
      )}

      {tab === "categories" && (
        <DataTable
          data={CATEGORIES}
          columns={[
            { key: "name", label: "Categoría", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
            { key: "products", label: "Productos", sortable: true },
            { key: "status", label: "Estado", render: (r) => <StatusBadge tone={r.status} /> },
          ]}
        />
      )}

      {tab === "in" && (
        <DataTable
          data={MOVEMENTS_IN}
          columns={[
            { key: "date", label: "Fecha", sortable: true },
            { key: "product", label: "Producto", sortable: true, render: (r) => <span className="text-white">{r.product}</span> },
            { key: "qty", label: "Cantidad", sortable: true, render: (r) => <span className="text-[#10b981]">+{r.qty}</span> },
            { key: "ref", label: "Referencia" },
            { key: "user", label: "Usuario" },
          ]}
        />
      )}

      {tab === "out" && (
        <DataTable
          data={MOVEMENTS_OUT}
          columns={[
            { key: "date", label: "Fecha", sortable: true },
            { key: "product", label: "Producto", sortable: true, render: (r) => <span className="text-white">{r.product}</span> },
            { key: "qty", label: "Cantidad", sortable: true, render: (r) => <span className="text-[#ef4444]">-{r.qty}</span> },
            { key: "ref", label: "Referencia" },
            { key: "user", label: "Usuario" },
          ]}
        />
      )}

      {tab === "stock" && (
        <DataTable
          data={PRODUCTS}
          columns={[
            { key: "name", label: "Producto", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
            { key: "stock", label: "Stock actual", sortable: true },
            { key: "min", label: "Mínimo", sortable: true },
            {
              key: "health",
              label: "Semáforo",
              render: (r) =>
                r.stock === 0 ? <StatusBadge tone="critico" label="Agotado" />
                : r.stock <= r.min ? <StatusBadge tone="riesgo" label="Bajo" />
                : <StatusBadge tone="normal" label="Suficiente" />,
            },
          ]}
        />
      )}

      {tab === "alerts" && (
        lowStock.length ? (
          <DataTable
            data={lowStock}
            columns={[
              { key: "name", label: "Producto", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
              { key: "stock", label: "Stock", sortable: true },
              { key: "min", label: "Mínimo", sortable: true },
              { key: "alert", label: "Estado", render: (r) => <StatusBadge tone={r.stock === 0 ? "critico" : "riesgo"} label={r.stock === 0 ? "Agotado" : "Reponer"} /> },
            ]}
          />
        ) : (
          <EmptyState icon={AlertTriangle} title="Sin alertas de stock" description="Todos los productos están por encima de su mínimo." />
        )
      )}
    </div>
  );
}

export default InventoryModule;
