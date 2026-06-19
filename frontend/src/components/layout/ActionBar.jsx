import React from "react";
import { Plus, Pencil, Ban, Eye, Printer } from "lucide-react";
import { useActionStore } from "./DashboardActions";

/**
 * Barra de Acciones Global — Punto Cero Oficina Virtual.
 * Toolbar unificada y minimalista (black glassmorphism) presente en todos los
 * módulos del dashboard del abogado. Botones consistentes:
 *   [+] Agregar · [✎] Editar · [⊘] Eliminar · [👁] Vista Previa · [🖨] Imprimir
 *
 * Es presentacional: cada módulo puede pasar handlers (onAdd/onEdit/…). Imprimir
 * usa window.print() por defecto. Los botones sin handler quedan inactivos
 * (atenuados) para indicar que esa acción no aplica en la vista actual.
 */
export function ActionBar(props) {
  // Los handlers vienen del store (cada página los registra con usePageActions);
  // las props explícitas tienen prioridad si se pasan directamente.
  const registered = useActionStore();
  const { onAdd, onEdit, onDelete, onPreview, onPrint } = { ...registered, ...props };
  const print = onPrint || (() => window.print());
  const actions = [
    { key: "add", icon: Plus, label: "Agregar", fn: onAdd, accent: "#10b981" },
    { key: "edit", icon: Pencil, label: "Editar", fn: onEdit, accent: "#3b82f6" },
    { key: "delete", icon: Ban, label: "Eliminar", fn: onDelete, accent: "#ef4444" },
    { key: "preview", icon: Eye, label: "Vista Previa", fn: onPreview, accent: "#8b5cf6" },
    { key: "print", icon: Printer, label: "Imprimir", fn: print, accent: "#f97316" },
  ];

  return (
    <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-2.5 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-end gap-1.5">
        {actions.map((a) => {
          const disabled = !a.fn;
          return (
            <button
              key={a.key}
              onClick={a.fn || undefined}
              disabled={disabled}
              title={a.label}
              aria-label={a.label}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                disabled
                  ? "border-white/5 text-white/25 cursor-not-allowed"
                  : "border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/10"
              }`}
              data-testid={`actionbar-${a.key}`}
            >
              <a.icon className="w-3.5 h-3.5" style={!disabled ? { color: a.accent } : undefined} />
              <span className="hidden sm:inline">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ActionBar;
