// Contrato de Factura — Punto Cero OS.
export const BILLING_CONTRACT = {
  _id: "string",
  invoice: "string (número de factura)",
  client: "string",
  vertical: "Medicina | Odontología | Jurídico",
  source: "Suscripción | Implementación | Organización",
  issued: "ISO date string",
  due: "ISO date string",
  amount: "number (COP)",
  status: "paid | pending | overdue | review",
};

export default BILLING_CONTRACT;
