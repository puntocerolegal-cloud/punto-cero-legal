// Mapea estados del backend al tono de StatusBadge (Normal/Atención/Riesgo/Crítico).
// Centraliza la traducción backend → UI para todos los módulos del OS.

const STATUS_TO_TONE = {
  // genéricos
  active: "normal", activa: "normal", ok: "normal", healthy: "normal", paid: "normal", pagada: "normal", pagado: "normal",
  trial: "atencion", pending: "atencion", pendiente: "atencion", review: "pending", revision: "pending",
  past_due: "riesgo", overdue: "riesgo", vencida: "critico", vencido: "critico", at_risk: "riesgo", riesgo: "riesgo",
  suspended: "critico", cancelled: "critico", canceled: "critico", blocked: "critico", critico: "critico",
  inactive: "inactive", inactivo: "inactive",
  // semáforos directos
  normal: "normal", atencion: "atencion", critical: "critico",
};

export function mapStatusTone(status, fallback = "normal") {
  if (!status) return fallback;
  return STATUS_TO_TONE[String(status).toLowerCase()] || fallback;
}

export default mapStatusTone;
