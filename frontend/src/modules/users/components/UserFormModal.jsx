import React, { useState } from "react";
import { X, Save, UserPlus } from "lucide-react";

const STATUSES = ["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"];

/**
 * Modal Crear / Editar usuario. Incluye cambio de organización y rol.
 * onSave(payload) → el page persiste (mock local o backend) y cierra.
 */
export function UserFormModal({ user, options, onClose, onSave }) {
  const editing = Boolean(user?._id);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || options.roles[0] || "",
    organization: user?.organization || options.organizations[0] || "",
    vertical: user?.vertical || options.verticals[0] || "",
    plan: user?.plan || "—",
    status: user?.status || "PENDIENTE",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...user, ...form });
    } finally {
      setSaving(false);
    }
  };

  const Input = ({ k, label, type = "text" }) => (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <input
        type={type}
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50"
      />
    </div>
  );

  const Select = ({ k, label, items }) => (
    <div>
      <label className="block text-xs text-white/50 mb-1">{label}</label>
      <select
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        className="w-full bg-[#0a0e1a] border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50"
      >
        {items.map((it) => <option key={it} value={it}>{it}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="user-form-modal">
      <div onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <UserPlus className="w-5 h-5 text-[#f97316]" /> {editing ? "Editar usuario" : "Crear usuario"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-white/70"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input k="name" label="Nombre completo" />
          <Input k="email" label="Email" type="email" />
          <Select k="role" label="Rol" items={options.roles} />
          <Select k="organization" label="Organización" items={options.organizations} />
          <Select k="vertical" label="Vertical" items={options.verticals} />
          <Input k="plan" label="Plan" />
          <Select k="status" label="Estado" items={STATUSES} />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5">Cancelar</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60" data-testid="user-save-btn">
            <Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserFormModal;
