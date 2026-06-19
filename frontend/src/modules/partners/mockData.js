// Datos de demostración del módulo Socios Comerciales — Punto Cero OS.
// SOLO UI: sin backend. Datos realistas, sustituibles por endpoints reales.

// ── KPIs superiores ──
export const KPIS = {
  leads: 184,
  companies: 47,
  activeVerticals: 3,
  activePartners: 21,
  conversions: 29,
  commissionsGenerated: 18650000, // COP
};

// ── Pipeline / Centro de Oportunidades ──
// stage: lead | contactado | calificado | propuesta | negociacion | convertido
export const OPPORTUNITIES = [
  { id: "o1", company: "Clínica Dental Sonríe", vertical: "Odontología", contact: "Dra. Ramírez", stage: "lead", value: 3200000, priority: "media" },
  { id: "o2", company: "Centro Médico Vida", vertical: "Medicina", contact: "Dr. Salas", stage: "contactado", value: 7800000, priority: "alta" },
  { id: "o3", company: "Bufete Andrade & Asoc.", vertical: "Firmas Jurídicas", contact: "Dr. Andrade", stage: "calificado", value: 5400000, priority: "alta" },
  { id: "o4", company: "OdontoSalud Integral", vertical: "Odontología", contact: "Dr. Peña", stage: "propuesta", value: 4100000, priority: "media" },
  { id: "o5", company: "Hospital San Rafael", vertical: "Medicina", contact: "Adm. Torres", stage: "negociacion", value: 12500000, priority: "urgente" },
  { id: "o6", company: "Legal Partners SAS", vertical: "Firmas Jurídicas", contact: "Dra. Gómez", stage: "negociacion", value: 6900000, priority: "alta" },
  { id: "o7", company: "Sonrisa Perfecta", vertical: "Odontología", contact: "Dr. Mejía", stage: "convertido", value: 2800000, priority: "baja" },
  { id: "o8", company: "MediCare Plus", vertical: "Medicina", contact: "Dra. Quintero", stage: "convertido", value: 9300000, priority: "media" },
  { id: "o9", company: "Jurídica Integral", vertical: "Firmas Jurídicas", contact: "Dr. Vargas", stage: "lead", value: 4600000, priority: "media" },
  { id: "o10", company: "Dental Care Pro", vertical: "Odontología", contact: "Dra. Ríos", stage: "contactado", value: 3500000, priority: "media" },
];

export const PIPELINE_STAGES = [
  { key: "lead", label: "Lead", accent: "#3b82f6" },
  { key: "contactado", label: "Contactado", accent: "#6366f1" },
  { key: "calificado", label: "Calificado", accent: "#8b5cf6" },
  { key: "propuesta", label: "Propuesta", accent: "#f59e0b" },
  { key: "negociacion", label: "Negociación", accent: "#f97316" },
  { key: "convertido", label: "Convertido", accent: "#10b981" },
];

// ── Verticales ──
export const VERTICALS = [
  { key: "medicina", name: "Medicina", interested: 18, openOpps: 7, conversion: 22, projectedRevenue: 64000000, accent: "#10b981" },
  { key: "odontologia", name: "Odontología", interested: 14, openOpps: 5, conversion: 27, projectedRevenue: 38000000, accent: "#3b82f6" },
  { key: "juridicas", name: "Firmas Jurídicas", interested: 23, openOpps: 9, conversion: 31, projectedRevenue: 81000000, accent: "#f97316" },
];

// ── Partners activos ──
export const PARTNERS = [
  { _id: "p1", company: "MediCare Plus", contact: "Dra. Quintero", vertical: "Medicina", status: "active", commission: 2350000, joined: "2026-01-12" },
  { _id: "p2", company: "Sonrisa Perfecta", contact: "Dr. Mejía", vertical: "Odontología", status: "active", commission: 1180000, joined: "2026-02-03" },
  { _id: "p3", company: "Bufete Andrade & Asoc.", contact: "Dr. Andrade", vertical: "Firmas Jurídicas", status: "pending", commission: 0, joined: "2026-05-21" },
  { _id: "p4", company: "Legal Partners SAS", contact: "Dra. Gómez", vertical: "Firmas Jurídicas", status: "active", commission: 3120000, joined: "2025-11-30" },
  { _id: "p5", company: "Centro Médico Vida", contact: "Dr. Salas", vertical: "Medicina", status: "active", commission: 1890000, joined: "2026-03-18" },
  { _id: "p6", company: "Dental Care Pro", contact: "Dra. Ríos", vertical: "Odontología", status: "inactive", commission: 540000, joined: "2025-09-08" },
  { _id: "p7", company: "Jurídica Integral", contact: "Dr. Vargas", vertical: "Firmas Jurídicas", status: "active", commission: 2675000, joined: "2026-04-02" },
];

// ── Comisiones ──
export const COMMISSIONS = {
  month: 4920000,
  accumulated: 18650000,
  projection: 6400000,
  top: [
    { company: "Legal Partners SAS", amount: 3120000 },
    { company: "Jurídica Integral", amount: 2675000 },
    { company: "MediCare Plus", amount: 2350000 },
    { company: "Centro Médico Vida", amount: 1890000 },
  ],
};

// ── Centro de Operaciones (Partners) ──
export const OPERATIONS = {
  newLeads: 12,
  pendingProposals: 4,
  activeNegotiations: 2,
  contractsToSign: 3,
  verticalsInImplementation: 1,
  pendingCommissions: 5,
};
