// Tenant Guards — Punto Cero OS.
// Validaciones de aislamiento entre organizaciones (tenant isolation).
import { canView } from "./accessControl";

/** Hay un tenant válido si tiene id. */
export function validateTenant(tenant) {
  return Boolean(tenant && tenant.tenantId);
}

/** El recurso pertenece al tenant/organización activos. */
export function validateOrganization(tenant, resource) {
  if (!validateTenant(tenant)) return false;
  if (!resource) return false;
  const orgId = resource.organizationId ?? resource.organization_id ?? resource._id ?? resource.id;
  // Sin organización en el recurso, no se puede afirmar pertenencia.
  if (orgId == null) return false;
  return String(orgId) === String(tenant.organizationId ?? tenant.tenantId);
}

/** ¿El rol puede ver el módulo dentro de un tenant válido? */
export function validateAccess(tenant, role, module) {
  return validateTenant(tenant) && canView(role, module);
}

export default { validateTenant, validateOrganization, validateAccess };
