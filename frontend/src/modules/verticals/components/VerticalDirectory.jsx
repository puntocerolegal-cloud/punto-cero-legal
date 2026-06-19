import React from "react";
import { DataTable } from "@/shared/components";
import { VerticalStatusBadge } from "./VerticalStatusBadge";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Directorio de verticales — reutiliza DataTable (búsqueda + paginación).
 */
export function VerticalDirectory({ data = [], onRowClick }) {
  const columns = [
    { key: "name", label: "Vertical", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
    { key: "status", label: "Estado", render: (r) => <VerticalStatusBadge status={r.status} /> },
    { key: "orgs", label: "Organizaciones", sortable: true },
    { key: "users", label: "Usuarios", sortable: true },
    { key: "activePlans", label: "Planes activos", sortable: true },
    { key: "mrr", label: "Ingresos", sortable: true, render: (r) => money(r.mrr) },
    { key: "growth", label: "Crecimiento", sortable: true, render: (r) => `${r.growth >= 0 ? "+" : ""}${r.growth}%` },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={6}
      searchKeys={["name", "status"]}
      onRowClick={onRowClick}
      empty={{ title: "Sin verticales", description: "Aún no hay verticales registradas en el motor." }}
    />
  );
}

export default VerticalDirectory;
