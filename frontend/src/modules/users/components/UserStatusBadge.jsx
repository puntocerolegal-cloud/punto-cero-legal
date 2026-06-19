import React from "react";
import { StatusBadge } from "@/shared/components";

// Estado de usuario → tono/label del semáforo OS.
export const USER_STATUS_META = {
  ACTIVO:     { label: "Activo",     tone: "active" },
  INACTIVO:   { label: "Inactivo",   tone: "inactive" },
  SUSPENDIDO: { label: "Suspendido", tone: "critico" },
  PENDIENTE:  { label: "Pendiente",  tone: "pending" },
};

export function UserStatusBadge({ status }) {
  const meta = USER_STATUS_META[status] || { label: status, tone: "normal" };
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export default UserStatusBadge;
