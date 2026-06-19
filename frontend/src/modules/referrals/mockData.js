// Datos de demostración del Motor de Referidos — Punto Cero System OS.
// SOLO UI: sin backend. Sustituible con ENABLE_REFERRALS_API.

export const MY_REFERRAL = { userId: "user-1234", code: "PC-1234" };

// Estados de referido: registrado | click | convertido | recompensado | expirado
export const REFERRALS = [
  { _id: "ref-1", referido: "Bufete Mora & Asoc.", email: "contacto@mora.co", status: "recompensado", plan: "El Salto Estratégico", registeredAt: "2026-05-20", purchasedAt: "2026-05-28", rewardMonths: 1 },
  { _id: "ref-2", referido: "Clínica Dental Norte", email: "info@dentalnorte.co", status: "convertido", plan: "El Despegue", registeredAt: "2026-06-01", purchasedAt: "2026-06-09", rewardMonths: 1 },
  { _id: "ref-3", referido: "Abogados Ríos", email: "rios@legal.co", status: "registrado", plan: null, registeredAt: "2026-06-08", purchasedAt: null, rewardMonths: 0 },
  { _id: "ref-4", referido: "Consultorio Salud Vida", email: "hola@saludvida.co", status: "click", plan: null, registeredAt: "2026-06-10", purchasedAt: null, rewardMonths: 0 },
  { _id: "ref-5", referido: "Estudio Jurídico Paz", email: "paz@estudio.co", status: "registrado", plan: null, registeredAt: "2026-06-11", purchasedAt: null, rewardMonths: 0 },
  { _id: "ref-6", referido: "Odonto Sonrisa", email: "citas@sonrisa.co", status: "expirado", plan: null, registeredAt: "2026-04-01", purchasedAt: null, rewardMonths: 0 },
];

export const KPIS = {
  registered: 6,
  converted: 2,
  monthsEarned: 2,
  clicks: 41,
};

export const OPERATIONS = {
  registered: 6,
  converted: 2,
  pending: 2,
  monthsEarned: 2,
};

// Timeline de actividad (eventos del motor de referidos).
export const TIMELINE = [
  { id: "t1", event: "recompensa", label: "Recompensa otorgada · Bufete Mora (+1 mes)", date: "2026-05-28" },
  { id: "t2", event: "compra", label: "Compra · Bufete Mora adquirió El Salto Estratégico", date: "2026-05-28" },
  { id: "t3", event: "conversion", label: "Conversión · Clínica Dental Norte", date: "2026-06-09" },
  { id: "t4", event: "registro", label: "Registro · Estudio Jurídico Paz", date: "2026-06-11" },
  { id: "t5", event: "click", label: "Click · Consultorio Salud Vida", date: "2026-06-10" },
  { id: "t6", event: "compartido", label: "Enlace compartido por WhatsApp", date: "2026-06-08" },
];

export const REFERRALS_BY_STATUS = [
  { label: "Registrados", value: 2, color: "#3b82f6" },
  { label: "Click", value: 1, color: "#8b5cf6" },
  { label: "Convertidos", value: 2, color: "#10b981" },
  { label: "Expirados", value: 1, color: "#ef4444" },
];
