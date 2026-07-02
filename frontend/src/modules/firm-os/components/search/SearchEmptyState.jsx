import React from "react";
import { Search } from "lucide-react";

export function SearchEmptyState({ query, filters }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
      <Search className="mx-auto mb-4 h-12 w-12 text-white/30" />
      <p className="text-white/60 font-medium">No se encontraron resultados</p>
      <p className="text-white/40 text-sm mt-2">
        {query ? `Intenta con otra búsqueda o ajusta los filtros` : "Comienza buscando"}
      </p>
    </div>
  );
}
