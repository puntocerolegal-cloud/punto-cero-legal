import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ShieldCheck, History, Users, RefreshCw, Wrench, Terminal, Archive, ExternalLink } from "lucide-react";
import { API } from "@/config/api";
import { ActionMenu } from "@/components/admin/ActionMenu";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Control Maestro — intervención manual del Administrador sobre abogados y
 * suscripciones, con historial de auditoría. Las automatizaciones siguen
 * funcionando; esto añade autoridad manual auditada (/api/admin-master/*).
 */
const LAWYER_ACTIONS = ["approve", "reject", "activate", "suspend", "block", "reactivate", "change-plan"];
const SUB_ACTIONS = ["grant-free", "grant-months", "extend-trial", "freeze", "reactivate", "mark-paid", "mark-pending"];

export function MasterControl() {
  const { user } = useAuth();
  const isMaster = user?.role === "admin_general" || user?.role === "admin";
  const [lawyers, setLawyers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.allSettled([
        axios.get(`${API}/admin-ops/sales/candidates`, { params: { status_filter: "" } }),
        axios.get(`${API}/admin-master/audit`, { params: { limit: 60 } }),
      ]);
      if (c.status === "fulfilled") setLawyers(Array.isArray(c.value.data) ? c.value.data : c.value.data?.candidates || []);
      if (a.status === "fulfilled") setAudit(a.value.data || []);
    } catch (e) { /* */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  const runLawyer = async (id, action) => {
    let value;
    if (action === "change-plan") { value = window.prompt("Plan (esencial/profesional/elite/ilimitado):", "profesional"); if (!value) return; }
    setBusyId(id);
    try {
      await axios.post(`${API}/admin-master/lawyer/${id}`, { action, value });
      notify("success", `Acción «${action}» aplicada`);
      await load();
    } catch (e) { notify("error", e?.response?.data?.detail || "No se pudo ejecutar"); }
    finally { setBusyId(null); }
  };

  const runSub = async (id, action) => {
    const body = { action };
    if (action === "grant-months") body.months = Number(window.prompt("¿Cuántos meses gratis?", "1")) || 1;
    if (action === "extend-trial") body.days = Number(window.prompt("¿Cuántos días extender el trial?", "7")) || 7;
    if (action === "grant-free") body.plan = window.prompt("Plan a otorgar gratis:", "profesional") || "profesional";
    setBusyId(id);
    try {
      await axios.post(`${API}/admin-master/subscription/${id}`, body);
      notify("success", `Suscripción: «${action}» aplicada`);
      await load();
    } catch (e) { notify("error", e?.response?.data?.detail || "No se pudo ejecutar"); }
    finally { setBusyId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#f97316]/30 bg-[#f97316]/[0.06] px-4 py-2.5 text-xs text-[#fdba74] flex items-center gap-2">
        <ShieldCheck className="w-4 h-4" /> Administrador Maestro · autoridad total sobre el sistema · cada acción queda auditada.
      </div>

      {/* ── Herramientas del Administrador Maestro (acceso exclusivo) ──
          Aísla todo lo heredado detrás del rol Maestro. El AdminPanel legacy NO se
          elimina: se accede solo desde aquí (/admin/master/legacy), nunca tras login
          ni desde el Sidebar del System OS. */}
      {isMaster && (
        <section className="rounded-2xl border border-[#f97316]/25 bg-[#f97316]/[0.04] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h3 className="font-bold flex items-center gap-2"><Wrench className="w-4 h-4 text-[#f97316]" /> Herramientas del Administrador Maestro</h3>
            <p className="text-[11px] text-white/40 mt-0.5">Acceso exclusivo · aislado del Punto Cero System OS · solo Administrador Maestro.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
            <Link to="/admin/master/legacy" className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#f97316]/40 transition-all p-4 flex flex-col gap-2" data-testid="master-tool-legacy-tools">
              <Wrench className="w-5 h-5 text-[#f97316]" />
              <div className="text-sm font-semibold">Herramientas Legacy</div>
              <div className="text-[11px] text-white/45">Módulos heredados del Centro de Gestión.</div>
              <span className="text-[11px] text-[#fdba74] inline-flex items-center gap-1 mt-auto">Abrir <ExternalLink className="w-3 h-3" /></span>
            </Link>
            <Link to="/admin/master/legacy" className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#f97316]/40 transition-all p-4 flex flex-col gap-2" data-testid="master-tool-root-console">
              <Terminal className="w-5 h-5 text-[#3b82f6]" />
              <div className="text-sm font-semibold">Consola Root</div>
              <div className="text-[11px] text-white/45">Intervención operativa directa (ventas/operaciones/talento/facturación).</div>
              <span className="text-[11px] text-[#fdba74] inline-flex items-center gap-1 mt-auto">Abrir <ExternalLink className="w-3 h-3" /></span>
            </Link>
            <a href="#auditoria-historica" className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#10b981]/40 transition-all p-4 flex flex-col gap-2" data-testid="master-tool-audit">
              <History className="w-5 h-5 text-[#10b981]" />
              <div className="text-sm font-semibold">Auditoría Histórica</div>
              <div className="text-[11px] text-white/45">Registro inmutable de cada acción maestra.</div>
              <span className="text-[11px] text-[#6ee7b7] inline-flex items-center gap-1 mt-auto">Ver abajo ↓</span>
            </a>
            <Link to="/admin/master/legacy" className="group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#8b5cf6]/40 transition-all p-4 flex flex-col gap-2" data-testid="master-tool-adminpanel">
              <Archive className="w-5 h-5 text-[#8b5cf6]" />
              <div className="text-sm font-semibold">AdminPanel Heredado</div>
              <div className="text-[11px] text-white/45">Panel histórico completo, preservado por compatibilidad.</div>
              <span className="text-[11px] text-[#fdba74] inline-flex items-center gap-1 mt-auto">Abrir <ExternalLink className="w-3 h-3" /></span>
            </Link>
          </div>
        </section>
      )}

      {/* Abogados — acciones maestras */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Users className="w-4 h-4 text-[#3b82f6]" /> Abogados ({lawyers.length})</h3>
          <button onClick={load} className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" /> Refrescar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-white/40 text-xs uppercase border-b border-white/10">
              <th className="p-3 pl-5">Abogado</th><th className="p-3">Especialidad</th><th className="p-3">Estado</th>
              <th className="p-3 pr-5 text-right">Acciones maestras</th>
            </tr></thead>
            <tbody>
              {lawyers.map((l) => {
                const id = l.id || l._id;
                return (
                  <tr key={id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="p-3 pl-5"><div className="font-medium">{l.full_name}</div><div className="text-[11px] text-white/40">{l.email}</div></td>
                    <td className="p-3 text-white/70">{l.specialty || "—"}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/70">{l.status || "—"}</span></td>
                    <td className="p-3 pr-5">
                      <div className="flex items-center justify-end gap-2">
                        <ActionMenu actions={LAWYER_ACTIONS} busy={busyId === id} label="Abogado" onAction={(a) => runLawyer(id, a)} />
                        <ActionMenu actions={SUB_ACTIONS} busy={busyId === id} label="Suscripción" onAction={(a) => runSub(id, a)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {lawyers.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-white/40">Sin abogados.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historial de auditoría */}
      <section id="auditoria-historica" className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10">
          <h3 className="font-bold flex items-center gap-2"><History className="w-4 h-4 text-[#10b981]" /> Historial de Auditoría ({audit.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f172a]"><tr className="text-left text-white/40 text-xs uppercase border-b border-white/10">
              <th className="p-3 pl-5">Fecha/Hora</th><th className="p-3">Admin</th><th className="p-3">Acción</th><th className="p-3">Módulo</th><th className="p-3">Entidad</th>
            </tr></thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-white/5">
                  <td className="p-3 pl-5 text-[11px] text-white/50">{a.timestamp ? new Date(a.timestamp).toLocaleString("es-CO") : "—"}</td>
                  <td className="p-3 text-white/70">{a.admin_name}</td>
                  <td className="p-3 font-mono text-[11px] text-[#67e8f9]">{a.action}</td>
                  <td className="p-3 text-white/60">{a.module}</td>
                  <td className="p-3 text-white/50 text-[11px]">{a.entity_label || a.entity_id || "—"}</td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-white/40">Sin registros de auditoría.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {toast && (
        <div className={`fixed top-6 right-6 z-[70] px-4 py-3 rounded-2xl border text-sm font-semibold backdrop-blur-md ${
          toast.type === "success" ? "bg-[#10b981]/15 border-[#10b981]/40 text-[#6ee7b7]" : "bg-[#ef4444]/15 border-[#ef4444]/40 text-[#fca5a5]"
        }`} data-testid="master-toast">{toast.msg}</div>
      )}
    </div>
  );
}

export default MasterControl;
