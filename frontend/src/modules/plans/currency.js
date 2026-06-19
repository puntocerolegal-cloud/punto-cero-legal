// Utilidades de moneda del Motor de Planes — Punto Cero System OS.
// Moneda base: USD. La conversión es local (mock); preparada para conectar luego
// proveedores de tasas (exchange-rate-api / openexchangerates / currencylayer).

/** Convierte un monto en USD a la moneda destino usando su exchange_rate. */
export function convertFromUsd(amountUsd, currency) {
  const rate = currency?.exchange_rate ?? 1;
  return Number(amountUsd || 0) * rate;
}

/** Formatea un monto con el código ISO de moneda (Intl). */
export function formatMoney(amount, code = "USD", locale = "es-CO") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "USD" || code === "EUR" ? 2 : 0,
    }).format(Number(amount || 0));
  } catch (e) {
    return `${Number(amount || 0).toLocaleString(locale)} ${code}`;
  }
}

/** Precio local de un plan (desde su priceUsd) en la moneda dada. */
export function localPrice(plan, currency) {
  return convertFromUsd(plan?.priceUsd, currency);
}

/** Busca una moneda del catálogo por su código. */
export function findCurrency(currencies, code) {
  return (currencies || []).find((c) => c.currency_code === code) || null;
}
