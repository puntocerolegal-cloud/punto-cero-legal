import React from "react";
import { Power, PowerOff, Rocket } from "lucide-react";

/**
 * Acciones de ciclo de vida de una vertical.
 * onAction(id, action) → action ∈ "activate" | "deactivate" | "prepare".
 *   activate   → ACTIVA
 *   deactivate → DESHABILITADA
 *   prepare    → DESARROLLO (preparar para lanzamiento)
 */
export function VerticalActions({ vertical, onAction, busy = false }) {
  const v = vertical || {};
  const isActive = v.status === "ACTIVA";
  const isDisabled = v.status === "DESHABILITADA";

  const Btn = ({ action, icon: Icon, label, cls, disabled }) => (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => onAction?.(v._id, action)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
      data-testid={`vertical-${action}-${v._id}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Btn
        action="activate"
        icon={Power}
        label="Activar"
        disabled={isActive}
        cls="border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20"
      />
      <Btn
        action="prepare"
        icon={Rocket}
        label="Preparar lanzamiento"
        disabled={isActive}
        cls="border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20"
      />
      <Btn
        action="deactivate"
        icon={PowerOff}
        label="Desactivar"
        disabled={isDisabled}
        cls="border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"
      />
    </div>
  );
}

export default VerticalActions;
