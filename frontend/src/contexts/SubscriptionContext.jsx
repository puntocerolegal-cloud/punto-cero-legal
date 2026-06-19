// Contexto de Suscripción — Punto Cero Platform.
// Provee estado comercial (plan, estado, demo/trial, uso) y acciones, además del
// estado global del modal de conversión. Aditivo: por defecto ACTIVO con el plan
// superior, de modo que las verticales existentes (Legal) NO cambian de
// comportamiento. El estado puede conmutarse a DEMO/TRIAL para activar el motor.
import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { SUBSCRIPTION_STATES as S } from "@/core/commerce/planLimits";
import { canUseFeature, withinLimit, describeAccess, trialEnd } from "@/core/commerce/subscriptionEngine";
import { buildUpgradeContent } from "@/core/commerce/commercialAI";

const SubscriptionContext = createContext(null);
const STORAGE_KEY = "pcl_commerce";

const DEFAULT = {
  status: S.ACTIVO,                       // ACTIVO por defecto → Legal sin cambios
  planSlug: "consolidacion-empresarial",  // plan superior por defecto
  startDate: "2025-09-01",
  endDate: "2099-12-31",
  usage: { clients: 0, cases: 0, ai: 0, appointments: 0, meetings: 0, documents: 0 },
};

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch (e) { /* noop */ }
  return DEFAULT;
}

export function SubscriptionProvider({ children }) {
  const [sub, setSub] = useState(loadInitial);
  const [upgrade, setUpgrade] = useState({ open: false, content: null });

  const persist = useCallback((next) => {
    setSub(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) { /* noop */ }
  }, []);

  const now = Date.now();
  const access = useMemo(() => describeAccess(sub, now), [sub, now]);

  const can = useCallback((feature) => canUseFeature(feature, sub), [sub]);
  const within = useCallback((feature, current) => withinLimit(feature, current, sub), [sub]);

  const openUpgrade = useCallback((ctx = {}) => {
    setUpgrade({ open: true, content: buildUpgradeContent({ ...ctx, status: sub.status }) });
  }, [sub.status]);

  const closeUpgrade = useCallback(() => setUpgrade({ open: false, content: null }), []);

  // Verifica una feature; si está bloqueada abre el modal comercial. Devuelve bool.
  const requireFeature = useCallback((feature) => {
    const res = canUseFeature(feature, sub);
    if (!res.allowed) openUpgrade({ feature, reason: res.reason });
    return res.allowed;
  }, [sub, openUpgrade]);

  // Verifica un límite de conteo; si se excede abre el modal. Devuelve bool.
  const requireWithin = useCallback((feature, current) => {
    const ok = withinLimit(feature, current, sub);
    if (!ok) openUpgrade({ feature, reason: "limit" });
    return ok;
  }, [sub, openUpgrade]);

  // ── Acciones comerciales (autoservicio; sin contacto humano) ──
  const startDemo = useCallback(() => persist({ ...DEFAULT, status: S.DEMO, planSlug: "despegue", usage: DEFAULT.usage }), [persist]);
  const startTrial = useCallback(() => persist({
    ...sub, status: S.TRIAL, planSlug: sub.planSlug === "despegue" ? "salto-estrategico" : sub.planSlug,
    startDate: new Date(now).toISOString(), endDate: trialEnd(now),
  }), [sub, now, persist]);
  const subscribe = useCallback((planSlug) => persist({ ...sub, status: S.ACTIVO, planSlug, startDate: new Date(now).toISOString(), endDate: "2099-12-31" }), [sub, now, persist]);
  const setStatus = useCallback((status) => persist({ ...sub, status }), [sub, persist]);

  const value = useMemo(() => ({
    subscription: sub, access, can, within, requireFeature, requireWithin,
    upgrade, openUpgrade, closeUpgrade,
    startDemo, startTrial, subscribe, setStatus,
  }), [sub, access, can, within, requireFeature, requireWithin, upgrade, openUpgrade, closeUpgrade, startDemo, startTrial, subscribe, setStatus]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}

export default SubscriptionContext;
