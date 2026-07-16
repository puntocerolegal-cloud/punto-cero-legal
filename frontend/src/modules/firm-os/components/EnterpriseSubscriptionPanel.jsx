import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, RefreshCw, XCircle, RotateCcw, Receipt, Settings2, Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Panel "Estado de la Empresa" — Suscripción empresarial de Firm OS.
 * Consume SOLO endpoints existentes (sin mocks, sin datos simulados):
 *   GET  /payment/subscription-status   -> plan, estado, renovación, flags
 *   GET  /payment/my-plan               -> plan/catálogo/locale
 *   GET  /firms/{id}/lawyers|clients|cases -> consumo real (count)
 *   GET  /documents/storage/{uid}       -> almacenamiento real (used/quota)
 *   GET  /ai/usage/{uid}                -> consumo IA real
 *   POST /payment/renew|cancel|reactivate -> acciones de suscripción
 */
const authHeaders = () => {
  const t = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const barColor = (pct) => (pct >= 95 ? "#ef4444" : pct >= 80 ? "#f97316" : pct >= 60 ? "#eab308" : "#10b981");

const Meter = ({ label, usedLabel, pct }) => (
  <div>
    <div className="mb-1 flex items-center justify-between">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm font-semibold text-white">{usedLabel}</span>
    </div>
    {pct !== null && (
      <>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor(pct) }} />
        </div>
        <p className="mt-0.5 text-xs text-white/40">{Math.round(pct)}% utilizado</p>
      </>
    )}
  </div>
);

export function EnterpriseSubscriptionPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.id || user?._id;
  const firmId = user?.firm_id;

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState(null);      // subscription-status
  const [myPlan, setMyPlan] = useState(null); // my-plan
  const [usage, setUsage] = useState({ lawyers: 0, clients: 0, cases: 0, storage: null, ai: 0, aiFree: true });
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const H = { headers: authHeaders() };
    const safe = (p) => axios.get(`${API}${p}`, H).then((r) => r.data).catch(() => null);
    const [s, mp, law, cli, cas, st, ai] = await Promise.all([
      safe("/payment/subscription-status"),
      safe("/payment/my-plan"),
      firmId ? safe(`/firms/${firmId}/lawyers`) : Promise.resolve(null),
      firmId ? safe(`/firms/${firmId}/clients`) : Promise.resolve(null),
      firmId ? safe(`/firms/${firmId}/cases`) : Promise.resolve(null),
      uid ? safe(`/documents/storage/${uid}`) : Promise.resolve(null),
      uid ? safe(`/ai/usage/${uid}`) : Promise.resolve(null),
    ]);
    setSub(s);
    setMyPlan(mp);
    setUsage({
      lawyers: law?.count ?? 0,
      clients: cli?.count ?? 0,
      cases: cas?.count ?? 0,
      storage: st || null,
      ai: ai?.used ?? 0,
      aiFree: ai?.free ?? true,
    });
    setLoading(false);
  }, [firmId, uid]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (path, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(path);
    try {
      await axios.post(`${API}${path}`, {}, { headers: authHeaders() });
      await load();
    } catch (e) {
      alert(e.response?.data?.detail || "No se pudo completar la operación");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex items-center gap-2 text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando estado de la empresa…
      </div>
    );
  }

  const status = sub?.subscription_status || myPlan?.subscription_status || "trial";
  const isTrial = status === "trial";
  const planName = sub?.plan_name || myPlan?.plan?.name || (isTrial ? "Trial" : "Sin plan");
  const renewal = sub?.renewal_date || null;
  let daysLeft = null;
  if (renewal) {
    const d = Math.ceil((new Date(renewal) - new Date()) / 86400000);
    daysLeft = isNaN(d) ? null : d;
  }
  // Límite de casos: derivado del texto del plan del catálogo (p.ej. "Hasta 50 casos"), si existe.
  const planDef = (myPlan?.catalog || []).find((p) => p.id === (sub?.plan_id || myPlan?.plan_id));
  const caseLimitMatch = planDef?.processes?.match(/(\d+)/);
  const caseLimit = caseLimitMatch ? parseInt(caseLimitMatch[1], 10) : null;
  const term = myPlan?.locale?.term_plural ? myPlan.locale.term_plural.charAt(0).toUpperCase() + myPlan.locale.term_plural.slice(1) : "Abogados";
  const st = usage.storage;

  const counters = [
    { label: term, usedLabel: `${usage.lawyers}`, pct: null },
    { label: "Clientes", usedLabel: `${usage.clients}`, pct: null },
    { label: "Casos", usedLabel: caseLimit ? `${usage.cases} / ${caseLimit}` : `${usage.cases}`, pct: caseLimit ? (usage.cases / caseLimit) * 100 : null },
    { label: "Documentos", usedLabel: `${st?.count ?? 0}`, pct: null },
    { label: "Almacenamiento", usedLabel: st ? `${st.used_human} / ${st.quota_human}` : "—", pct: st ? (st.percent ?? 0) : null },
    { label: "IA (consultas)", usedLabel: usage.aiFree ? `${usage.ai} · Gratis` : `${usage.ai}`, pct: null },
  ];

  const statusColor = isTrial ? "text-amber-400" : status === "active" || sub?.has_active_subscription ? "text-emerald-400" : "text-white/70";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-[#f97316]" />
          <h2 className="text-2xl font-bold text-white">Estado de la Empresa</h2>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Plan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><p className="text-xs uppercase text-white/50">Plan</p><p className="text-lg font-bold text-white">{planName}</p></div>
        <div><p className="text-xs uppercase text-white/50">Estado</p><p className={`text-lg font-bold ${statusColor}`}>{isTrial ? "Trial" : status}</p></div>
        <div><p className="text-xs uppercase text-white/50">Renovación</p><p className="text-lg font-bold text-white">{renewal ? new Date(renewal).toLocaleDateString() : "—"}</p></div>
        <div><p className="text-xs uppercase text-white/50">Días restantes</p><p className="text-lg font-bold text-white">{daysLeft !== null ? daysLeft : "—"}</p></div>
      </div>

      {/* Consumo */}
      <div>
        <p className="text-sm font-semibold text-white/60 uppercase mb-3">Consumo del plan</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {counters.map((c) => <Meter key={c.label} label={c.label} usedLabel={c.usedLabel} pct={c.pct} />)}
        </div>
      </div>

      {isTrial && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4" /> Estás en periodo de prueba. Activa un plan para asegurar la continuidad del servicio.
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
        <button onClick={() => navigate("/checkout")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
          <CreditCard className="w-4 h-4" /> {sub?.has_active_subscription ? "Cambiar Plan" : "Actualizar Plan"}
        </button>
        {sub?.has_active_subscription && (
          <button disabled={busy === "/payment/renew"} onClick={() => doAction("/payment/renew")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
            {busy === "/payment/renew" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Renovar
          </button>
        )}
        {sub?.can_cancel && (
          <button disabled={busy === "/payment/cancel"} onClick={() => doAction("/payment/cancel", "¿Cancelar la suscripción?")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50">
            {busy === "/payment/cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancelar
          </button>
        )}
        {sub?.can_reactivate && (
          <button disabled={busy === "/payment/reactivate"} onClick={() => doAction("/payment/reactivate")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-50">
            {busy === "/payment/reactivate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Reactivar
          </button>
        )}
        <button onClick={() => navigate("/firm-os/invoices")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold">
          <Receipt className="w-4 h-4" /> Ver Facturas
        </button>
        <button onClick={() => navigate("/firm-os/settings")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold">
          <Settings2 className="w-4 h-4" /> Administrar Suscripción
        </button>
      </div>
    </div>
  );
}

export default EnterpriseSubscriptionPanel;
