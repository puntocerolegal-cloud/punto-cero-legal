import React from "react";
import { DataTable } from "@/shared/components";
import { RoleStatusBadge } from "./RoleStatusBadge";

/** Directorio de roles — reutiliza DataTable. */
export function RoleDirectory({ data = [], onRowClick }) {
  const columns = [
    { key: "name", label: "Rol", sortable: true, render: (r) => (
        <div>
          <div className="text-white font-medium">{r.name}</div>
          <div className="text-[11px] text-white/40 font-mono">{r.key}</div>
        </div>
      ) },
    { key: "description", label: "Descripción", render: (r) => <span className="text-white/60">{r.description}</span> },
    { key: "users", label: "Usuarios", sortable: true },
    { key: "verticals", label: "Verticales", render: (r) => (r.verticals || []).join(", ") || "—" },
    { key: "status", label: "Estado", render: (r) => <RoleStatusBadge status={r.status} /> },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={8}
      searchKeys={["name", "key", "description"]}
      onRowClick={onRowClick}
      empty={{ title: "Sin roles", description: "Aún no hay roles registrados." }}
    />
  );
}

export default RoleDirectory;
