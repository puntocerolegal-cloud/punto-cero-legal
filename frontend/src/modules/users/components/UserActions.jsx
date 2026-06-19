import React from "react";
import { Pencil, Power, PowerOff, Ban, KeyRound } from "lucide-react";

/**
 * Acciones por usuario (columna de la tabla).
 * onAction(id, action) → "edit" | "activate" | "deactivate" | "suspend" | "reset".
 * (Cambiar organización / rol se realizan desde el modal de edición.)
 */
export function UserActions({ user, onAction, busy = false }) {
  const u = user || {};
  const Btn = ({ action, icon: Icon, label, cls, disabled }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled || busy}
      onClick={() => onAction?.(u._id, action)}
      className={`p-1.5 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${cls}`}
      data-testid={`user-${action}-${u._id}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );

  return (
    <div className="inline-flex items-center gap-1">
      <Btn action="edit" icon={Pencil} label="Editar" cls="border-white/10 bg-white/5 text-white/70 hover:bg-white/10" />
      <Btn action="activate" icon={Power} label="Activar" disabled={u.status === "ACTIVO"} cls="border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20" />
      <Btn action="deactivate" icon={PowerOff} label="Desactivar" disabled={u.status === "INACTIVO"} cls="border-white/15 bg-white/5 text-white/60 hover:bg-white/10" />
      <Btn action="suspend" icon={Ban} label="Suspender" disabled={u.status === "SUSPENDIDO"} cls="border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20" />
      <Btn action="reset" icon={KeyRound} label="Restablecer acceso" cls="border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20" />
    </div>
  );
}

export default UserActions;
