// Contrato de Implementación — Punto Cero OS.
export const IMPLEMENTATION_CONTRACT = {
  id: "string",
  company: "string",
  vertical: "Medicina | Odontología | Jurídico",
  owner: "string",
  stage: "vendido | kickoff | configuracion | capacitacion | pruebas | golive | operacion",
  progress: "number (0-100)",
  dueDate: "ISO date string",
  priority: "urgente | alta | media | baja",
  checklistDone: "number",
  risk: "boolean",
  blocked: "boolean",
};

export default IMPLEMENTATION_CONTRACT;
