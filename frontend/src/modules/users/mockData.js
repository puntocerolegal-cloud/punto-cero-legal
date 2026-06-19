// Módulo Usuarios (administración global) — Punto Cero System OS.
// Datos NEUTRALIZADOS: la fuente real es el backend (users.service vía API).
// Estructura preservada; sin usuarios/organizaciones ficticios ni planes legacy.

export const USERS = [];

export const KPIS = {
  totalUsers: 0,
  activeUsers: 0,
  suspendedUsers: 0,
  newUsers: 0,
  monthlyGrowth: 0,
};

export const OPERATIONS = {
  newUsers: 0,
  pendingActivation: 0,
  suspended: 0,
  inactive: 0,
};

export const USERS_BY_ROLE = [];
export const USERS_BY_VERTICAL = [];
export const USERS_BY_STATUS = [];
export const MONTHLY_GROWTH = [];
