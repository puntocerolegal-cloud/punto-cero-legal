import React from "react";
import { useTenant } from "@/context/TenantContext";
import { validateTenant } from "@/security/tenantGuard";
import { EmptyState } from "@/shared/components";
import { Building2 } from "lucide-react";

/**
 * TenantRoute (OS) — exige un tenant válido activo.
 * Si no hay tenant, muestra un estado vacío en lugar de romper la navegación.
 */
export function TenantRoute({ children, fallback }) {
  const { tenant } = useTenant();
  if (!validateTenant(tenant)) {
    return (
      fallback || (
        <EmptyState
          icon={Building2}
          title="Sin organización activa"
          description="Selecciona una organización para acceder a esta sección."
        />
      )
    );
  }
  return children;
}

export default TenantRoute;
