import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Users, Clock, CheckCircle2, XCircle, Search, ArrowRight, Check, Ban, CreditCard } from "lucide-react";
import { API } from "@/config/api";
import { MetricCard, EmptyState } from "@/shared/components";
import { SalesCandidateDrawer } from "../components/SalesCandidateDrawer";

/**
 * SalesRoomModule — "Sala de Ventas" nativa del Punto Cero System OS.
 * Reemplaza la pestaña del Panel Legacy: captación/reclutamiento de candidatos
 * (socios) con KPIs, filtros, búsqueda y ficha en Drawer premium. Datos REALES
 * desde /admin-ops/sales/* (MongoDB); si no hay datos, estado limpio.
 */
const withDr = (name) => {
  if (!name) return "—";
  const n = String(name).trim();
  return /^dr\.?\s|^dra\.?\s/i.test(n) ? n : `Dr. ${n}`;
};
const STATUS_BADGE = {
  ACTIVE: "bg-[#10b981]/15 text-[#6ee7b7]",
  PENDING_VERIFICATION: "bg-[#f59e0b]/15 text-[#fcd34d]",
  PENDING_PAYMENT: "bg-[#f59e0b]/15 text-[#fcd34d]",
  REJECTED: "bg-[#ef4444]/15 text-[#fca5a5]",
  suspended: "bg-[#ef4444]/15 text-[#fca5a5]",
};
const STATUS_LABEL = {
  ACTIVE: "Activo", PENDING_VERIFICATION: "Pendiente verif.", PENDING_PAYMENT: "Pendiente pago",
  REJECTED: "Rechazado", suspended: "Suspendido",
};
const FILTERS = [
  { v: "in_process", l: "En proceso" },
  { v: "active", l: "Activos" },
  { v: "rejected", l: "Rechazados" },
  { v: "", l: "Todos" },
];

export function SalesRoomModule() {
  const [stats, setStats] = useState({ total_candidates: 0, in_process: 0, active_partners: 0, rejected: 0 });
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState("in_process");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);   // candidato con acción en curso
  const [toast, setToast] = useState(null);      // { type: 'success'|'error', msg }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.allSettled([
        axios.get(`${API}/admin-ops/sales/stats`),
        axios.get(`${API}/admin-ops/sales/candidates`, { params: { status_filter: filter } }),
      ]);
      if (s.status === "fulfilled") setStats(s.value.data);
      if (c.status === "fulfilled") setCandidates(Array.isArray(c.value.data) ? c.value.data : c.value.data?.candidates || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // ── Acciones operativas (backend admin-ops) → recargan lista + toast ──
  const runAction = useCallback(async (id, action, okMsg) => {
    setBusyId(id);
    try {
      await axios.post(`${API}/admin-ops/sales/candidates/${id}/${action}`);
      setToast({ type: "success", msg: okMsg });
      await load();                                  // reutiliza el método existente
    } catch (e) {
      setToast({ type: "error", msg: `Error: ${e?.response?.data?.detail || e.message || "no se pudo completar"}` });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 3000);
    }
  }, [load]);

  const approveCandidate = (id) => runAction(id, "approve", "Candidato aprobado y activado");
  const rejectCandidate = (id) => runAction(id, "reject", "Candidato rechazado");
  const setPendingPayment = (id) => runAction(id, "pending-payment", "Candidato marcado como pendiente de pago");

  const filtered = useMemo(() => candidates.filter((c) =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(search.toLowerCase())
  ), [candidates, search]);

  const kpis = [
    { title: "Total candidatos", value: stats.total_candidates ?? 0, icon: Users, accent: "#3b82f6" },
    { title: "En proceso", value: stats.in_process ?? 0, icon: Clock, accent: "#f97316" },
    { title: "Socios activos", value: stats.active_partners ?? 0, icon: CheckCircle2, accent: "#10b981" },
    { title: "Rechazados", value: stats.rejected ?? 0, icon: XCircle, accent: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} loading={loading} />)}
      </section>

      {/* Filtros + búsqueda */}
      <section className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((o) => (
            <button key={o.v || "all"} onClick={() => setFilter(o.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === o.v ? "bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}
              data-testid={`sales-filter-${o.v || "all"}`}>
              {o.l}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email, especialidad..."
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f97316]/50"
            data-testid="sales-search" />
        </div>
      </section>

      {/* Tabla de candidatos */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40 text-sm">Cargando candidatos...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Sin candidatos" description="No hay candidatos para este filtro. Listo para recibir nuevas postulaciones." className="border-0 bg-transparent py-10" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10 text-xs uppercase tracking-wider">
                  <th className="p-3 pl-5">Candidato</th>
                  <th className="p-3 hidden md:table-cell">Especialidad</th>
                  <th className="p-3 hidden lg:table-cell">Experiencia</th>
                  <th className="p-3 hidden lg:table-cell">Firma</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 pr-5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id || c._id} onClick={() => setSelected(c)}
                    className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors"
                    data-testid={`candidate-row-${c.id || c._id}`}>
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(withDr(c.full_name) || "Dr").replace(/^Dr\.\s?/i, "").split(" ").map((n) => n[0]).slice(0, 2).join("") || "DR"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{withDr(c.full_name)}</div>
                          <div className="text-xs text-white/40 truncate">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-white/70">{c.specialty || "—"}</td>
                    <td className="p-3 hidden lg:table-cell text-white/70">{c.experience_years ? `${c.experience_years} años` : "—"}</td>
                    <td className="p-3 hidden lg:table-cell text-white/70 truncate max-w-[180px]">{c.firm_name || "—"}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_BADGE[c.status] || "bg-white/10 text-white/60"}`}>{STATUS_LABEL[c.status] || c.status || "—"}</span></td>
                    <td className="p-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => approveCandidate(c.id || c._id)} disabled={busyId === (c.id || c._id)}
                          title="Aprobar" aria-label="Aprobar"
                          className="p-1.5 rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          data-testid={`approve-${c.id || c._id}`}>
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setPendingPayment(c.id || c._id)} disabled={busyId === (c.id || c._id)}
                          title="Pendiente de pago" aria-label="Pendiente de pago"
                          className="p-1.5 rounded-lg bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          data-testid={`pending-${c.id || c._id}`}>
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => rejectCandidate(c.id || c._id)} disabled={busyId === (c.id || c._id)}
                          title="Rechazar" aria-label="Rechazar"
                          className="p-1.5 rounded-lg bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          data-testid={`reject-${c.id || c._id}`}>
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setSelected(c)}
                          className="ml-1 text-[#f97316] text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                          data-testid={`ficha-${c.id || c._id}`}>
                          Ver ficha <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ficha premium en Drawer (sin cambiar de entorno) */}
      <SalesCandidateDrawer candidate={selected} onClose={() => setSelected(null)} />

      {/* Toast de éxito/error tras cada acción */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-2xl border text-sm font-semibold backdrop-blur-md ${
            toast.type === "success"
              ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#6ee7b7]"
              : "bg-[#ef4444]/15 border-[#ef4444]/40 text-[#fca5a5]"
          }`}
          data-testid="sales-toast"
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default SalesRoomModule;
