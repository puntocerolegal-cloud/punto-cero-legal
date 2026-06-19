import React from "react";
import { DataTable, StatusBadge } from "@/shared/components";

const STATUS = {
  active:   { tone: "normal",   label: "Activo" },
  inactive: { tone: "inactive", label: "Inactivo" },
  pending:  { tone: "atencion", label: "Pendiente" },
};

const ROLE_LABEL = { admin: "Administrador", admin_general: "Admin General", socio_comercial: "Socio Comercial", lawyer: "Profesional", client: "Cliente" };

/**
 * Usuarios de la organización — reutiliza DataTable.
 */
export function OrganizationUsers({ data = [] }) {
  const columns = [
    { key: "name", label: "Nombre", sortable: true, render: (r) => <span className="text-white">{r.name}</span> },
    { key: "email", label: "Email", sortable: true },
    { key: "role", label: "Rol", sortable: true, render: (r) => ROLE_LABEL[r.role] || r.role },
    { key: "status", label: "Estado", render: (r) => {
        const s = STATUS[r.status] || { tone: "normal", label: r.status };
        return <StatusBadge tone={s.tone} label={s.label} />;
      } },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={5}
      searchKeys={["name", "email", "role"]}
      empty={{ title: "Sin usuarios", description: "Esta organización no tiene usuarios cargados (demo)." }}
    />
  );
}

export default OrganizationUsers;
