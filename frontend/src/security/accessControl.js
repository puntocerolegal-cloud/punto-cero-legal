// Control de acceso por rol y módulo — Punto Cero OS.
import { ROLE_PERMISSIONS, ACTIONS } from "./roles";

export function hasPermission(role, module, action) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  const modulePerms = perms[module];
  if (!modulePerms) return false;
  return modulePerms.includes(action);
}

export const canView = (role, module) => hasPermission(role, module, ACTIONS.view);
export const canEdit = (role, module) => hasPermission(role, module, ACTIONS.edit);
export const canDelete = (role, module) => hasPermission(role, module, ACTIONS.delete);
export const canExport = (role, module) => hasPermission(role, module, ACTIONS.export);

export default { hasPermission, canView, canEdit, canDelete, canExport };
