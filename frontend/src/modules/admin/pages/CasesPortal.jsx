import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { FolderKanban, AlertTriangle, Zap, CheckCircle2, Search, RotateCw } from "lucide-react";
import { API } from "@/config/api";
import { MetricCard, StatusBadge } from "@/shared/components";
import { ActivityDetailDrawer } from "../components/ActivityDetailDrawer";
import { ConnectionState } from "../components/ConnectionState";

/**
 * Portal de Casos — Operaciones del System OS. Vista densa de todos los casos
 * reales (MongoDB) con búsqueda y filtro por estado de asignación. Clic en una
 * fila → ActivityDetailDrawer premium. Sin sub-pestañas.
 */
const ASSIGN = [
  { v: "", l: "Todos" },
  { v: "sin_asignar", l: "Sin asignar" },
  { v: "asignado", l: "Asignados" },
  { v: "atendido", l: "Atendidos" },
];

export function CasesPortal() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);   // caso con acción en curso
  const [toast, setToast] = useState(null);      // { type: 'success'|'error', msg }

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/admin-ops/operations/cases`);
      const d = res.data;
      setCases(Array.isArray(d) ? d : d?.cases || []);
    } catch (e) { setError(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // ── Auto-asignación (el backend decide el abogado disponible) → recarga + toast ──
  const autoAssignCase = useCallback(async (caseId) => {
    setBusyId(caseId);
    try {
      const res = await axios.post(`${API}/admin-ops/operations/cases/${caseId}/auto-assign`);
      setToast({ type: "success", msg: res?.data?.message || "Caso auto-asignado a un abogado disponible" });
      await load();                                // reutiliza el load() existente
    } catch (e) {
      setToast({ type: "error", msg: `Error: ${e?.response?.data?.detail || e.message || "no se pudo asignar"}` });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 3000);
    }
  }, [load]);

  const filtered = useMemo(() => cases.filter((c) => {
    if (fStatus && c.assignment_status !== fStatus) return false;
    const q = search.trim().toLowerCase();
    return !q || `${c.title} ${c.client_name} ${c.case_number} ${c.legal_area}`.toLowerCase().includes(q);
  }), [cases, search, fStatus]);

  if (loading || error) return <ConnectionState loading={loading} error={error} title="Portal de Casos" />;

  const count = (st) => cases.filter((c) => c.assignment_status === st).length;
  const kpis = [
    { title: "Casos totales", value: cases.length, icon: FolderKanban, accent: "#06b6d4" },
    { title: "Sin asignar", value: count("sin_asignar"), icon: AlertTriangle, accent: "#ef4444" },
    { title: "Asignados", value: count("asignado"), icon: Zap, accent: "#3b82f6" },
    { title: "Atendidos", value: count("atendido"), icon: CheckCircle2, accent: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/[0.06] px-4 py-2.5 text-xs text-[#67e8f9]">
        Operaciones · Portal de Casos · casos reales desde MongoDB · clic en una fila para ver el detalle.
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      <section className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="flex gap-2 flex-wrap">
          {ASSIGN.map((o) => (
            <button key={o.v || "all"} onClick={() => setFStatus(o.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${fStatus === o.v ? "bg-[#06b6d4]/30 text-white" : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"}`}>
              {o.l}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, cliente, número, área..."
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#06b6d4]/50" />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10 text-xs uppercase tracking-wider">
              <th className="p-3 pl-5">Caso</th><th className="p-3">N°</th><th className="p-3">Área</th>
              <th className="p-3">País</th><th className="p-3">Abogado</th><th className="p-3">Estado</th><th className="p-3 pr-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const cid = c.id || c._id;
              const assigned = Boolean(c.lawyer_id || c.lawyer_name);
              const busy = busyId === cid;
              return (
              <tr key={c._id || c.case_number} onClick={() => setSelected(c)} className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer">
                <td className="p-3 pl-5"><div className="text-white font-medium truncate max-w-[240px]">{c.title || "—"}</div><div className="text-[11px] text-white/40">{c.client_name}</div></td>
                <td className="p-3 font-mono text-[11px] text-white/60">{c.case_number}</td>
                <td className="p-3 text-white/70">{c.legal_area || "—"}</td>
                <td className="p-3 text-white/70">{c.client_country || "—"}</td>
                <td className="p-3 text-white/70">{c.lawyer_name || "—"}</td>
                <td className="p-3"><StatusBadge tone={c.assignment_status === "sin_asignar" ? "atencion" : "normal"} label={c.estado || c.status || "—"} /></td>
                <td className="p-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                  {assigned ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[11px] text-[#10b981] font-semibold">Asignado</span>
                      <button onClick={() => autoAssignCase(cid)} disabled={busy} title="Reasignar"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        data-testid={`reassign-${cid}`}>
                        <RotateCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> Reasignar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => autoAssignCase(cid)} disabled={busy} title="Auto-asignar a un abogado disponible"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#93c5fd] hover:bg-[#3b82f6]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      data-testid={`autoassign-${cid}`}>
                      <Zap className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} /> {busy ? "Asignando…" : "Auto-asignar"}
                    </button>
                  )}
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-white/40">Sin casos para estos filtros.</td></tr>}
          </tbody>
        </table>
      </section>

      <ActivityDetailDrawer activity={selected} onClose={() => setSelected(null)} />

      {/* Toast de éxito/error tras la auto-asignación (consistente con SalesRoom) */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-2xl border text-sm font-semibold backdrop-blur-md ${
            toast.type === "success"
              ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#6ee7b7]"
              : "bg-[#ef4444]/15 border-[#ef4444]/40 text-[#fca5a5]"
          }`}
          data-testid="cases-toast"
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

export default CasesPortal;
