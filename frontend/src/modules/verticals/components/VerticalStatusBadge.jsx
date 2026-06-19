import React from "react";
import { StatusBadge } from "@/shared/components";

// Mapa de estados del Motor Multivertical → tono/label del semáforo OS.
// ACTIVA | DESARROLLO | PLANEACION | PAUSADA | DESHABILITADA
export const STATUS_META = {
  ACTIVA:        { label: "Activa",        tone: "normal" },
  DESARROLLO:    { label: "Desarrollo",    tone: "atencion" },
  PLANEACION:    { label: "Planeación",    tone: "inactive" },
  PAUSADA:       { label: "Pausada",       tone: "riesgo" },
  DESHABILITADA: { label: "Deshabilitada", tone: "critico" },
};

/** Semáforo de estado de una vertical (reutiliza StatusBadge global). */
export function VerticalStatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, tone: "normal" };
  return <StatusBadge tone={meta.tone} label={meta.label} />;
}

export default VerticalStatusBadge;
