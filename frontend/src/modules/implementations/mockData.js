// Datos de demostración del módulo Implementaciones — Punto Cero OS.
// SOLO UI: sin backend. Datos realistas, sustituibles por endpoints reales.

// ── Etapas del pipeline de implementación ──
// stage: vendido | kickoff | configuracion | capacitacion | pruebas | golive | operacion
export const STAGES = [
  { key: "vendido", label: "Vendido", accent: "#3b82f6" },
  { key: "kickoff", label: "Kickoff", accent: "#6366f1" },
  { key: "configuracion", label: "Configuración", accent: "#8b5cf6" },
  { key: "capacitacion", label: "Capacitación", accent: "#f59e0b" },
  { key: "pruebas", label: "Pruebas", accent: "#f97316" },
  { key: "golive", label: "Go Live", accent: "#ec4899" },
  { key: "operacion", label: "Operación", accent: "#10b981" },
];

// ── Checklists por vertical ──
export const CHECKLISTS = {
  Medicina: ["Configuración clínica", "Usuarios", "Agenda", "Historias clínicas", "Facturación"],
  Odontología: ["Especialidades", "Agenda", "Pacientes", "Tratamientos", "Facturación"],
  Jurídico: ["Usuarios", "CRM", "Casos", "Documentos", "Portal cliente"],
};

// ── Proyectos en implementación ──
// checklistDone: nº de ítems completados del checklist de su vertical.
export const PROJECTS = [
  { id: "im1", company: "Centro Médico Vida", vertical: "Medicina", owner: "Ana Torres", stage: "configuracion", progress: 45, dueDate: "2026-07-10", priority: "alta", checklistDone: 2, risk: false, blocked: false },
  { id: "im2", company: "Hospital San Rafael", vertical: "Medicina", owner: "Luis Marín", stage: "capacitacion", progress: 68, dueDate: "2026-06-28", priority: "urgente", checklistDone: 3, risk: true, blocked: false },
  { id: "im3", company: "Clínica Dental Sonríe", vertical: "Odontología", owner: "Carla Ruiz", stage: "kickoff", progress: 18, dueDate: "2026-07-22", priority: "media", checklistDone: 1, risk: false, blocked: false },
  { id: "im4", company: "OdontoSalud Integral", vertical: "Odontología", owner: "Carla Ruiz", stage: "pruebas", progress: 82, dueDate: "2026-06-20", priority: "alta", checklistDone: 4, risk: false, blocked: false },
  { id: "im5", company: "Bufete Andrade & Asoc.", vertical: "Jurídico", owner: "Diego Peña", stage: "golive", progress: 94, dueDate: "2026-06-15", priority: "urgente", checklistDone: 5, risk: true, blocked: true },
  { id: "im6", company: "Legal Partners SAS", vertical: "Jurídico", owner: "Diego Peña", stage: "operacion", progress: 100, dueDate: "2026-05-30", priority: "baja", checklistDone: 5, risk: false, blocked: false },
  { id: "im7", company: "MediCare Plus", vertical: "Medicina", owner: "Ana Torres", stage: "vendido", progress: 5, dueDate: "2026-08-01", priority: "media", checklistDone: 0, risk: false, blocked: false },
  { id: "im8", company: "Sonrisa Perfecta", vertical: "Odontología", owner: "Carla Ruiz", stage: "operacion", progress: 100, dueDate: "2026-05-12", priority: "baja", checklistDone: 5, risk: false, blocked: false },
];

// ── KPIs ejecutivos ──
export const KPIS = {
  activeProjects: 6,
  avgImplementationDays: 38,
  productiveClients: 2,
  goLivesDone: 2,
  openRisks: 2,
  satisfaction: 92, // %
};

// ── Centro de Operaciones ──
export const OPERATIONS = {
  sold: 8,
  active: 6,
  goLivePending: 1,
  criticalRisks: 2,
  blockedClients: 1,
  completed: 2,
};

// ── Go Live Center ──
export const GO_LIVES = [
  { id: "g1", company: "Bufete Andrade & Asoc.", owner: "Diego Peña", date: "2026-06-15", status: "riesgo" },
  { id: "g2", company: "OdontoSalud Integral", owner: "Carla Ruiz", date: "2026-06-20", status: "normal" },
  { id: "g3", company: "Hospital San Rafael", owner: "Luis Marín", date: "2026-06-28", status: "atencion" },
];

// ── Series de analítica ──
export const BY_VERTICAL = [
  { label: "Medicina", value: 3 },
  { label: "Odontología", value: 3 },
  { label: "Jurídico", value: 2 },
];

export const AVG_TIME_BY_STAGE = [
  { label: "Kickoff", value: 4 },
  { label: "Config.", value: 9 },
  { label: "Capac.", value: 7 },
  { label: "Pruebas", value: 8 },
  { label: "Go Live", value: 3 },
];

export const GO_LIVE_BY_MONTH = [
  { label: "Feb", value: 1 }, { label: "Mar", value: 2 }, { label: "Abr", value: 1 },
  { label: "May", value: 3 }, { label: "Jun", value: 2 },
];

export const CONVERSION_SOLD_TO_PRODUCTIVE = [
  { label: "Feb", value: 40 }, { label: "Mar", value: 55 }, { label: "Abr", value: 50 },
  { label: "May", value: 67 }, { label: "Jun", value: 72 },
];
