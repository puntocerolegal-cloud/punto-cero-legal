// Feature flags de Punto Cero OS — alternar mock ↔ backend real sin tocar UI.
// PRODUCCIÓN: por defecto los mocks están DESACTIVADOS y los dominios con backend
// real quedan activos. Para desarrollo local se pueden reactivar explícitamente
// con REACT_APP_ENABLE_MOCKS=true.

const flag = (name, def = false) => {
  const v = process.env[name];
  if (v === undefined || v === null || v === "") return def;
  return String(v).toLowerCase() === "true";
};

export const features = {
  // Maestro: si true, los servicios devuelven datos mock aunque un flag de API esté activo.
  // Default FALSE → un build sin la variable nunca sirve datos demo en producción.
  ENABLE_MOCKS: flag("REACT_APP_ENABLE_MOCKS", false),

  // Dominios con backend real implementado → activos por defecto.
  ENABLE_ORGANIZATIONS_API: flag("REACT_APP_ENABLE_ORGANIZATIONS_API", true),
  ENABLE_PARTNERS_API: flag("REACT_APP_ENABLE_PARTNERS_API", true),
  ENABLE_IMPLEMENTATIONS_API: flag("REACT_APP_ENABLE_IMPLEMENTATIONS_API", true),
  ENABLE_SUBSCRIPTIONS_API: flag("REACT_APP_ENABLE_SUBSCRIPTIONS_API", true),
  ENABLE_BILLING_API: flag("REACT_APP_ENABLE_BILLING_API", true),
  ENABLE_ANALYTICS_API: flag("REACT_APP_ENABLE_ANALYTICS_API", true),
  // Módulos con backend disponible → activados para producción.
  ENABLE_INVENTORY_API: flag("REACT_APP_ENABLE_INVENTORY_API", true),
  ENABLE_VERTICALS_API: flag("REACT_APP_ENABLE_VERTICALS_API", true),
  ENABLE_USERS_API: flag("REACT_APP_ENABLE_USERS_API", true),
  ENABLE_ROLES_API: flag("REACT_APP_ENABLE_ROLES_API", true),
  ENABLE_PERMISSIONS_API: flag("REACT_APP_ENABLE_PERMISSIONS_API", true),
  ENABLE_PLANS_API: flag("REACT_APP_ENABLE_PLANS_API", true),
  ENABLE_REFERRALS_API: flag("REACT_APP_ENABLE_REFERRALS_API", true),
  ENABLE_SUBSCRIPTION_CENTER_API: flag("REACT_APP_ENABLE_SUBSCRIPTION_CENTER_API", true),
  ENABLE_NOTIFICATIONS_API: flag("REACT_APP_ENABLE_NOTIFICATIONS_API", true),
  ENABLE_COMMERCIAL_AI_API: flag("REACT_APP_ENABLE_COMMERCIAL_AI_API", true),
};

/**
 * ¿Debe un dominio usar el backend real?
 * Solo si su flag está activo Y no estamos en modo mock maestro.
 * (No es un hook de React; nombre sin prefijo "use" a propósito.)
 */
export function isApiEnabled(flagName) {
  return Boolean(features[flagName]) && !features.ENABLE_MOCKS;
}

export default features;
