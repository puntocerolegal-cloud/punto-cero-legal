import React from "react";
import { Globe } from "lucide-react";

/**
 * Selector de país/moneda para visualizar precios locales.
 * value = currency_code seleccionado; onChange(code).
 */
export function CurrencySelector({ currencies = [], value, onChange }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Globe className="w-4 h-4 text-white/40" />
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#f97316]/50"
        data-testid="plan-currency-selector"
      >
        {currencies.map((c) => (
          <option key={c.id} value={c.currency_code}>
            {c.country} · {c.currency_code}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CurrencySelector;
