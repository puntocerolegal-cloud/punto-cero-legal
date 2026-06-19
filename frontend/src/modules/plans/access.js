// Preparación de Control de Acceso por Plan — Punto Cero System OS.
// ⚠️ ARQUITECTURA SOLO: estas utilidades quedan listas para que en una fase
// posterior ProtectedRoute / FeatureGate / PlanGate consuman los límites del plan.
// NO se conectan aquí a la autenticación ni a las guardas de ruta.

export const PLAN_FEATURE_FLAGS = ["video_enabled", "billing_enabled", "api_enabled"];
export const PLAN_LIMIT_KEYS = ["max_users", "max_cases", "max_storage", "max_ai_requests"];

/** Límites de un plan (objeto vacío si no hay). */
export function getPlanLimits(plan) {
  return plan?.limits || {};
}

/** ¿El plan habilita una feature booleana (video/billing/api)? */
export function planHasFeature(plan, feature) {
  return Boolean(getPlanLimits(plan)[feature]);
}

/** ¿`current` está dentro del límite del plan? (-1 / null = ilimitado). */
export function isWithinLimit(plan, key, current) {
  const max = getPlanLimits(plan)[key];
  if (max === -1 || max == null) return true;
  return Number(current) <= Number(max);
}

/** Representación legible de un límite numérico. */
export function describeLimit(value) {
  return value === -1 ? "Ilimitado" : value;
}

/** Nivel de soporte del plan. */
export function getSupportLevel(plan) {
  return getPlanLimits(plan).support_level || "basic";
}
