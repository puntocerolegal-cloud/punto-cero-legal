import React, { useMemo } from "react";
import { COUNTRIES, DEFAULT_COUNTRY } from "@/config/countries";

/**
 * Selector telefónico internacional reutilizable.
 * Value = string completo "+57 3001234567". onChange devuelve ese string.
 * Detecta el país por el prefijo (dial) al cargar; permite cambiarlo.
 */
export function PhoneInput({ value = "", onChange, className = "", inputClassName = "" }) {
  const { country, local } = useMemo(() => {
    const v = (value || "").trim();
    // Buscar el país cuyo dial prefija el valor (los más largos primero).
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    const match = sorted.find((c) => v.startsWith(c.dial));
    if (match) return { country: match, local: v.slice(match.dial.length).trim() };
    return { country: DEFAULT_COUNTRY, local: v.replace(/^\+/, "") };
  }, [value]);

  const emit = (c, l) => onChange?.(`${c.dial} ${String(l).trim()}`.trim());

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={country.iso}
        onChange={(e) => emit(COUNTRIES.find((c) => c.iso === e.target.value) || DEFAULT_COUNTRY, local)}
        className={`bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-sm ${inputClassName}`}
        aria-label="País (prefijo telefónico)"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso} className="bg-slate-800 text-white">
            {c.flag} {c.dial} · {c.name}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={local}
        onChange={(e) => emit(country, e.target.value.replace(/[^\d\s-]/g, ""))}
        placeholder="Número"
        className={`flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 ${inputClassName}`}
      />
    </div>
  );
}

export default PhoneInput;
