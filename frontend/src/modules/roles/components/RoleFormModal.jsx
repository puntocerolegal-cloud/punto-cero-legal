import React, { useState } from "react";
import { X, Save, ShieldCheck } from "lucide-react";

const VERTICAL_OPTIONS = ["Global", "Jurídico", "Medicina", "Odontología", "Contabilidad"];

/**
 * Modal Crear / Editar / Duplicar rol.
 * onSave(payload) → el page persiste y cierra.
 */
export function RoleFormModal({ role, mode = "create", onClose, onSave }) {
  const [form, setForm] = useState({
    name: mode === "duplicate" ? `${role?.name || ""} (copia)` : role?.name || "",
    key: mode === "edit" ? role?.key || "" : "",
    description: role?.description || "",
    verticals: role?.verticals || ["Global"],
    status: role?.status || "ACTIVO",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleVertical = (v) =>
    setForm((f) => ({
      ...f,
      verticals: f.verticals.includes(v) ? f.verticals.filter((x) => x !== v) : [...f.verticals, v],
    }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const key = form.key || form.name.trim().toUpperCase().replace(/\s+/g, "_");
      await onSave({ ...(mode === "edit" ? role : {}), ...form, key, custom: mode !== "edit" ? true : role?.custom });
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "edit" ? "Editar rol" : mode === "duplicate" ? "Duplicar rol" : "Crear rol";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="role-form-modal">
      <div onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white"><ShieldCheck className="w-5 h-5 text-[#f97316]" /> {title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/70"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Nombre del rol</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Verticales asociadas</label>
            <div className="flex flex-wrap gap-2">
              {VERTICAL_OPTIONS.map((v) => {
                const on = form.verticals.includes(v);
                return (
                  <button key={v} type="button" onClick={() => toggleVertical(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${on ? "border-[#f97316]/40 bg-[#f97316]/15 text-[#fdba74]" : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"}`}>
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Estado</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full bg-[#0a0e1a] border border-white/20 rounded-xl px-3 py-2 text-sm text-white">
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60" data-testid="role-save-btn">
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleFormModal;
