// Motor de Notificaciones Inteligentes (puro) — Punto Cero Platform.
// Genera mensajes del ciclo comercial. Canales preparados: plataforma, email,
// WhatsApp (futuro). Sin envío real: solo construye los eventos.

export const NOTIFICATION_TYPES = {
  WELCOME: "welcome",
  DEMO_START: "demo_start",
  TRIAL_START: "trial_start",
  EXPIRY_SOON: "expiry_soon",
  TRIAL_EXPIRY_SOON: "trial_expiry_soon",
  PLAN_EXPIRED: "plan_expired",
  REFERRAL_REGISTERED: "referral_registered",
  REFERRAL_CONVERTED: "referral_converted",
  REWARD_GRANTED: "reward_granted",
  RENEWAL_DONE: "renewal_done",
};

export const CHANNELS = ["platform", "email", "whatsapp"];

const TEMPLATES = {
  welcome: { title: "¡Bienvenido a Punto Cero!", body: (p) => `Hola ${p.name || ""}, tu espacio está listo. Explora la plataforma y crece con nosotros.` },
  demo_start: { title: "Modo Demo activado", body: () => "Estás explorando en modo Demo (sin tarjeta ni contrato). Tienes límites de muestra; cuando quieras, activa tu Trial o un plan." },
  trial_start: { title: "Trial iniciado · 3 días", body: () => "Tu Trial de 3 días comenzó con datos reales. Aprovéchalo al máximo." },
  expiry_soon: { title: "Tu plan vence pronto", body: (p) => `Tu plan vence en ${p.days ?? "pocos"} día(s). Renueva cuando quieras para no perder acceso.` },
  trial_expiry_soon: { title: "Tu Trial está por terminar", body: (p) => `Quedan ${p.days ?? 1} día(s) de Trial. Activa un plan para conservar tus datos en modo completo.` },
  plan_expired: { title: "Plan vencido", body: () => "Tu cuenta quedó en solo lectura. Renueva o activa un plan para volver a operar." },
  referral_registered: { title: "Nuevo referido registrado", body: (p) => `${p.referido || "Un referido"} se registró con tu código.` },
  referral_converted: { title: "¡Referido convertido!", body: (p) => `${p.referido || "Tu referido"} adquirió ${p.plan || "un plan"}.` },
  reward_granted: { title: "Recompensa otorgada", body: (p) => `Ganaste ${p.months || 1} mes(es) gratis por tu referido. ¡Acumulable!` },
  renewal_done: { title: "Renovación realizada", body: (p) => `Tu plan ${p.plan || ""} fue renovado. ¡Gracias por seguir con nosotros!` },
};

/**
 * Construye una notificación. createdAt debe inyectarse desde fuera (no se usa
 * Date.now aquí para mantener la función pura y testeable).
 */
export function buildNotification(type, payload = {}, { channel = "platform", createdAt = null } = {}) {
  const tpl = TEMPLATES[type];
  if (!tpl) return null;
  return {
    type,
    channel,
    title: tpl.title,
    message: typeof tpl.body === "function" ? tpl.body(payload) : tpl.body,
    createdAt,
    read: false,
  };
}

export function notificationTitle(type) {
  return TEMPLATES[type]?.title || type;
}
