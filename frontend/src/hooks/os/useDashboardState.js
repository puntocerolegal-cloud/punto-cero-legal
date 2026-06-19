// HUB central del Dashboard Ejecutivo — Punto Cero System OS.
// Una ÚNICA consulta consolidada (DashboardState) que agrupa Casos, Suscripciones
// y Socios desde MongoDB. Reactivo: se refresca por polling y por eventos del
// EventBus (p. ej. al crear/pagar una factura o convertir un socio) sin recargar.
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API } from "@/config/api";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";

const unwrap = (d) =>
  d && typeof d === "object" && "success" in d && "data" in d ? d.data : d;

const REACTIVE_EVENTS = [
  OS_EVENTS.invoiceCreated, OS_EVENTS.invoicePaid, OS_EVENTS.invoiceUpdated,
  OS_EVENTS.subscriptionCreated, OS_EVENTS.subscriptionStatusChanged,
  OS_EVENTS.subscriptionRenewed, OS_EVENTS.partnerConverted,
  OS_EVENTS.partnerCreated, OS_EVENTS.partnerUpdated, OS_EVENTS.partnerDeleted,
];

export function useDashboardState({ pollMs = 5000 } = {}) {  // TEMP: 5s para depurar visualización
  const [state, setState] = useState({
    cases: [], subscriptions: [], partners: [], partnersKpis: {},
    loading: true, error: null, lastUpdated: null,
  });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const [casesR, subsR, partnersR] = await Promise.allSettled([
      axios.get(`${API}/admin-ops/operations/cases`),
      axios.get(`${API}/subscriptions`),
      axios.get(`${API}/partners/dashboard`),
    ]);
    if (!mounted.current) return;

    const cases = casesR.status === "fulfilled"
      ? (Array.isArray(casesR.value.data) ? casesR.value.data : casesR.value.data?.cases || [])
      : [];
    const subscriptions = subsR.status === "fulfilled" ? (unwrap(subsR.value.data) || []) : [];
    const pd = partnersR.status === "fulfilled" ? (unwrap(partnersR.value.data) || {}) : {};

    const anyOk = [casesR, subsR, partnersR].some((r) => r.status === "fulfilled");
    const firstErr = [casesR, subsR, partnersR].find((r) => r.status === "rejected")?.reason || null;

    // DEBUG (temporal): confirma en consola que los datos del backend llegan.
    // eslint-disable-next-line no-console
    console.log("[PCL][DashboardState] casos:", cases.length, "| suscripciones:",
      Array.isArray(subscriptions) ? subscriptions.length : 0, "| partners:", (pd.PARTNERS || []).length,
      anyOk ? "" : "| TODAS fallaron (¿401? inicia sesión admin):", firstErr?.response?.status || firstErr?.message || "");

    setState({
      cases,
      subscriptions: Array.isArray(subscriptions) ? subscriptions : [],
      partners: pd.PARTNERS || [],
      partnersKpis: pd.KPIS || {},
      loading: false,
      error: anyOk ? null : firstErr,
      lastUpdated: Date.now(),
    });
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const id = setInterval(refresh, pollMs);                 // reactividad por polling
    const unsubs = REACTIVE_EVENTS.map((ev) => eventBus.on(ev, refresh)); // y por eventos
    return () => { mounted.current = false; clearInterval(id); unsubs.forEach((u) => u()); };
  }, [refresh, pollMs]);

  return { ...state, refresh };
}

export default useDashboardState;
