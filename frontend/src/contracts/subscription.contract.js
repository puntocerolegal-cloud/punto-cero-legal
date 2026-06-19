// Contrato de Suscripción — Punto Cero OS.
export const SUBSCRIPTION_CONTRACT = {
  _id: "string",
  company: "string",
  vertical: "Medicina | Odontología | Jurídico",
  plan: "Essential | Professional | Enterprise",
  status: "active | trial | past_due | cancelled",
  renewal: "ISO date string",
  monthly: "number (COP)",
};

export default SUBSCRIPTION_CONTRACT;
