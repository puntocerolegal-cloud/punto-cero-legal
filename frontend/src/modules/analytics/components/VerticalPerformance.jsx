import React from "react";
import { DataTable, StatusBadge, PriorityBadge } from "@/shared/components";

/**
 * Performance por vertical — clientes, ingresos, conversiones, implementaciones,
 * crecimiento. Reutiliza DataTable + StatusBadge + PriorityBadge.
 * props.data: [{ name, clients, revenue, conversions, implementations, growth, risk, status }]
 */
export function VerticalPerformance({ data = [] }) {
  const columns = [
    { key: "name", label: "Vertical", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
    { key: "clients", label: "Clientes", sortable: true },
    { key: "revenue", label: "Ingresos", sortable: true, render: (r) => `$${r.revenue}M` },
    { key: "conversions", label: "Conversión", sortable: true, render: (r) => `${r.conversions}%` },
    { key: "implementations", label: "Implementaciones", sortable: true },
    { key: "growth", label: "Crecimiento", sortable: true, render: (r) => <span className="text-[#10b981]">+{r.growth}%</span> },
    { key: "risk", label: "Riesgo", render: (r) => <PriorityBadge level={r.risk} /> },
    { key: "status", label: "Estado", render: (r) => <StatusBadge tone={r.status} /> },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={false}
      pageSize={10}
      empty={{ title: "Sin datos de verticales" }}
    />
  );
}

export default VerticalPerformance;
