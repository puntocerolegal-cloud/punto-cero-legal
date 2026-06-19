import React from "react";
import { DataTable, StatusBadge } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

// Mapa estado de suscripción → tono/label de semáforo.
const STATUS = {
  active:    { tone: "normal",   label: "Activa" },
  trial:     { tone: "atencion", label: "Trial" },
  past_due:  { tone: "riesgo",   label: "Pago vencido" },
  cancelled: { tone: "critico",  label: "Cancelada" },
};

/**
 * Tabla de suscripciones activas — reutiliza DataTable (búsqueda + paginación).
 */
export function ActiveSubscriptions({ data = [] }) {
  const columns = [
    { key: "company", label: "Empresa", sortable: true, render: (r) => <span className="text-white">{r.company}</span> },
    { key: "vertical", label: "Vertical", sortable: true },
    { key: "plan", label: "Plan", sortable: true },
    { key: "status", label: "Estado", render: (r) => {
        const s = STATUS[r.status] || { tone: "normal", label: r.status };
        return <StatusBadge tone={s.tone} label={s.label} />;
      } },
    { key: "renewal", label: "Renovación", sortable: true },
    { key: "monthly", label: "Valor mensual", sortable: true, render: (r) => money(r.monthly) },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={6}
      searchKeys={["company", "vertical", "plan"]}
      empty={{ title: "Sin suscripciones", description: "Aún no hay suscripciones registradas." }}
    />
  );
}

export default ActiveSubscriptions;
