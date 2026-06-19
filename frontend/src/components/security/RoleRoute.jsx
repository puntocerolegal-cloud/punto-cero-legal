import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toOsRole } from "@/security/roles";
import { canView } from "@/security/accessControl";
import { EmptyState } from "@/shared/components";
import { ShieldAlert } from "lucide-react";

/**
 * RoleRoute (OS) — exige que el rol del usuario pueda ver el `module`.
 * Mapea el rol del backend actual al rol del OS y consulta accessControl.
 */
export function RoleRoute({ children, module, fallback }) {
  const { user } = useAuth();
  const osRole = toOsRole(user?.role);

  if (module && !canView(osRole, module)) {
    return (
      fallback || (
        <EmptyState
          icon={ShieldAlert}
          title="Acceso restringido"
          description="Tu rol no tiene permisos para ver esta sección."
        />
      )
    );
  }
  return children;
}

export default RoleRoute;
