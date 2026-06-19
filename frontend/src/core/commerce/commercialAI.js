// IA Comercial nativa (mock, basada en reglas) — Punto Cero Platform.
// NO hay vendedores humanos, formularios de venta ni solicitud de llamada.
// Responde dudas de planes/límites/renovaciones/trial/demo/pagos/referidos y
// decide el contenido del modal de conversión.

// Respuestas automáticas a dudas frecuentes (palabras clave → respuesta).
const RULES = [
  { match: ["trial", "prueba"], answer: "El Trial dura 3 días con datos reales (clientes y casos reales). Al finalizar, tu cuenta pasa a modo solo lectura hasta que actives un plan. Puedes activarlo cuando quieras desde el botón “Activar Trial”." },
  { match: ["demo", "explorar", "probar sin"], answer: "El modo Demo te deja explorar la plataforma sin tarjeta, sin pago y sin contrato. Incluye datos simulados y límites (3 clientes, 2 casos, 10 consultas de IA, etc.). Cuando alcances un límite te ofreceré activar un plan o el Trial." },
  { match: ["precio", "cuesta", "plan", "planes", "valor"], answer: "Tenemos 4 planes: El Despegue, El Salto Estratégico, Firma en Crecimiento y Consolidación Empresarial. Puedes verlos y compararlos desde “Ver Planes”. Los precios se muestran en tu moneda local automáticamente." },
  { match: ["límite", "limite", "máximo", "maximo", "tope"], answer: "Cada plan define límites de usuarios, casos, IA, almacenamiento y features (video, facturación, API). Si necesitas más, te muestro el plan que lo desbloquea." },
  { match: ["renov", "renovación", "renovacion"], answer: "Las renovaciones NO son automáticas: tú decides cuándo pagar. Cerca del vencimiento te avisaré para que renueves si quieres continuar." },
  { match: ["pago", "pagar", "tarjeta", "cobro"], answer: "No guardamos tarjetas ni hacemos cobros automáticos. Cuando decidas pagar, podrás hacerlo con Mercado Pago, PayPal o Stripe (integración en preparación)." },
  { match: ["referid", "invita", "recompensa", "premio"], answer: "Por cada referido que compre dentro de sus primeros 15 días, ganas 1 mes gratis (acumulable, mensual o anual). Comparte tu código/enlace/QR desde el módulo de Referidos." },
  { match: ["vencido", "expir", "caduc"], answer: "Si tu plan venció, tu cuenta queda en solo lectura: puedes ver tu información pero no crear ni editar. Renueva o activa un plan para reactivar todas las funciones." },
];

const FALLBACK = "Puedo ayudarte con planes, límites, trial, demo, pagos, renovaciones y referidos. ¿Qué necesitas saber? También puedes “Ver Planes” o “Activar Trial” cuando quieras.";

/** Respuesta automática de la IA comercial a una pregunta libre. */
export function answer(question = "") {
  const q = String(question).toLowerCase();
  const hit = RULES.find((r) => r.match.some((m) => q.includes(m)));
  return hit ? hit.answer : FALLBACK;
}

/** Sugerencias rápidas (chips) que ofrece el asistente. */
export const QUICK_PROMPTS = [
  "¿Qué incluye cada plan?",
  "¿Cómo funciona el Trial?",
  "¿Qué límites tiene el Demo?",
  "¿Cómo gano meses gratis?",
  "¿Cómo pago?",
];

/**
 * Contenido del modal de conversión (Bloqueo Comercial), decidido por la IA
 * según el motivo del bloqueo. Sin contacto humano: solo acciones de autoservicio.
 */
export function buildUpgradeContent({ feature, reason, status } = {}) {
  const base = {
    title: "Desbloquea todas las funcionalidades",
    actions: ["ver-planes", "comparar-planes", "activar-trial", "suscribirme"],
  };
  let message;
  if (reason === "demo-feature") message = "Esta función no está disponible en modo Demo. Actívala con un plan o inicia tu Trial de 3 días.";
  else if (reason === "plan") message = `Tu plan actual no incluye esta función${feature ? ` (${feature})` : ""}. Mejora tu plan para activarla.`;
  else if (reason === "limit") message = "Alcanzaste el límite de tu plan/Demo. Sube de plan o activa el Trial para continuar sin límites.";
  else if (reason === "expired") message = "Tu plan venció y la cuenta está en solo lectura. Renueva o activa un plan para volver a operar.";
  else message = "Mejora tu plan para acceder a más capacidad y funciones avanzadas.";
  return { ...base, message };
}

// Etiquetas legibles de las acciones del modal.
export const UPGRADE_ACTION_LABELS = {
  "ver-planes": "Ver Planes",
  "comparar-planes": "Comparar Planes",
  "activar-trial": "Activar Trial",
  "suscribirme": "Suscribirme Ahora",
};
