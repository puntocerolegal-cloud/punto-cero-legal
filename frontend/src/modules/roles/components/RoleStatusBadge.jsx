import React from "react";
import { StatusBadge } from "@/shared/components";

export const ROLE_STATUS_META = {
  ACTIVO:   { label: "Activo",   tone: "active" },
  INACTIVO: { label: "Inactivo", tone: "inactive" },
};

export function RoleStatusBadge({ status }) {
  const meta = ROLE_STATUS_META[status] || { label: status, tone: "normal" };
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export default RoleStatusBadge;
