import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, RefreshCw, Receipt, Settings2, Loader2, AlertTriangle, Users, FolderKanban, BookOpen, FileText, Brain, Check, X } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

/**
 * Panel Ejecutivo de Suscripción — Firm OS (FASE 4.4).
 * Fuente EXCLUSIVA de Firm OS: /firm-os/subscription y /firm-os/plans.
 * NO consume catálogos ni planes de Lawyer OS.
 */
const authHeaders = () => {
  const t = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const barColor = (pct) => (pct >= 95 ? "#ef4444" : pct >= 80 ? "#f97316" : pct >= 60 ? "#eab308" : "#10b981");

const MetricBar = ({ icon: Icon, label, value, sub, pct }) => (
  <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4">
    <div className="flex items-center gap-2 mb-2 text-white/60"><Icon className="w-4 h-4" /><span className="text-xs uppercase tracking-wide">{label}</span></div>
    <div className="text-2xl font-bold text-white">{value}</div>
    {sub && <div className="text-xs text-white/50 mt-0.5">{sub}</div>}
    {pct !== null && pct !== undefined && (
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor(pct) }} />
      </div>
    )}
  </div>
);

export function EnterpriseSubscriptionPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [showPlans, setShowPlans] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const H = { headers: authHeaders() };
    const [sub, pl] = await Promise.all([
      axios.get(`${API}/firm-os/subscription`, H).then((r) => r.data).catch(() => null),
      axios.get(`${API}/firm-os/plans`, H).then((r) => r.data?.plans || []).catch(() => []),
    ]);
    setData(sub);
    setPlans(pl);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex items-center gap-2 text-white/60"><Loader2 className="w-5 h-5 animate-spin" /> Cargando suscripción empresarial…</div>;
  if (!data) return null;

  const { plan, status, is_trial, renewal_date, days_left, limits, usage, percent } = data;
  const statusLabel = is_trial ? "Trial" : status === "active" ? "Activo" : status === "suspended" ? "Suspendido" : status === "expired" ? "Vencido" : status;
  const statusStyle = is_trial ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-red-500/20 text-red-300 border-red-500/40";

  const alerts = [];
  if (is_trial) alerts.push(`Periodo de prueba${days_left != null ? ` · ${days_left} día(s) restantes` : ""}. Activa un plan.`);
  if (percent.storage >= 80) alerts.push(`Almacenamiento al ${percent.storage}% (${usage.storage_gb} / ${limits.storage_gb} GB).`);
  if (percent.lawyers >= 80) alerts.push(`Usuarios: ${usage.lawyers}/${limits.lawyers}. Cerca del cupo del plan.`);
  if (percent.ai >= 80) alerts.push(`Consumo IA al ${percent.ai}%.`);

  return (
    <div className="rounded-2xl border border-[#f97316]/30 bg-gradient-to-br from-[#f97316]/10 via-white/[0.03] to-white/[0.03] p-6 space-y-6">
      {/* Encabezado ejecutivo */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#f97316]">Suscripción Empresarial</p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-3xl font-extrabold text-white">{plan.name}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle}`}>{statusLabel}</span>
          </div>
          <p className="text-white/50 text-sm mt-1">{plan.price_display} · Renovación: {renewal_date ? new Date(renewal_date).toLocaleDateString() : "—"}{days_left != null ? ` · ${days_left} días` : ""}</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm"><RefreshCw className="w-4 h-4" /> Actualizar</button>
      </div>

      {/* Métricas grandes */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricBar icon={Users} label="Usuarios" value={`${usage.lawyers} / ${limits.lawyers}`} sub="abogados activos" pct={percent.lawyers} />
        <MetricBar icon={FolderKanban} label="Casos" value={usage.cases} sub="de la firma" pct={null} />
        <MetricBar icon={BookOpen} label="Clientes" value={usage.clients} sub="de la firma" pct={null} />
        <MetricBar icon={FileText} label="Documentos" value={usage.documents} sub={`${usage.storage_gb} / ${limits.storage_gb} GB`} pct={percent.storage} />
        <MetricBar icon={Brain} label="Consumo IA" value={`${percent.ai}%`} sub={`${usage.ai} / ${limits.ai_monthly} consultas`} pct={percent.ai} />
        <MetricBar icon={CreditCard} label="Almacenamiento" value={`${usage.storage_gb} GB`} sub={`de ${limits.storage_gb} GB`} pct={percent.storage} />
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 text-sm"><AlertTriangle className="w-4 h-4 flex-shrink-0" /> {a}</div>
          ))}
        </div>
      )}

      {/* Botones grandes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => setShowPlans(true)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"><CreditCard className="w-5 h-5" /> Actualizar Plan</button>
        <button onClick={() => setShowPlans(true)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"><RefreshCw className="w-5 h-5" /> Renovar</button>
        <button onClick={() => navigate("/firm-os/settings")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"><Settings2 className="w-5 h-5" /> Administrar</button>
        <button onClick={() => navigate("/firm-os/invoices")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"><Receipt className="w-5 h-5" /> Facturas</button>
      </div>

      {/* Modal de planes (SOLO Firm OS) */}
      {showPlans && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlans(false)}>
          <div className="w-full max-w-3xl bg-[#0f172a] border border-white/15 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Planes empresariales</h3>
              <button onClick={() => setShowPlans(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((p) => (
                <div key={p.id} className={`p-5 rounded-xl border-2 ${p.id === plan.id ? "border-[#f97316] bg-[#f97316]/10" : "border-white/10 bg-white/5"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold" style={{ color: p.color }}>{p.name}</p>
                    {p.id === plan.id && <span className="text-xs bg-[#f97316]/20 text-[#f97316] px-2 py-0.5 rounded">Actual</span>}
                  </div>
                  <p className="text-2xl font-extrabold text-white mt-1">{p.price_display}</p>
                  <ul className="mt-3 space-y-1">{p.features.map((f, i) => <li key={i} className="flex items-center gap-2 text-sm text-white/70"><Check className="w-4 h-4 text-emerald-400" /> {f}</li>)}</ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-4">Para cambiar de plan o ampliar cupos, contacta a tu administrador.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnterpriseSubscriptionPanel;
