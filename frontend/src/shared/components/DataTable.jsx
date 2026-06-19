import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";

/**
 * Tabla de datos reutilizable — Punto Cero OS.
 * Búsqueda + ordenamiento + paginación client-side, y columna de acciones.
 *
 * props:
 *  - columns: [{ key, label, sortable?, render?(row), className? }]
 *  - data: array de filas
 *  - searchable (bool, default true) · searchKeys (array de keys a buscar)
 *  - pageSize (default 10)
 *  - actions(row) -> ReactNode (columna final)
 *  - onRowClick(row)
 *  - empty: { icon, title, description }
 */
export function DataTable({
  columns = [],
  data = [],
  searchable = true,
  searchKeys,
  pageSize = 10,
  actions,
  onRowClick,
  empty = {},
  className,
}) {
  const [query, setQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState(null);
  const [sortDir, setSortDir] = React.useState("asc");
  const [page, setPage] = React.useState(1);

  const keys = searchKeys || columns.map((c) => c.key);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      keys.some((k) => String(row?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [data, query, keys]);

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a?.[sortKey], bv = b?.[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "es", { numeric: true });
    });
    return sortDir === "asc" ? copy : copy.reverse();
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => { setPage(1); }, [query, sortKey, sortDir]);

  const toggleSort = (col) => {
    if (!col.sortable) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col.key); setSortDir("asc"); }
  };

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden", className)}>
      {searchable && (
        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f97316]/50"
              data-testid="datatable-search"
            />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState title={empty.title || "Sin resultados"} description={empty.description} icon={empty.icon} className="border-0 bg-transparent" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/50 border-b border-white/10">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col)}
                    className={cn(
                      "px-4 py-3 font-semibold uppercase tracking-wider text-xs select-none",
                      col.sortable && "cursor-pointer hover:text-white",
                      col.className
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key &&
                        (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </span>
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-xs">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={row._id || row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={cn("border-b border-white/5 text-white/80 hover:bg-white/[0.03]", onRowClick && "cursor-pointer")}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3", col.className)}>
                      {col.render ? col.render(row) : (row?.[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs text-white/50">
          <span>{sorted.length} registros · página {safePage} de {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="w-8 h-8 rounded-lg border border-white/15 flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
