// Hook de Entitlements — Punto Cero System Core.
// Abstrae la validación de ACCESO (canAccess) y de LÍMITES (canPerform) sobre el
// Motor de Planes (SubscriptionContext) y el Motor de Conteo (usageTracker).
//
// Las variantes `require*` disparan automáticamente el UpgradeModal cuando el
// usuario no tiene acceso/cupo (vía SubscriptionContext.openUpgrade). Centraliza
// toda la lógica de acceso para que componentes y verticales no la dupliquen.
import { useCallback, useMemo } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getUsage } from "@/core/commerce/usageTracker";
import { FEATURE_USAGE_KEY } from "@/core/commerce/planLimits";

export function useEntitlement() {
  const { can, within, requireFeature, requireWithin, access, openUpgrade } = useSubscription();

  // Acceso a una feature. Sin feature (null/undefined) → permitido (módulos
  // protegidos solo por rol, p. ej. secciones admin del registry).
  const canAccess = useCallback((feature) => {
    if (!feature) return true;
    return can(feature).allowed;
  }, [can]);

  // ¿Puede ejecutar una acción sujeta a límite? Si no se pasa `current`, se lee
  // del Motor de Conteo (usageTracker) según la clave de uso de la feature.
  const canPerform = useCallback((feature, current) => {
    if (!feature) return true;
    const count = current ?? getUsage(FEATURE_USAGE_KEY[feature]);
    return within(feature, count);
  }, [within]);

  // Igual que canAccess, pero abre el UpgradeModal si está bloqueado.
  const requireAccess = useCallback((feature) => {
    if (!feature) return true;
    return requireFeature(feature);
  }, [requireFeature]);

  // Igual que canPerform, pero abre el UpgradeModal si se excede el límite.
  const requirePerform = useCallback((feature, current) => {
    if (!feature) return true;
    const count = current ?? getUsage(FEATURE_USAGE_KEY[feature]);
    return requireWithin(feature, count);
  }, [requireWithin]);

  return useMemo(() => ({
    canAccess, canPerform, requireAccess, requirePerform,
    openUpgrade, access, status: access.status, plan: access.plan,
  }), [canAccess, canPerform, requireAccess, requirePerform, openUpgrade, access]);
}

export default useEntitlement;
