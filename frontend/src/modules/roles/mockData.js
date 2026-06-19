// Datos de demostración del módulo Roles — Punto Cero System OS.
// SOLO UI: sin backend. Sustituible por endpoints reales con ENABLE_ROLES_API.

// Roles base de la plataforma. status: ACTIVO | INACTIVO. custom: rol personalizado.
export const ROLES = [
  { _id: "rol-super", key: "SUPER_ADMIN", name: "Super Admin", description: "Control total de Punto Cero Platform.", users: 1, verticals: ["Global"], status: "ACTIVO", custom: false },
  { _id: "rol-admgen", key: "ADMIN_GENERAL", name: "Admin General", description: "Administración global del System OS.", users: 2, verticals: ["Global"], status: "ACTIVO", custom: false },
  { _id: "rol-socio", key: "SOCIO_COMERCIAL", name: "Socio Comercial", description: "Gestión comercial y captación de verticales.", users: 1, verticals: ["Global"], status: "ACTIVO", custom: false },
  { _id: "rol-admorg", key: "ADMIN_ORGANIZACION", name: "Admin Organización", description: "Administra una organización (tenant).", users: 2, verticals: ["Jurídico", "Medicina"], status: "ACTIVO", custom: false },
  { _id: "rol-gerente", key: "GERENTE", name: "Gerente", description: "Gestión operativa de la organización.", users: 2, verticals: ["Medicina", "Odontología"], status: "ACTIVO", custom: false },
  { _id: "rol-abogado", key: "ABOGADO", name: "Abogado", description: "Operación de la vertical jurídica.", users: 3, verticals: ["Jurídico"], status: "ACTIVO", custom: false },
  { _id: "rol-asistente", key: "ASISTENTE", name: "Asistente", description: "Apoyo operativo y administrativo.", users: 3, verticals: ["Jurídico", "Medicina", "Odontología"], status: "ACTIVO", custom: false },
  { _id: "rol-cliente", key: "CLIENTE", name: "Cliente", description: "Acceso al portal de cliente.", users: 1, verticals: ["Jurídico"], status: "ACTIVO", custom: false },
];

// Orden y etiquetas reutilizables por el módulo de Permisos (matriz Módulo × Rol).
export const ROLE_KEYS = ROLES.map((r) => r.key);
export const ROLE_LABELS = ROLES.reduce((acc, r) => ({ ...acc, [r.key]: r.name }), {});

export const KPIS = {
  activeRoles: 8,
  customRoles: 0,
  totalRoles: 8,
  avgUsersPerRole: 1.9,
};

export const OPERATIONS = {
  activeRoles: 8,
  customRoles: 0,
  inactiveRoles: 0,
  rolesWithoutUsers: 0,
};

export const USERS_BY_ROLE = ROLES.map((r) => ({ label: r.name, value: r.users }));

export const ROLE_STATUS_DISTRIBUTION = [
  { label: "Activos", value: 8, color: "#10b981" },
  { label: "Inactivos", value: 0, color: "#64748b" },
];
