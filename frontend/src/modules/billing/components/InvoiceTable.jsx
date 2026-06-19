import React from "react";
import { DataTable, StatusBadge } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

// Estado de factura → tono/label.
const STATUS = {
  paid:    { tone: "normal",   label: "Pagada" },
  pending: { tone: "atencion", label: "Pendiente" },
  overdue: { tone: "critico",  label: "Vencida" },
  review:  { tone: "pending",  label: "En revisión" },
};

/**
 * Centro de Facturas — reutiliza DataTable (búsqueda + orden + paginación).
 */
export function InvoiceTable({ data = [] }) {
  const columns = [
    { key: "invoice", label: "Factura", sortable: true, render: (r) => <span className="text-white">{r.invoice}</span> },
    { key: "client", label: "Cliente", sortable: true },
    { key: "vertical", label: "Vertical", sortable: true },
    { key: "issued", label: "Emisión", sortable: true },
    { key: "due", label: "Vencimiento", sortable: true },
    { key: "amount", label: "Valor", sortable: true, render: (r) => money(r.amount) },
    { key: "status", label: "Estado", render: (r) => {
        const s = STATUS[r.status] || { tone: "normal", label: r.status };
        return <StatusBadge tone={s.tone} label={s.label} />;
      } },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={8}
      searchKeys={["invoice", "client", "vertical"]}
      empty={{ title: "Sin facturas", description: "No hay facturas que coincidan con la búsqueda." }}
    />
  );
}

export default InvoiceTable;
