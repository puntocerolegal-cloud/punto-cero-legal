// Capa fina sobre la etiqueta global de Google (gtag.js · Google Ads AW-18257967742).
// La etiqueta se carga UNA sola vez en public/index.html; aquí solo se DISPARAN
// eventos de forma segura (no-op si gtag aún no está disponible), para no
// duplicar la etiqueta ni romper la UX por la analítica.

export const GOOGLE_ADS_ID = "AW-18257967742";

/** Dispara un evento estándar de gtag de forma tolerante a fallos. */
export function trackEvent(name, params = {}) {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, params);
    }
  } catch (e) {
    /* nunca romper la experiencia por un fallo de analítica */
  }
}

/**
 * Registra una conversión de Google Ads.
 * `label` = etiqueta de la acción de conversión creada en Google Ads
 * (formato AW-18257967742/XXXXXXXX). Cuando se creen las acciones de conversión
 * en el panel de Google Ads, basta con pasar su label aquí.
 */
export function trackConversion(label, params = {}) {
  if (!label) return;
  trackEvent("conversion", { send_to: `${GOOGLE_ADS_ID}/${label}`, ...params });
}

// Eventos base del embudo (reutilizables como conversiones en Google Ads):
//   - generate_lead → formulario de cliente / abogado enviado
//   - sign_up       → registro de usuario completado
// Para convertirlos en conversiones de Ads, créalas en el panel e invoca
// trackConversion('<label>') junto al evento correspondiente.
