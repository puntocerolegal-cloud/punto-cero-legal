// Sistema de roles y permisos — Punto Cero OS.
// Define los roles del OS, los módulos protegidos y la matriz de permisos.

export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CLIENT: "CLIENT",
};

export const MODULES = {
  organizations: "organizations",
  partners: "partners",
  implementations: "implementations",
  subscriptions: "subscriptions",
  billing: "billing",
  analytics: "analytics",
  inventory: "inventory",
};

export const ACTIONS = { view: "view", edit: "edit", delete: "delete", export: "export" };

const ALL = [ACTIONS.view, ACTIONS.edit, ACTIONS.delete, ACTIONS.export];
const VIEW_EDIT_EXPORT = [ACTIONS.view, ACTIONS.edit, ACTIONS.export];
const VIEW_ONLY = [ACTIONS.view];

const everyModule = (perms) =>
  Object.values(MODULES).reduce((acc, m) => ({ ...acc, [m]: perms }), {});

// Matriz: rol → módulo → acciones permitidas.
export const ROLE_PERMISSIONS = {
  // Acceso total a la plataforma (cross-tenant).
  [ROLES.SUPER_ADMIN]: everyModule(ALL),
  // Dueño del tenant: todo dentro de su organización.
  [ROLES.OWNER]: everyModule(ALL),
  // Administrador: todo salvo borrado en módulos sensibles.
  [ROLES.ADMIN]: {
    ...everyModule(VIEW_EDIT_EXPORT),
    organizations: VIEW_EDIT_EXPORT,
    partners: ALL,
    implementations: ALL,
    subscriptions: VIEW_EDIT_EXPORT,
    billing: VIEW_EDIT_EXPORT,
    analytics: [ACTIONS.view, ACTIONS.export],
    inventory: ALL,
  },
  // Gestión operativa: ver / editar / exportar.
  [ROLES.MANAGER]: everyModule(VIEW_EDIT_EXPORT),
  // Operativo: solo lectura.
  [ROLES.STAFF]: everyModule(VIEW_ONLY),
  // Cliente: lectura limitada a lo suyo.
  [ROLES.CLIENT]: {
    organizations: [],
    partners: [],
    implementations: VIEW_ONLY,
    subscriptions: VIEW_ONLY,
    billing: VIEW_ONLY,
    analytics: [],
    inventory: [],
  },
};

// Mapea roles del backend jurídico actual a roles del OS (para mostrar/derivar).
export const APP_ROLE_TO_OS_ROLE = {
  admin: ROLES.SUPER_ADMIN,
  admin_general: ROLES.OWNER,
  socio_comercial: ROLES.MANAGER,
  lawyer: ROLES.STAFF,
  client: ROLES.CLIENT,
};

export function toOsRole(appRole) {
  return APP_ROLE_TO_OS_ROLE[appRole] || ROLES.STAFF;
}

export default ROLES;
