// Motor de Suscripciones (puro) — Punto Cero Platform.
// Calcula acceso por plan, estado, demo, trial y vencimiento. Sin efectos
// secundarios: la UI (SubscriptionContext) le pasa el estado y aplica resultados.
import {
  SUBSCRIPTION_STATES as S, DEMO_LIMITS, TRIAL_DAYS,
  FEATURE_PLAN_FLAG, FEATURE_USAGE_KEY, getPlanBySlug,
} from "./planLimits";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Días restantes hasta endDate (>=0). null si no hay fecha. now en ms. */
export function daysRemaining(endDate, now) {
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
}

/** Fecha de fin de un trial que arranca en `startMs`. */
export function trialEnd(startMs) {
  return new Date(startMs + TRIAL_DAYS * DAY_MS).toISOString();
}

/** ¿El estado es de solo lectura? (VENCIDO / CANCELADO) */
export function isReadOnly(status) {
  return status === S.VENCIDO || status === S.CANCELADO;
}

/** ¿La suscripción permite escribir/ejecutar acciones? */
export function canWrite(status) {
  return status === S.ACTIVO || status === S.TRIAL || status === S.DEMO;
}

/**
 * ¿Puede usar la feature? Devuelve { allowed, reason }.
 *  reason ∈ "ok" | "plan" | "demo-feature" | "expired" | "canceled"
 */
export function canUseFeature(feature, { status, planSlug }) {
  if (status === S.CANCELADO) return { allowed: false, reason: "canceled" };
  if (status === S.VENCIDO) return { allowed: false, reason: "expired" };

  const flag = FEATURE_PLAN_FLAG[feature];

  if (status === S.DEMO) {
    // En DEMO, billing/api están deshabilitados; el resto es explorable con límites.
    if (feature === "billing" || feature === "api") return { allowed: false, reason: "demo-feature" };
    return { allowed: true, reason: "ok" };
  }

  // ACTIVO / TRIAL / PENDIENTE_PAGO → según flags del plan.
  if (!flag) return { allowed: true, reason: "ok" };
  const plan = getPlanBySlug(planSlug);
  const enabled = Boolean(plan?.limits?.[flag]);
  return enabled ? { allowed: true, reason: "ok" } : { allowed: false, reason: "plan" };
}

/**
 * ¿`current` está dentro del límite de la feature?
 * En DEMO usa DEMO_LIMITS; en otros estados usa los límites del plan (-1 = ilimitado).
 */
export function withinLimit(feature, current, { status, planSlug }) {
  const usageKey = FEATURE_USAGE_KEY[feature];
  if (status === S.DEMO) {
    if (usageKey == null) return true;
    const max = DEMO_LIMITS[usageKey];
    return Number(current) < Number(max);
  }
  const plan = getPlanBySlug(planSlug);
  const limitMap = { clients: "max_users", cases: "max_cases", ai: "max_ai_requests", documents: "max_storage" };
  const planKey = limitMap[usageKey];
  const max = plan?.limits?.[planKey];
  if (max == null || max === -1) return true;
  return Number(current) < Number(max);
}

/** Resumen de acceso completo para la UI. */
export function describeAccess({ status, planSlug, endDate }, now) {
  return {
    status,
    plan: getPlanBySlug(planSlug),
    readOnly: isReadOnly(status),
    isDemo: status === S.DEMO,
    isTrial: status === S.TRIAL,
    daysLeft: daysRemaining(endDate, now),
  };
}
