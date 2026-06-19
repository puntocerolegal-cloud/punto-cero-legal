import React from "react";
import { Search } from "lucide-react";

/**
 * Búsqueda avanzada + filtros (rol, vertical, organización, estado).
 * Controlado por el page; `options` provee los valores únicos disponibles.
 */
export function UserFilters({ value, onChange, options }) {
  const set = (k, v) => onChange({ ...value, [k]: v });

  const Select = ({ k, label, items }) => (
    <select
      value={value[k]}
      onChange={(e) => set(k, e.target.value)}
      className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#f97316]/50"
      data-testid={`user-filter-${k}`}
    >
      <option value="">{label}: todos</option>
      {items.map((it) => <option key={it} value={it}>{it}</option>)}
    </select>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Buscar por nombre, email u organización..."
          className="w-full bg-white/5 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f97316]/50"
          data-testid="user-search"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select k="role" label="Rol" items={options.roles} />
        <Select k="vertical" label="Vertical" items={options.verticals} />
        <Select k="organization" label="Organización" items={options.organizations} />
        <Select k="status" label="Estado" items={options.statuses} />
      </div>
    </div>
  );
}

export default UserFilters;
