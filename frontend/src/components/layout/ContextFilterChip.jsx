import React from 'react';
import { FolderKanban, X } from 'lucide-react';
import { useCaseContext } from '../../contexts/CaseContext';

/**
 * Chip de filtro por expediente activo — Punto Cero Legal.
 * Se muestra dentro de un módulo cuando hay un expediente activo en el contexto
 * global, indicando que la vista está filtrada. Botón "Limpiar" quita el filtro.
 */
export function ContextFilterChip() {
  const { active, clear } = useCaseContext();
  if (!active?.case_id) return null;
  return (
    <div className="rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/[0.06] px-4 py-2.5 flex items-center justify-between gap-3" data-testid="context-filter-chip">
      <div className="flex items-center gap-2 text-xs text-[#67e8f9] min-w-0">
        <FolderKanban className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold">{active.expediente_id || active.case_number}</span>
        <span className="text-white/40">·</span>
        <span className="truncate">{active.client_name}</span>
      </div>
      <button onClick={clear} className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white flex-shrink-0" data-testid="context-clear">
        <X className="w-3.5 h-3.5" /> Limpiar
      </button>
    </div>
  );
}

export default ContextFilterChip;
