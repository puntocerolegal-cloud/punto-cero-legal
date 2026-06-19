import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, X, Save, ShieldAlert, Loader2, PlugZap } from "lucide-react";
import { apiClient } from "@/config/api/apiClient";
import { partnersService } from "@/services/os";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";
import { useAuth } from "@/contexts/AuthContext";
import { CURRENCIES } from "@/modules/plans/mockData";

const COUNTRY_CCY = CURRENCIES.reduce((a, c) => ({ ...a, [c.country]: c.currency_code }), {});
const COUNTRIES = Object.keys(COUNTRY_CCY);
const STATUSES = ["active", "pending", "inactive"];
const unwrap = (r) => (r?.data && typeof r.data === "object" && "success" in r.data ? r.data.data : r.data);
const is401 = (e) => e?.response?.status === 401;

/**
 * AgentManager — gestión administrativa (CRUD) de la Red de Agentes (partners).
 * Crear (+ NUEVO), edición en línea (PUT) y borrar (con confirmación). Persiste
 * en el backend con el token del admin; ante 401 abre el modal de
 * re-autenticación. Emite eventos → el Dashboard Ejecutivo se refresca al instante.
 */
export function AgentManager() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [reAuth, setReAuth] = useState(false);
  const [edit, setEdit] = useState(null); // { id, field, value }

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get("/partners");
      const list = unwrap(res) || [];
      // DEBUG (temporal): confirma en consola que los agentes del backend llegan.
      // eslint-disable-next-line no-console
      console.log("[PCL][AgentManager] agentes recibidos:", list.length, list);
      setAgents(list);
    } catch (e) {
      if (is401(e)) setReAuth(true); else setError(e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const evs = [OS_EVENTS.partnerCreated, OS_EVENTS.partnerUpdated, OS_EVENTS.partnerDeleted];
    const unsubs = evs.map((ev) => eventBus.on(ev, load));
    return () => unsubs.forEach((u) => u());
  }, [load]);

  // Envuelve mutaciones: ante 401 dispara re-autenticación en vez de fallar en silencio.
  const guard = useCallback(async (fn) => {
    try { await fn(); await load(); }
    catch (e) { if (is401(e)) setReAuth(true); else alert(e?.response?.data?.message || e.message || "Error"); }
  }, [load]);

  const commitEdit = () => {
    if (!edit) return;
    const { id, field, value } = edit;
    const payload = { [field]: field === "commissionRate" ? Number(value) : value };
    setEdit(null);
    guard(() => partnersService.updatePartner(id, payload));
  };

  const remove = (a) => {
    if (!window.confirm(`¿Eliminar al agente "${a.companyName}"? Esta acción no se puede deshacer.`)) return;
    guard(() => partnersService.deletePartner(a._id));
  };

  const Cell = ({ a, field, type = "text", options }) => {
    const editing = edit && edit.id === a._id && edit.field === field;
    if (editing) {
      return type === "select" ? (
        <select autoFocus value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()} className="bg-[#0a0e1a] border border-[#8b5cf6]/50 rounded px-2 py-1 text-xs text-white">
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input autoFocus type={type} value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()} className="w-24 bg-[#0a0e1a] border border-[#8b5cf6]/50 rounded px-2 py-1 text-xs text-white" />
      );
    }
    return (
      <button onClick={() => setEdit({ id: a._id, field, value: a[field] ?? "" })} className="text-left hover:text-white hover:underline decoration-dotted">
        {field === "commissionRate" ? `${a[field] ?? 0}%` : (a[field] || "—")}
      </button>
    );
  };

  return (
    <section className="rounded-2xl border border-[#8b5cf6]/30 bg-white/[0.03] backdrop-blur-md p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Gestión · Red de Agentes (CRUD)</h2>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white text-sm font-bold" data-testid="agent-new">
          <Plus className="w-4 h-4" /> + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-white/40 text-sm inline-flex items-center gap-2 justify-center w-full"><Loader2 className="w-4 h-4 animate-spin" /> Cargando agentes…</div>
      ) : error ? (
        <div className="py-8 text-center text-[#ef4444] text-sm inline-flex items-center gap-2 justify-center w-full"><PlugZap className="w-4 h-4" /> Error de conexión ({error?.response?.status || "red"}).</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10 text-xs uppercase tracking-wider">
                <th className="p-2.5">Nombre</th><th className="p-2.5">País</th><th className="p-2.5">Moneda</th>
                <th className="p-2.5">Comisión</th><th className="p-2.5">Estado</th><th className="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="p-2.5 text-white font-medium">{a.companyName}</td>
                  <td className="p-2.5 text-white/70"><Cell a={a} field="country" type="select" options={["", ...COUNTRIES]} /></td>
                  <td className="p-2.5 font-mono text-[#8b5cf6]"><Cell a={a} field="currencyCode" /></td>
                  <td className="p-2.5 text-white/80"><Cell a={a} field="commissionRate" type="number" /></td>
                  <td className="p-2.5"><Cell a={a} field="status" type="select" options={STATUSES} /></td>
                  <td className="p-2.5 text-right">
                    <button onClick={() => remove(a)} className="p-1.5 rounded-lg bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444]" title="Eliminar" data-testid={`agent-del-${a._id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-white/40">Sin agentes. Usa “+ Nuevo” para registrar el primero.</td></tr>}
            </tbody>
          </table>
          <p className="text-[11px] text-white/30 mt-2">Tip: haz clic en País, Moneda, Comisión o Estado para editar en línea (Enter para guardar).</p>
        </div>
      )}

      {showNew && <NewAgentModal onClose={() => setShowNew(false)} onSave={(form) => guard(() => partnersService.createPartner(form)).then(() => setShowNew(false))} />}
      {reAuth && <ReAuthModal onClose={() => setReAuth(false)} onDone={() => { setReAuth(false); load(); }} />}
    </section>
  );
}

function NewAgentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ companyName: "", country: "Colombia", currencyCode: "COP", commissionRate: 10, vertical: "Jurídico", status: "active", stage: "lead" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === "country" ? { currencyCode: COUNTRY_CCY[v] || "USD" } : {}) }));
  const [saving, setSaving] = useState(false);
  const submit = async () => { if (!form.companyName.trim()) return; setSaving(true); try { await onSave(form); } finally { setSaving(false); } };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="agent-modal">
      <div onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-7 max-w-lg w-full">
        <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-white">Nuevo Agente</h3><button onClick={onClose} className="p-1 text-white/60 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button></div>
        <div className="space-y-4">
          <Field label="Nombre"><input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="País">
              <select value={form.country} onChange={(e) => set("country", e.target.value)} className="w-full bg-[#0a0e1a] border border-white/20 rounded-xl px-3 py-2 text-sm text-white">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Moneda Local"><input value={form.currencyCode} onChange={(e) => set("currencyCode", e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-mono" /></Field>
          </div>
          <Field label={`Plan de Comisión: ${form.commissionRate}%`}>
            <input type="range" min={10} max={20} step={1} value={form.commissionRate} onChange={(e) => set("commissionRate", Number(e.target.value))} className="w-full accent-[#8b5cf6]" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60" data-testid="agent-save"><Save className="w-4 h-4" /> {saving ? "Guardando…" : "Crear agente"}</button>
        </div>
      </div>
    </div>
  );
}

function ReAuthModal({ onClose, onDone }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const submit = async () => {
    setBusy(true); setErr(false);
    try { await login(email, password); onDone(); }
    catch (e) { setErr(true); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" data-testid="reauth-modal">
      <div className="bg-[#0f172a] border border-[#ef4444]/30 rounded-3xl p-7 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-3"><ShieldAlert className="w-5 h-5 text-[#ef4444]" /><h3 className="text-lg font-bold text-white">Re-autenticación necesaria</h3></div>
        <p className="text-sm text-white/50 mb-4">Tu sesión admin expiró o falta. Inicia sesión para continuar gestionando la Red de Agentes.</p>
        <div className="space-y-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white" />
        </div>
        {err && <p className="text-xs text-[#ef4444] mt-2">Credenciales inválidas.</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm">Cerrar</button>
          <button onClick={submit} disabled={busy} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold disabled:opacity-60" data-testid="reauth-submit">{busy ? "Entrando…" : "Re-autenticar"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-xs text-white/50 mb-1">{label}</label>{children}</div>;
}

export default AgentManager;
