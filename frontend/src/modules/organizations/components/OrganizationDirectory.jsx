import React from "react";
import { DataTable, StatusBadge } from "@/shared/components";

const STATUS = {
  active:    { tone: "normal",   label: "Activa" },
  trial:     { tone: "atencion", label: "Trial" },
  at_risk:   { tone: "riesgo",   label: "En riesgo" },
  suspended: { tone: "critico",  label: "Suspendida" },
};

/**
 * Directorio de organizaciones — reutiliza DataTable (búsqueda + paginación).
 */
export function OrganizationDirectory({ data = [], onRowClick }) {
  const columns = [
    { key: "name", label: "Organización", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
    { key: "vertical", label: "Vertical", sortable: true },
    { key: "plan", label: "Plan", sortable: true },
    { key: "users", label: "Usuarios", sortable: true },
    { key: "status", label: "Estado", render: (r) => {
        const s = STATUS[r.status] || { tone: "normal", label: r.status };
        return <StatusBadge tone={s.tone} label={s.label} />;
      } },
    { key: "joined", label: "Fecha alta", sortable: true },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={6}
      searchKeys={["name", "vertical", "plan"]}
      onRowClick={onRowClick}
      empty={{ title: "Sin organizaciones", description: "Aún no hay organizaciones registradas." }}
    />
  );
}

export default OrganizationDirectory;
