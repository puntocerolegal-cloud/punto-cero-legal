import React, { useEffect } from "react";
import { Lock } from "lucide-react";
import { useEntitlement } from "@/hooks/useEntitlement";

/**
 * Compuerta de acceso por plan. Envuelve una feature de cualquier vertical y
 * consulta el Motor de Entitlements (useEntitlement) antes de renderizarla.
 *
 *  - Si la feature está permitida → renderiza children (transparente).
 *  - Si está bloqueada → muestra placeholder y dispara automáticamente el
 *    UpgradeModal (vía requireAccess → SubscriptionContext.openUpgrade).
 *
 * Por defecto (estado ACTIVO + plan superior) SIEMPRE pasa, por lo que las
 * verticales existentes no cambian de comportamiento.
 */
export function FeatureGate({ feature, children, title }) {
  const { canAccess, requireAccess } = useEntitlement();
  const allowed = canAccess(feature);

  useEffect(() => {
    if (!allowed) requireAccess(feature); // dispara el UpgradeModal con el motivo correcto
  }, [allowed, feature, requireAccess]);

  if (allowed) return children;

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-[#f97316]" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">{title || "Función no disponible en tu plan"}</h3>
        <p className="mt-1 text-sm text-white/50">Esta sección requiere un plan superior o activar tu Trial.</p>
        <button onClick={() => requireAccess(feature)}
          className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold">
          Desbloquear
        </button>
      </div>
    </div>
  );
}

export default FeatureGate;
