import * as React from "react";
import { ArrowRight } from "lucide-react";
import { DataTable } from "./DataTable";

/**
 * Registro de auditoría reutilizable — Punto Cero OS.
 * Reutiliza DataTable (búsqueda/orden/paginación) en vez de duplicar tabla.
 *
 * props.entries: [{ user, action, field, old_value, new_value, date }]
 */
export function AuditLog({ entries = [], className, pageSize = 10 }) {
  const columns = [
    { key: "date", label: "Fecha", sortable: true, render: (r) => <span className="text-white/60 whitespace-nowrap">{fmt(r.date)}</span> },
    { key: "user", label: "Usuario", sortable: true, render: (r) => <span className="text-white">{r.user || "—"}</span> },
    { key: "action", label: "Acción", sortable: true },
    { key: "field", label: "Campo", render: (r) => <span className="text-white/70">{r.field || "—"}</span> },
    {
      key: "change",
      label: "Cambio",
      render: (r) => (
        <span className="inline-flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] line-through max-w-[160px] truncate">{display(r.old_value)}</span>
          <ArrowRight className="w-3 h-3 text-white/40 flex-shrink-0" />
          <span className="px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] max-w-[160px] truncate">{display(r.new_value)}</span>
        </span>
      ),
    },
  ];

  return (
    <DataTable
      className={className}
      columns={columns}
      data={entries}
      searchKeys={["user", "action", "field"]}
      pageSize={pageSize}
      empty={{ title: "Sin registros de auditoría", description: "Los cambios sobre las entidades aparecerán aquí." }}
    />
  );
}

function display(v) {
  if (v === null || v === undefined || v === "") return "∅";
  return String(v);
}
function fmt(date) {
  if (!date) return "—";
  const s = typeof date === "string" ? date : String(date);
  return s.slice(0, 16).replace("T", " ");
}

export default AuditLog;
