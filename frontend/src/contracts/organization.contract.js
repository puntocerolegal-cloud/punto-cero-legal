// Contrato de Organización — Punto Cero OS.
// Documenta el shape esperado del backend (fuente de verdad para normalizers/validators).
export const ORGANIZATION_CONTRACT = {
  _id: "string",
  name: "string",
  vertical: "Medicina | Odontología | Jurídico",
  plan: "Essential | Professional | Enterprise",
  users: "number",
  usage: "number (0-100)",
  status: "active | trial | at_risk | suspended",
  joined: "ISO date string",
  mrr: "number (COP)",
  health: { adoption: "number", activity: "number", tickets: "number", billing: "string", risk: "string" },
  tenant: { storageUsedGb: "number", storageTotalGb: "number", activeUsers: "number", documents: "number", monthlyConsumption: "number" },
};

export default ORGANIZATION_CONTRACT;
