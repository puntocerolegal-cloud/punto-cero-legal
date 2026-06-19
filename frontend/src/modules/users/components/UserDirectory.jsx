import React from "react";
import { DataTable } from "@/shared/components";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserActions } from "./UserActions";

/**
 * Directorio global de usuarios — reutiliza DataTable.
 * La búsqueda/filtros avanzados los maneja el page; aquí se desactiva la
 * búsqueda interna para no duplicar (searchable=false).
 */
export function UserDirectory({ data = [], onAction, busyId }) {
  const columns = [
    { key: "name", label: "Nombre", sortable: true, render: (r) => (
        <div>
          <div className="text-white font-medium">{r.name}</div>
          <div className="text-[11px] text-white/40">{r.email}</div>
        </div>
      ) },
    { key: "role", label: "Rol", sortable: true },
    { key: "organization", label: "Organización", sortable: true },
    { key: "vertical", label: "Vertical", sortable: true },
    { key: "plan", label: "Plan", sortable: true },
    { key: "status", label: "Estado", render: (r) => <UserStatusBadge status={r.status} /> },
    { key: "createdAt", label: "Creación", sortable: true },
    { key: "lastAccess", label: "Último acceso", sortable: true },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={false}
      pageSize={8}
      actions={(row) => <UserActions user={row} onAction={onAction} busy={busyId === row._id} />}
      empty={{ title: "Sin usuarios", description: "No hay usuarios para los filtros seleccionados." }}
    />
  );
}

export default UserDirectory;
