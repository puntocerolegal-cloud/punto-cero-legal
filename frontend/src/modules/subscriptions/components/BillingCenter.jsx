import React, { useMemo } from "react";
import { DataTable, StatusBadge } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

// Estado de factura → tono/label.
const STATUS = {
  paid:    { tone: "normal",   label: "Pagado" },
  pending: { tone: "atencion", label: "Pendiente" },
  overdue: { tone: "critico",  label: "Vencido" },
  review:  { tone: "pending",  label: "En revisión" },
};

/**
 * Billing Center — facturas con estado (Pagado/Pendiente/Vencido/En revisión).
 * Reutiliza DataTable + StatusBadge. Incluye resumen superior.
 */
export function BillingCenter({ invoices = [] }) {
  const totals = useMemo(() => {
    const sum = (st) => invoices.filter((i) => i.status === st).reduce((s, i) => s + (i.amount || 0), 0);
    return { paid: sum("paid"), pending: sum("pending"), overdue: sum("overdue"), review: sum("review") };
  }, [invoices]);

  const columns = [
    { key: "invoice", label: "Factura", sortable: true, render: (r) => <span className="text-white">{r.invoice}</span> },
    { key: "company", label: "Cliente", sortable: true },
    { key: "amount", label: "Monto", sortable: true, render: (r) => money(r.amount) },
    { key: "date", label: "Fecha", sortable: true },
    { key: "status", label: "Estado", render: (r) => {
        const s = STATUS[r.status] || { tone: "normal", label: r.status };
        return <StatusBadge tone={s.tone} label={s.label} />;
      } },
  ];

  const summary = [
    { label: "Pagado", value: totals.paid, tone: "normal" },
    { label: "Pendiente", value: totals.pending, tone: "atencion" },
    { label: "Vencido", value: totals.overdue, tone: "critico" },
    { label: "En revisión", value: totals.review, tone: "pending" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <StatusBadge tone={s.tone} label={s.label} />
            <div className="mt-2 text-lg font-bold text-white">{money(s.value)}</div>
          </div>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={invoices}
        pageSize={6}
        searchKeys={["invoice", "company"]}
        empty={{ title: "Sin facturas", description: "No hay facturas registradas." }}
      />
    </div>
  );
}

export default BillingCenter;
