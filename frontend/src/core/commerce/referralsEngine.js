// Motor de Referidos (puro) — Punto Cero Platform.
// Código/link/QR únicos, objetivos de compartición y cálculo de recompensa.

const PUBLIC_BASE = "https://app.puntocero.legal";

/** Código único determinístico a partir del id de usuario (sin aleatoriedad). */
export function generateCode(userId = "user") {
  const base = String(userId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-4).padStart(4, "X");
  return `PC-${base}`;
}

export function buildLink(code) {
  return `${PUBLIC_BASE}/r/${code}`;
}

/** URL de imagen QR (servicio público; sin clave). Reemplazable por librería local. */
export function buildQrUrl(link, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(link)}`;
}

/** URLs de compartición por canal. */
export function shareTargets(link, text = "Te invito a Punto Cero") {
  const u = encodeURIComponent(link);
  const t = encodeURIComponent(text);
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    email: `mailto:?subject=${t}&body=${t}%20${u}`,
  };
}

// Ventana de conversión que otorga recompensa.
export const REWARD_WINDOW_DAYS = 15;
export const REWARD_MONTHS = 1;

/**
 * ¿El referido genera recompensa? Compra dentro de los primeros 15 días desde
 * el registro. registeredMs / purchasedMs en epoch ms.
 */
export function computeReward({ registeredMs, purchasedMs }) {
  if (!registeredMs || !purchasedMs) return { eligible: false, months: 0 };
  const days = (purchasedMs - registeredMs) / (24 * 60 * 60 * 1000);
  const eligible = days >= 0 && days <= REWARD_WINDOW_DAYS;
  return { eligible, months: eligible ? REWARD_MONTHS : 0 };
}

// Eventos del timeline de referidos.
export const REFERRAL_EVENTS = ["registro", "compartido", "click", "conversion", "compra", "recompensa", "activacion", "expiracion"];
