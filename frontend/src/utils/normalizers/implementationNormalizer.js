import { mapVertical } from "@/utils/mappers";

// Mapa de etapa backend (inglés) → etapa UI (español, claves del ImplementationBoard).
const STAGE_MAP = {
  sold: "vendido",
  kickoff: "kickoff",
  configuration: "configuracion",
  migration: "pruebas",
  training: "capacitacion",
  go_live: "golive",
  operation: "operacion",
};

const RISK_TO_PRIORITY = { critical: "urgente", high: "alta", medium: "media", low: "baja" };

/**
 * Normaliza una implementación del backend al shape que usan
 * ImplementationsDashboard / ImplementationBoard / ImplementationCard / GoLivePanel.
 * Idempotente con el mock (que ya viene en español).
 */
export function normalizeImplementation(raw = {}) {
  return {
    id: raw.id || raw._id || "",
    company: raw.company || raw.companyName || "—",
    vertical: mapVertical(raw.vertical),
    owner: raw.owner || raw.projectManager || "—",
    stage: STAGE_MAP[raw.stage] || raw.stage || "vendido",
    progress: raw.progress ?? 0,
    dueDate: raw.dueDate || raw.goLiveDate || "",
    priority: raw.priority || RISK_TO_PRIORITY[raw.riskLevel] || "media",
    checklistDone: raw.checklistDone ?? 0,
    risk: typeof raw.risk === "boolean" ? raw.risk : ["high", "critical"].includes(raw.riskLevel),
    blocked: typeof raw.blocked === "boolean" ? raw.blocked : raw.status === "blocked",
  };
}

export function normalizeImplementations(list = []) {
  return Array.isArray(list) ? list.map(normalizeImplementation) : [];
}

export default normalizeImplementation;
