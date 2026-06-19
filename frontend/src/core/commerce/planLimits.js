// Núcleo comercial — límites, estados y features. Punto Cero Platform.
// Reutilizable por TODAS las verticales (Legal, Medicina, Odontología, Contabilidad…).
// Moneda base USD. Sin backend: los planes vienen del Motor de Planes (modules/plans).
import { PLANS } from "@/modules/plans/mockData";

// ── Estados del cliente ──
export const SUBSCRIPTION_STATES = {
  DEMO: "DEMO",
  TRIAL: "TRIAL",
  ACTIVO: "ACTIVO",
  VENCIDO: "VENCIDO",
  PENDIENTE_PAGO: "PENDIENTE_PAGO",
  CANCELADO: "CANCELADO",
};

// Trial: 3 días.
export const TRIAL_DAYS = 3;

// Límites del MODO DEMO (independientes del plan).
export const DEMO_LIMITS = {
  clients: 3,
  cases: 2,
  ai: 10,
  appointments: 3,
  meetings: 1,
  documents: 5,
  billing: 0,   // solo demostración
  portal: 0,    // vista previa
  api: 0,
};

// Features de plataforma (verticales-agnósticas) consumidas por las verticales.
export const FEATURES = {
  CRM: "crm",
  CASES: "cases",
  AGENDA: "agenda",
  AI: "ai",
  DOCUMENTS: "documents",
  PORTAL: "portal",
  BILLING: "billing",
  VIDEO: "video",
  AUTOMATIONS: "automations",
  API: "api",
};

// Requisito de cada feature respecto a los flags del plan (limits.*).
// null = disponible en todos los planes (sujeto a límites de conteo en DEMO).
export const FEATURE_PLAN_FLAG = {
  [FEATURES.CRM]: null,
  [FEATURES.CASES]: null,
  [FEATURES.AGENDA]: null,
  [FEATURES.AI]: null,
  [FEATURES.DOCUMENTS]: null,
  [FEATURES.PORTAL]: null,
  [FEATURES.BILLING]: "billing_enabled",
  [FEATURES.VIDEO]: "video_enabled",
  [FEATURES.AUTOMATIONS]: "billing_enabled", // automatizaciones llegan con Salto+
  [FEATURES.API]: "api_enabled",
};

// Mapa feature → clave de conteo en DEMO_LIMITS / usage.
export const FEATURE_USAGE_KEY = {
  [FEATURES.CRM]: "clients",
  [FEATURES.CASES]: "cases",
  [FEATURES.AGENDA]: "appointments",
  [FEATURES.AI]: "ai",
  [FEATURES.DOCUMENTS]: "documents",
  [FEATURES.VIDEO]: "meetings",
};

export function getPlanBySlug(slug) {
  return PLANS.find((p) => p.slug === slug) || null;
}

export const PLAN_ORDER = ["despegue", "salto-estrategico", "firma-crecimiento", "consolidacion-empresarial"];
