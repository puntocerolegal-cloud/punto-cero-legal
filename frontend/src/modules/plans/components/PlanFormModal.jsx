import React, { useState } from "react";
import { X, Save, Tag } from "lucide-react";

const SUPPORT_LEVELS = ["basic", "standard", "priority", "dedicated"];
const emptyLimits = { max_users: 1, max_cases: 50, max_storage: 5, max_ai_requests: 100, video_enabled: false, billing_enabled: false, api_enabled: false, support_level: "basic" };

/**
 * Modal Crear / Editar / Duplicar plan. Edita precio base USD y todos los límites.
 * Precios locales se derivan luego de priceUsd (moneda base del sistema).
 */
export function PlanFormModal({ plan, mode = "create", onClose, onSave }) {
  const [form, setForm] = useState({
    name: mode === "duplicate" ? `${plan?.name || ""} (copia)` : plan?.name || "",
    priceUsd: plan?.priceUsd ?? 0,
    status: plan?.status || "ACTIVO",
    limits: { ...emptyLimits, ...(plan?.limits || {}) },
    features: plan?.features || [],
  });
  const [saving, setSaving] = useState(false);
  const setLimit = (k, v) => setForm((f) => ({ ...f, limits: { ...f.limits, [k]: v } }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...(mode === "edit" ? plan : {}), ...form, priceUsd: Number(form.priceUsd) });
    } finally {
      setSaving(false);
    }
  };

  const Num = ({ k, label, hint }) => (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <input type="number" value={form.limits[k]} onChange={(e) => setLimit(k, Number(e.target.value))}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50" />
      {hint && <p className="text-[10px] text-white/30 mt-1">{hint}</p>}
    </div>
  );
  const Toggle = ({ k, label }) => (
    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
      <input type="checkbox" checked={Boolean(form.limits[k])} onChange={(e) => setLimit(k, e.target.checked)} /> {label}
    </label>
  );

  const title = mode === "edit" ? "Editar plan" : mode === "duplicate" ? "Duplicar plan" : "Crear plan";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="plan-form-modal">
      <div onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white"><Tag className="w-5 h-5 text-[#f97316]" /> {title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/70"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Nombre del plan</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Precio base (USD)</label>
            <input type="number" step="0.01" value={form.priceUsd} onChange={(e) => setForm((f) => ({ ...f, priceUsd: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50" />
          </div>
        </div>

        <div className="mt-4 text-xs uppercase tracking-wider text-white/40 font-semibold">Límites del plan</div>
        <div className="mt-2 grid md:grid-cols-2 gap-4">
          <Num k="max_users" label="Máx. usuarios" hint="-1 = ilimitado" />
          <Num k="max_cases" label="Máx. casos" hint="-1 = ilimitado" />
          <Num k="max_storage" label="Almacenamiento (GB)" />
          <Num k="max_ai_requests" label="Solicitudes IA / mes" hint="-1 = ilimitado" />
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <Toggle k="video_enabled" label="Video habilitado" />
          <Toggle k="billing_enabled" label="Facturación habilitada" />
          <Toggle k="api_enabled" label="API habilitada" />
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Nivel de soporte</label>
            <select value={form.limits.support_level} onChange={(e) => setLimit("support_level", e.target.value)}
              className="w-full bg-[#0a0e1a] border border-white/20 rounded-xl px-3 py-2 text-sm text-white">
              {SUPPORT_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Estado</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full bg-[#0a0e1a] border border-white/20 rounded-xl px-3 py-2 text-sm text-white">
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60" data-testid="plan-save-btn">
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlanFormModal;
