import React, { useState, useRef, useEffect } from "react";
import {
  MoreVertical, Eye, Pencil, Share2, CheckCircle2, XCircle,
  Power, PowerOff, Trash2, RotateCcw, Clock, Gift, CreditCard, Snowflake, ArrowRightLeft,
} from "lucide-react";

// Catálogo de acciones maestras (icono + tono). El módulo elige cuáles mostrar.
export const ACTION_DEFS = {
  view: { label: "Ver", icon: Eye, tone: "text-white/80" },
  edit: { label: "Editar", icon: Pencil, tone: "text-[#3b82f6]" },
  share: { label: "Compartir", icon: Share2, tone: "text-[#06b6d4]" },
  preview: { label: "Vista previa", icon: Eye, tone: "text-[#8b5cf6]" },
  approve: { label: "Aprobar", icon: CheckCircle2, tone: "text-[#10b981]" },
  reject: { label: "Rechazar", icon: XCircle, tone: "text-[#ef4444]" },
  activate: { label: "Activar", icon: Power, tone: "text-[#10b981]" },
  deactivate: { label: "Desactivar", icon: PowerOff, tone: "text-[#f59e0b]" },
  suspend: { label: "Suspender", icon: PowerOff, tone: "text-[#f59e0b]" },
  block: { label: "Bloquear", icon: XCircle, tone: "text-[#ef4444]" },
  reactivate: { label: "Reactivar", icon: RotateCcw, tone: "text-[#10b981]" },
  delete: { label: "Eliminar", icon: Trash2, tone: "text-[#ef4444]" },
  restore: { label: "Restaurar", icon: RotateCcw, tone: "text-[#10b981]" },
  reassign: { label: "Reasignar", icon: ArrowRightLeft, tone: "text-[#3b82f6]" },
  "extend-trial": { label: "Extender trial", icon: Clock, tone: "text-[#06b6d4]" },
  "grant-months": { label: "Otorgar meses gratis", icon: Gift, tone: "text-[#10b981]" },
  "grant-free": { label: "Suscripción gratuita", icon: Gift, tone: "text-[#10b981]" },
  "change-plan": { label: "Cambiar plan", icon: CreditCard, tone: "text-[#f97316]" },
  "mark-paid": { label: "Marcar pago validado", icon: CheckCircle2, tone: "text-[#10b981]" },
  "mark-pending": { label: "Marcar pago pendiente", icon: Clock, tone: "text-[#f59e0b]" },
  freeze: { label: "Congelar", icon: Snowflake, tone: "text-[#3b82f6]" },
};

/**
 * Menú de acciones administrativas reutilizable para tablas/listados.
 * `actions`: array de claves de ACTION_DEFS. `onAction(key)`: callback.
 */
export function ActionMenu({ actions = [], onAction, busy = false, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((o) => !o)} disabled={busy}
        className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 disabled:opacity-40"
        aria-label="Acciones" data-testid="action-menu-trigger">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 max-h-[60vh] overflow-y-auto bg-[#0f172a] border border-white/15 rounded-xl shadow-2xl z-[60] py-1">
          {label && <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/40 border-b border-white/10">{label}</div>}
          {actions.map((key) => {
            const def = ACTION_DEFS[key];
            if (!def) return null;
            const Icon = def.icon;
            return (
              <button key={key} onClick={() => { setOpen(false); onAction?.(key); }}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5"
                data-testid={`action-${key}`}>
                <Icon className={`w-4 h-4 ${def.tone}`} /> <span className="text-white/85">{def.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
