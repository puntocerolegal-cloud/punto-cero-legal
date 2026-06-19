// Normaliza identificadores de vertical del backend a su nombre de UI.

const VERTICAL = {
  medicina: "Medicina", medicine: "Medicina", health: "Medicina",
  odontologia: "Odontología", "odontología": "Odontología", dental: "Odontología",
  juridico: "Jurídico", "jurídico": "Jurídico", legal: "Jurídico", law: "Jurídico",
};

export function mapVertical(vertical, fallback = "—") {
  if (!vertical) return fallback;
  return VERTICAL[String(vertical).toLowerCase()] || vertical;
}

export default mapVertical;
