// Datos de demostración del Motor Multivertical — Punto Cero System OS.
// SOLO UI: sin backend. Punto Cero Legal es la única vertical productiva; el
// resto queda PREPARADA dentro del motor (no desarrollada). Datos sustituibles
// por endpoints reales cuando ENABLE_VERTICALS_API esté activo.

// Estados soportados: ACTIVA | DESARROLLO | PLANEACION | PAUSADA | DESHABILITADA
// (el icono se resuelve en la UI por `slug`, no se serializa aquí).
export const VERTICALS = [
  {
    _id: "vert-legal",
    slug: "legal",
    name: "Punto Cero Legal",
    description: "Vertical jurídica · CRM, casos, agenda, facturación y portal de clientes.",
    status: "ACTIVA",
    orgs: 7,
    users: 96,
    activePlans: 6,
    mrr: 1795000, // COP
    growth: 12.4, // % MoM
    launched: "2025-09-01",
  },
  {
    _id: "vert-medicina",
    slug: "medicina",
    name: "Medicina",
    description: "Gestión clínica, historia médica y agenda asistencial. Preparada, sin desarrollar.",
    status: "DESARROLLO",
    orgs: 0,
    users: 0,
    activePlans: 0,
    mrr: 0,
    growth: 0,
    launched: null,
  },
  {
    _id: "vert-odontologia",
    slug: "odontologia",
    name: "Odontología",
    description: "Odontograma, tratamientos y citas. Preparada, sin desarrollar.",
    status: "DESARROLLO",
    orgs: 0,
    users: 0,
    activePlans: 0,
    mrr: 0,
    growth: 0,
    launched: null,
  },
  {
    _id: "vert-contabilidad",
    slug: "contabilidad",
    name: "Contabilidad",
    description: "Libros, conciliación y reportes fiscales. En planeación.",
    status: "PLANEACION",
    orgs: 0,
    users: 0,
    activePlans: 0,
    mrr: 0,
    growth: 0,
    launched: null,
  },
];

// ── KPIs ejecutivos (demo; la UI los recalcula desde la lista en vivo) ──
export const KPIS = {
  totalVerticals: 4,
  activeVerticals: 1,
  inDevelopment: 2,
  totalOrgs: 7,
  totalUsers: 96,
  activePlans: 6,
  totalMrr: 1795000,
};

// ── Centro de Operaciones ──
export const OPERATIONS = {
  activas: 1,
  desarrollo: 2,
  planeacion: 1,
  pausadas: 0,
};

// ── Analítica (demo; recalculada en vivo desde la lista) ──
export const REVENUE_BY_VERTICAL = VERTICALS.map((v) => ({
  label: v.name.split(" ").slice(-1)[0],
  value: Math.round(v.mrr / 1000),
}));

export const ORGS_BY_VERTICAL = VERTICALS.map((v) => ({
  label: v.name.split(" ").slice(-1)[0],
  value: v.orgs,
}));

export const GROWTH_BY_VERTICAL = VERTICALS.map((v) => ({
  label: v.name.split(" ").slice(-1)[0],
  value: v.growth,
}));

export const STATUS_DISTRIBUTION = [
  { label: "Activa", value: 1, color: "#10b981" },
  { label: "Desarrollo", value: 2, color: "#f59e0b" },
  { label: "Planeación", value: 1, color: "#64748b" },
  { label: "Pausada", value: 0, color: "#f97316" },
  { label: "Deshabilitada", value: 0, color: "#ef4444" },
];
