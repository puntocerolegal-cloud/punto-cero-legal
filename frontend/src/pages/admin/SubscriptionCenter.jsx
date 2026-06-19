import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X as XIcon, Sparkles, CheckCircle2, Globe, Crown, FileText } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PLANS, CURRENCIES, DEFAULT_CURRENCY_CODE } from "@/modules/plans/mockData";
import { findCurrency, localPrice, formatMoney } from "@/modules/plans/currency";
import { describeLimit } from "@/modules/plans/access";

/**
 * Subscription Center (conversión) — Punto Cero System OS.
 * Destino final de upgrade: tarjetas de planes con precio convertido en vivo,
 * resaltado del plan actual y cambio de plan reactivo (sin recargar página).
 *
 * Decisiones de arquitectura (senior):
 *  - Fuente de verdad de planes/monedas: el catálogo del Motor de Planes
 *    (modules/plans). Las tasas viven en CURRENCIES (exchange_rate); planLimits.js
 *    define los LÍMITES por plan que alimentan la tabla comparativa.
 *  - El cambio de plan se hace vía `subscribe()` del SubscriptionContext, que
 *    persiste en localStorage (clave `pcl_commerce`) Y actualiza el estado
 *    global → reactividad instantánea sin recarga. El subscriptionEngine es puro
 *    (sin efectos), por eso el “stateful layer” es el contexto.
 */
function SubscriptionCenter() {
  const { subscription, subscribe } = useSubscription();
  const [currencyCode, setCurrencyCode] = useState(DEFAULT_CURRENCY_CODE || "USD");
  const [success, setSuccess] = useState(null);

  const currency = useMemo(() => findCurrency(CURRENCIES, currencyCode) || CURRENCIES[0], [currencyCode]);
  const currentSlug = subscription.planSlug;

  const handleUpgrade = (planId) => {
    const plan = PLANS.find((p) => p.slug === planId);
    if (!plan) return;
    subscribe(plan.slug);                 // persiste + refresca estado global (reactivo)
    setSuccess(plan.name);
    setTimeout(() => setSuccess(null), 3500);
  };

  // Filas de la tabla comparativa (derivadas de planLimits / limits del plan).
  const ROWS = [
    { key: "max_users", label: "Usuarios", type: "num" },
    { key: "max_cases", label: "Casos", type: "num" },
    { key: "max_storage", label: "Almacenamiento (GB)", type: "num" },
    { key: "max_ai_requests", label: "Solicitudes IA / mes", type: "num" },
    { key: "video_enabled", label: "Videoconferencias", type: "bool" },
    { key: "billing_enabled", label: "Facturación", type: "bool" },
    { key: "api_enabled", label: "API", type: "bool" },
    { key: "support_level", label: "Soporte", type: "text" },
  ];

  const renderCell = (plan, row) => {
    const v = plan.limits[row.key];
    if (row.type === "bool") return v ? <Check className="w-4 h-4 text-[#10b981] mx-auto" /> : <XIcon className="w-4 h-4 text-white/25 mx-auto" />;
    if (row.type === "num") return <span className="text-white/80">{describeLimit(v)}</span>;
    return <span className="text-white/80 capitalize">{v}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Notificación de éxito (sin recarga) */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-6 right-6 z-[70] flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#10b981]/15 border border-[#10b981]/40 text-[#6ee7b7] backdrop-blur-md"
            data-testid="upgrade-success"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">¡Plan actualizado a {success}!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlace permanente al Contrato de Suscripción Profesional */}
      <div className="flex justify-end">
        <Link to="/subscription-agreement" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#f97316] hover:underline font-semibold"
          data-testid="subcenter-agreement-link">
          <FileText className="w-4 h-4" /> Ver Contrato de Suscripción Profesional
        </Link>
      </div>

      <div className="rounded-xl border border-[#f97316]/30 bg-[#f97316]/[0.06] px-4 py-2.5 text-xs text-[#fdba74] flex items-center justify-between gap-3 flex-wrap">
        <span>Centro de actualización de plan · precios en vivo · moneda base USD.</span>
        <span className="inline-flex items-center gap-2">
          <Globe className="w-4 h-4 text-white/40" />
          <select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)}
            className="bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#f97316]/50"
            data-testid="currency-selector">
            {CURRENCIES.map((c) => <option key={c.id} value={c.currency_code}>{c.country} · {c.currency_code}</option>)}
          </select>
        </span>
      </div>

      {/* Tarjetas de planes */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.slug === currentSlug;
          return (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-5 flex flex-col transition-all ${
                isCurrent ? "border-[#f97316]/60 bg-[#f97316]/[0.08] shadow-[0_0_30px_rgba(249,115,22,0.15)]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
              data-testid={`plan-card-${plan.slug}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                {isCurrent && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#f97316]/20 text-[#fdba74] border border-[#f97316]/40"><Crown className="w-3 h-3" /> Actual</span>}
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold text-white">{formatMoney(localPrice(plan, currency), currency?.currency_code || "USD")}</div>
                <div className="text-[11px] text-white/40">Base {formatMoney(plan.priceUsd, "USD")} · /mes · {currency?.country}</div>
              </div>

              <ul className="mt-4 space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-[11px] text-white/60 flex items-start gap-1.5"><Check className="w-3 h-3 text-[#10b981] mt-0.5 flex-shrink-0" /> {f}</li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.slug)}
                disabled={isCurrent}
                className={`mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isCurrent ? "bg-white/5 text-white/40 cursor-default border border-white/10"
                  : "bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white hover:shadow-[0_8px_20px_rgba(249,115,22,0.35)]"
                }`}
                data-testid={`upgrade-${plan.slug}`}
              >
                {isCurrent ? "Tu plan actual" : <><Sparkles className="w-4 h-4" /> Cambiar a este plan</>}
              </button>
            </motion.div>
          );
        })}
      </section>

      {/* Tabla comparativa de beneficios */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Comparativa de beneficios</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 border-b border-white/10">
                <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs sticky left-0 bg-[#0f172a]/80">Beneficio</th>
                {PLANS.map((p) => (
                  <th key={p._id} className={`px-4 py-3 text-center font-semibold uppercase tracking-wider text-[10px] ${p.slug === currentSlug ? "text-[#fdba74]" : ""}`}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.key} className="border-b border-white/5">
                  <td className="px-4 py-3 text-white/70 whitespace-nowrap sticky left-0 bg-[#0f172a]/60">{row.label}</td>
                  {PLANS.map((p) => (
                    <td key={p._id} className="px-4 py-3 text-center">{renderCell(p, row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default SubscriptionCenter;
