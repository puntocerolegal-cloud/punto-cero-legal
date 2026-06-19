// Datos de demostración del módulo Usuarios (administración global) — Punto Cero System OS.
// SOLO UI: sin backend. Sustituible por endpoints reales con ENABLE_USERS_API.

// Estados: ACTIVO | INACTIVO | SUSPENDIDO | PENDIENTE
export const USERS = [
  { _id: "usr-01", name: "Dr. Andrade", email: "andrade@bufete.co", role: "ABOGADO", organization: "Bufete Andrade & Asoc.", vertical: "Jurídico", plan: "Professional", status: "ACTIVO", createdAt: "2026-01-10", lastAccess: "2026-06-12" },
  { _id: "usr-02", name: "Laura Quintero", email: "quintero@cmvida.co", role: "ADMIN_ORGANIZACION", organization: "Centro Médico Vida", vertical: "Medicina", plan: "Professional", status: "ACTIVO", createdAt: "2026-01-12", lastAccess: "2026-06-11" },
  { _id: "usr-03", name: "Carlos Salas", email: "salas@cmvida.co", role: "GERENTE", organization: "Centro Médico Vida", vertical: "Medicina", plan: "Professional", status: "ACTIVO", createdAt: "2026-02-03", lastAccess: "2026-06-10" },
  { _id: "usr-04", name: "Sonia Reyes", email: "reyes@sonrie.co", role: "ASISTENTE", organization: "Clínica Dental Sonríe", vertical: "Odontología", plan: "Essential", status: "PENDIENTE", createdAt: "2026-06-02", lastAccess: "—" },
  { _id: "usr-05", name: "Legal Partners SAS", email: "admin@legalpartners.co", role: "ADMIN_ORGANIZACION", organization: "Legal Partners SAS", vertical: "Jurídico", plan: "Enterprise", status: "ACTIVO", createdAt: "2025-09-30", lastAccess: "2026-06-12" },
  { _id: "usr-06", name: "María Gómez", email: "mgomez@legalpartners.co", role: "ABOGADO", organization: "Legal Partners SAS", vertical: "Jurídico", plan: "Enterprise", status: "ACTIVO", createdAt: "2025-10-15", lastAccess: "2026-06-09" },
  { _id: "usr-07", name: "Pedro Ruiz", email: "pruiz@dentalcare.co", role: "GERENTE", organization: "Dental Care Pro", vertical: "Odontología", plan: "Essential", status: "SUSPENDIDO", createdAt: "2025-08-08", lastAccess: "2026-03-01" },
  { _id: "usr-08", name: "Ana Torres", email: "atorres@odontosalud.co", role: "ASISTENTE", organization: "OdontoSalud Integral", vertical: "Odontología", plan: "Professional", status: "ACTIVO", createdAt: "2026-02-18", lastAccess: "2026-06-08" },
  { _id: "usr-09", name: "Cliente Demo", email: "cliente@bufete.co", role: "CLIENTE", organization: "Bufete Andrade & Asoc.", vertical: "Jurídico", plan: "Professional", status: "INACTIVO", createdAt: "2026-05-21", lastAccess: "2026-05-30" },
  { _id: "usr-10", name: "Socio Comercial", email: "socio@puntocero.co", role: "SOCIO_COMERCIAL", organization: "Punto Cero Platform", vertical: "Global", plan: "—", status: "ACTIVO", createdAt: "2025-09-01", lastAccess: "2026-06-12" },
  { _id: "usr-11", name: "Admin General", email: "admin@puntocero.co", role: "ADMIN_GENERAL", organization: "Punto Cero Platform", vertical: "Global", plan: "—", status: "ACTIVO", createdAt: "2025-08-01", lastAccess: "2026-06-13" },
  { _id: "usr-12", name: "Recepción Vida", email: "recepcion@cmvida.co", role: "ASISTENTE", organization: "Centro Médico Vida", vertical: "Medicina", plan: "Professional", status: "PENDIENTE", createdAt: "2026-06-05", lastAccess: "—" },
];

export const KPIS = {
  totalUsers: 12,
  activeUsers: 8,
  suspendedUsers: 1,
  newUsers: 3,
  monthlyGrowth: 9.6,
};

export const OPERATIONS = {
  newUsers: 3,
  pendingActivation: 2,
  suspended: 1,
  inactive: 1,
};

export const USERS_BY_ROLE = [
  { label: "Abogado", value: 3 },
  { label: "Asistente", value: 3 },
  { label: "Admin Org.", value: 2 },
  { label: "Gerente", value: 2 },
  { label: "Cliente", value: 1 },
  { label: "Socio", value: 1 },
];

export const USERS_BY_VERTICAL = [
  { label: "Jurídico", value: 4 },
  { label: "Medicina", value: 3 },
  { label: "Odontología", value: 3 },
  { label: "Global", value: 2 },
];

export const USERS_BY_STATUS = [
  { label: "Activo", value: 8, color: "#10b981" },
  { label: "Pendiente", value: 2, color: "#f59e0b" },
  { label: "Suspendido", value: 1, color: "#ef4444" },
  { label: "Inactivo", value: 1, color: "#64748b" },
];

export const MONTHLY_GROWTH = [
  { label: "Ene", value: 6 },
  { label: "Feb", value: 8 },
  { label: "Mar", value: 9 },
  { label: "Abr", value: 10 },
  { label: "May", value: 11 },
  { label: "Jun", value: 12 },
];
