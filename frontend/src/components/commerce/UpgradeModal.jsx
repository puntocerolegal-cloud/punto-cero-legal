import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Check, Rocket } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { PLANS } from "@/modules/plans/mockData";
import { formatMoney } from "@/modules/plans/currency";
import { UPGRADE_ACTION_LABELS } from "@/core/commerce/commercialAI";

const cop = (usd) => formatMoney(usd * 4000, "COP");

/**
 * Modal de Bloqueo Comercial — controlado por la IA Comercial.
 * Acciones de autoservicio únicamente: Ver/Comparar Planes, Activar Trial,
 * Suscribirse. SIN contacto humano, llamadas ni formularios de venta.
 */
export function UpgradeModal() {
  const navigate = useNavigate();
  const { upgrade, closeUpgrade, startTrial } = useSubscription();
  const [compare, setCompare] = useState(false);

  if (!upgrade.open || !upgrade.content) return null;
  const { title, message, actions } = upgrade.content;

  const handle = (action) => {
    if (action === "ver-planes" || action === "comparar-planes") { setCompare(true); return; }
    if (action === "activar-trial") { startTrial(); closeUpgrade(); return; }
    if (action === "suscribirme") { closeUpgrade(); navigate("/checkout"); return; }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeUpgrade} data-testid="upgrade-modal">
      <div onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/15 rounded-3xl p-7 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-sm text-white/60 mt-0.5">{message}</p>
            </div>
          </div>
          <button onClick={closeUpgrade} className="p-1 hover:bg-white/10 rounded text-white/60"><X className="w-5 h-5" /></button>
        </div>

        {compare && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLANS.map((p) => (
              <div key={p._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-lg font-bold text-[#f97316] mt-1">{cop(p.priceUsd)}<span className="text-xs text-white/40"> /mes</span></div>
                <ul className="mt-2 space-y-1">
                  {p.features.slice(0, 4).map((f) => (
                    <li key={f} className="text-[11px] text-white/60 flex items-center gap-1"><Check className="w-3 h-3 text-[#10b981]" /> {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          {actions.map((a) => {
            const primary = a === "suscribirme";
            const trial = a === "activar-trial";
            return (
              <button key={a} onClick={() => handle(a)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  primary ? "bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white"
                  : trial ? "border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20"
                  : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
                data-testid={`upgrade-action-${a}`}>
                {trial && <Rocket className="w-4 h-4" />}
                {UPGRADE_ACTION_LABELS[a] || a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
