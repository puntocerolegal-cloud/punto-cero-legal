// Módulo Socios Comerciales — Punto Cero OS.
// Datos NEUTRALIZADOS: la fuente real es el backend (partners.service vía API).
// Estructura preservada; sin empresas ficticias ni importes legacy.

export const KPIS = {
  leads: 0,
  companies: 0,
  activeVerticals: 0,
  activePartners: 0,
  conversions: 0,
  commissionsGenerated: 0,
};

export const OPPORTUNITIES = [];

// Etapas del pipeline (configuración de UI, no datos legacy).
export const PIPELINE_STAGES = [
  { key: "lead", label: "Lead", accent: "#3b82f6" },
  { key: "contactado", label: "Contactado", accent: "#6366f1" },
  { key: "calificado", label: "Calificado", accent: "#8b5cf6" },
  { key: "propuesta", label: "Propuesta", accent: "#f59e0b" },
  { key: "negociacion", label: "Negociación", accent: "#f97316" },
  { key: "convertido", label: "Convertido", accent: "#10b981" },
];

export const VERTICALS = [];
export const PARTNERS = [];

export const COMMISSIONS = {
  month: 0,
  accumulated: 0,
  projection: 0,
  top: [],
};

export const OPERATIONS = {
  newLeads: 0,
  pendingProposals: 0,
  activeNegotiations: 0,
  contractsToSign: 0,
  verticalsInImplementation: 0,
  pendingCommissions: 0,
};
