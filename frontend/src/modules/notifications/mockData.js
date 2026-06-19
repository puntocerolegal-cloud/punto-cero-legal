// Datos de demostración del motor de Notificaciones Inteligentes — Punto Cero System OS.
// Construidas con notificationsEngine (mismos tipos/plantillas del núcleo comercial).
import { buildNotification, NOTIFICATION_TYPES as T } from "@/core/commerce/notificationsEngine";

export const NOTIFICATIONS = [
  { id: "ntf-1", ...buildNotification(T.WELCOME, { name: "Dr. Andrade" }, { channel: "email", createdAt: "2026-06-13 09:01" }) },
  { id: "ntf-2", ...buildNotification(T.TRIAL_START, {}, { channel: "platform", createdAt: "2026-06-12 18:20" }) },
  { id: "ntf-3", ...buildNotification(T.REFERRAL_REGISTERED, { referido: "Estudio Jurídico Paz" }, { channel: "platform", createdAt: "2026-06-11 11:05" }) },
  { id: "ntf-4", ...buildNotification(T.TRIAL_EXPIRY_SOON, { days: 1 }, { channel: "email", createdAt: "2026-06-11 08:00" }) },
  { id: "ntf-5", ...buildNotification(T.REFERRAL_CONVERTED, { referido: "Clínica Dental Norte", plan: "El Despegue" }, { channel: "platform", createdAt: "2026-06-09 16:42" }) },
  { id: "ntf-6", ...buildNotification(T.REWARD_GRANTED, { months: 1 }, { channel: "whatsapp", createdAt: "2026-05-28 10:15" }) },
  { id: "ntf-7", ...buildNotification(T.EXPIRY_SOON, { days: 5 }, { channel: "email", createdAt: "2026-05-27 09:00" }) },
  { id: "ntf-8", ...buildNotification(T.DEMO_START, {}, { channel: "platform", createdAt: "2026-05-20 12:30" }) },
];

export const KPIS = {
  total: NOTIFICATIONS.length,
  platform: NOTIFICATIONS.filter((nt) => nt.channel === "platform").length,
  email: NOTIFICATIONS.filter((nt) => nt.channel === "email").length,
  whatsapp: NOTIFICATIONS.filter((nt) => nt.channel === "whatsapp").length,
};

export const BY_CHANNEL = [
  { label: "Plataforma", value: KPIS.platform, color: "#3b82f6" },
  { label: "Email", value: KPIS.email, color: "#f97316" },
  { label: "WhatsApp", value: KPIS.whatsapp, color: "#10b981" },
];
