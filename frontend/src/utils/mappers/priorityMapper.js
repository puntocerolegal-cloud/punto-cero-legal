// Mapea prioridades del backend al nivel de PriorityBadge (urgente/alta/media/baja).

const PRIORITY = {
  urgent: "urgente", urgente: "urgente", critical: "urgente", critico: "urgente",
  high: "alta", alta: "alta",
  medium: "media", media: "media", normal: "media",
  low: "baja", baja: "baja",
};

export function mapPriorityLevel(priority, fallback = "media") {
  if (!priority) return fallback;
  return PRIORITY[String(priority).toLowerCase()] || fallback;
}

export default mapPriorityLevel;
