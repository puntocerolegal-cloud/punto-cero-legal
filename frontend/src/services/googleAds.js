/**
 * Servicio centralizado de Google Ads para Punto Cero Legal.
 * 
 * Arquitectura:
 * - La etiqueta gtag.js se carga UNA SOLA VEZ en public/index.html
 * - Este servicio solo DISPARA eventos (no carga scripts)
 * - Todos los componentes deben usar este servicio (nunca gtag() directamente)
 * 
 * Google Ads ID: AW-18112841171
 * 
 * Eventos preparados para conversiones:
 * - page_view: Cada cambio de ruta en la SPA
 * - landing_visit: Visita a landing page
 * - begin_registration: Inicio de formulario de registro
 * - generate_lead: Formulario enviado
 * - whatsapp_contact: Contacto por WhatsApp
 * - lawyer_registration: Registro de abogado
 * - firm_registration: Registro de firma
 * - begin_checkout: Inicio de checkout
 * - purchase: Compra completada
 * - appointment_booking: Reserva de cita
 * - darwin_ai_used: Uso de Darwin IA
 * - qualified_lead: Contacto exitoso
 */

// ID de Google Ads - se usa en todo el servicio
export const GOOGLE_ADS_ID = "AW-18112841171";

/**
 * Verifica si gtag está disponible
 */
function isGtagAvailable() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

/**
 * Dispara un evento genérico de gtag de forma segura.
 * No rompe la app si gtag no está disponible.
 * 
 * @param {string} name - Nombre del evento
 * @param {object} params - Parámetros del evento
 */
export function trackEvent(name, params = {}) {
  try {
    if (isGtagAvailable()) {
      window.gtag("event", name, params);
    }
  } catch (e) {
    // Nunca romper la UX por fallos de analytics
    console.warn("[GoogleAds] Error al disparar evento:", e);
  }
}

/**
 * Registra una conversión de Google Ads.
 * 
 * @param {string} label - Label de la conversión (formato: XXXXXXXXXX)
 * @param {object} params - Parámetros adicionales (value, currency, transaction_id, etc.)
 * 
 * @example
 * trackConversion("ABC123", { value: 100, currency: "USD" })
 */
export function trackConversion(label, params = {}) {
  if (!label) return;
  
  trackEvent("conversion", {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    ...params,
  });
}

/**
 * Dispara evento page_view para Google Ads.
 * Se llama automáticamente en cada cambio de ruta de la SPA.
 * 
 * @param {string} pagePath - Ruta actual (ej: "/dashboard/home")
 * @param {string} pageTitle - Título de la página
 */
export function trackPageView(pagePath, pageTitle = "") {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENTOS EMPRESARIALES - PUNTO CERO LEGAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Visita a landing page
 */
export function trackLandingVisit(params = {}) {
  trackEvent("landing_visit", {
    page_path: params.pagePath || "/",
    page_title: params.pageTitle || "Landing Page",
    ...params,
  });
}

/**
 * Inicio de formulario de registro
 */
export function trackBeginRegistration(params = {}) {
  trackEvent("begin_registration", {
    registration_type: params.registrationType || "unknown",
    ...params,
  });
}

/**
 * Formulario enviado (lead generado)
 */
export function trackGenerateLead(params = {}) {
  trackEvent("generate_lead", {
    lead_type: params.leadType || "unknown",
    form_name: params.formName || "unknown",
    ...params,
  });
}

/**
 * Contacto por WhatsApp
 */
export function trackWhatsAppContact(params = {}) {
  trackEvent("whatsapp_contact", {
    contact_source: params.contactSource || "unknown",
    ...params,
  });
}

/**
 * Registro de abogado completado
 */
export function trackLawyerRegistration(params = {}) {
  trackEvent("lawyer_registration", {
    lawyer_id: params.lawyerId || "unknown",
    ...params,
  });
}

/**
 * Registro de firma completado
 */
export function trackFirmRegistration(params = {}) {
  trackEvent("firm_registration", {
    firm_id: params.firmId || "unknown",
    ...params,
  });
}

/**
 * Inicio de checkout
 */
export function trackBeginCheckout(params = {}) {
  trackEvent("begin_checkout", {
    plan_id: params.planId || "unknown",
    plan_name: params.planName || "unknown",
    value: params.value || 0,
    currency: params.currency || "USD",
    ...params,
  });
}

/**
 * Compra completada (purchase)
 */
export function trackPurchase(params = {}) {
  trackEvent("purchase", {
    transaction_id: params.transactionId || "unknown",
    value: params.value || 0,
    currency: params.currency || "USD",
    plan_id: params.planId || "unknown",
    plan_name: params.planName || "unknown",
    ...params,
  });
}

/**
 * Reserva de cita
 */
export function trackAppointmentBooking(params = {}) {
  trackEvent("appointment_booking", {
    appointment_type: params.appointmentType || "unknown",
    lawyer_id: params.lawyerId || "unknown",
    ...params,
  });
}

/**
 * Uso de Darwin IA
 */
export function trackDarwinAIUsed(params = {}) {
  trackEvent("darwin_ai_used", {
    ai_feature: params.aiFeature || "unknown",
    ...params,
  });
}

/**
 * Contacto exitoso (lead calificado)
 */
export function trackQualifiedLead(params = {}) {
  trackEvent("qualified_lead", {
    lead_source: params.leadSource || "unknown",
    lead_value: params.leadValue || 0,
    ...params,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSIONES LISTAS PARA USAR
// ═══════════════════════════════════════════════════════════════════════════
// Cuando se creen las acciones de conversión en Google Ads, usar así:
//
// trackConversion("ABC123XYZ", { value: 100, currency: "USD" })
//
// La label se obtiene del panel de Google Ads al crear la acción de conversión.