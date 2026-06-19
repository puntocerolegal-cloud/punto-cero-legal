import React from "react";
import { ShieldCheck, Users, Layers, Pencil, Copy, PowerOff, Power } from "lucide-react";
import { RoleStatusBadge } from "./RoleStatusBadge";

/**
 * Tarjeta de rol. Muestra identidad, usuarios, verticales y acciones
 * (editar, duplicar, activar/desactivar).
 * onAction(id, action) → "edit" | "duplicate" | "deactivate" | "activate".
 */
export function RoleCard({ role, onAction, busy = false }) {
  const r = role || {};
  const isActive = r.status === "ACTIVO";

  const Btn = ({ action, icon: Icon, label, cls }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={busy}
      onClick={() => onAction?.(r._id, action)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${cls}`}
      data-testid={`role-${action}-${r._id}`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 transition-all hover:border-white/25">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-[#f97316]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">{r.name}</div>
            <div className="text-[11px] text-white/40 font-mono">{r.key}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {r.custom && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8b5cf6]/15 text-[#c4b5fd] border border-[#8b5cf6]/30">Personalizado</span>}
          <RoleStatusBadge status={r.status} />
        </div>
      </div>

      <p className="mt-3 text-xs text-white/50 leading-relaxed">{r.description}</p>

      <div className="mt-4 flex items-center gap-4 text-xs text-white/60">
        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {r.users} usuarios</span>
        <span className="inline-flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {(r.verticals || []).join(", ") || "—"}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
        <Btn action="edit" icon={Pencil} label="Editar" cls="border-white/10 bg-white/5 text-white/70 hover:bg-white/10" />
        <Btn action="duplicate" icon={Copy} label="Duplicar" cls="border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#93c5fd] hover:bg-[#3b82f6]/20" />
        {isActive ? (
          <Btn action="deactivate" icon={PowerOff} label="Desactivar" cls="border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20" />
        ) : (
          <Btn action="activate" icon={Power} label="Activar" cls="border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20" />
        )}
      </div>
    </div>
  );
}

export default RoleCard;
