import React, { useState } from "react";
import { ShieldAlert, KeyRound, Check } from "lucide-react";
import { isSupportAccessActive, activateToken, getActiveTokenInfo } from "@/core/security/supportToken";

/**
 * Compuerta de Acceso de Soporte — Punto Cero System OS.
 * Capa ADICIONAL (no sustituye a FeatureGate). Protege rutas técnicas/config:
 * sin un token de soporte válido (emitido por el admin desde el Panel de
 * Seguridad), bloquea el acceso y permite "activar" pegando un token recibido.
 */
export function SupportAccessGate({ children, title }) {
  const [active, setActive] = useState(() => isSupportAccessActive());
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  if (active) return children;

  const handleActivate = () => {
    const ok = activateToken(input.trim());
    if (ok) { setError(false); setActive(true); }
    else setError(true);
  };

  const info = getActiveTokenInfo(); // null aquí (no activo), pero deja la API lista

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center rounded-2xl border border-[#ef4444]/30 bg-[#ef4444]/[0.05] p-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7 text-[#ef4444]" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">{title || "Acceso técnico restringido"}</h3>
        <p className="mt-1 text-sm text-white/50">
          Esta sección requiere un <strong>token de soporte</strong> vigente, emitido por el administrador.
          Pega el token recibido para activar el acceso.
        </p>

        <div className="mt-5 flex gap-2">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Pega el token de soporte…"
            className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f97316]/50"
            data-testid="support-token-input"
          />
          <button onClick={handleActivate} className="px-4 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold inline-flex items-center gap-1" data-testid="support-token-activate">
            <KeyRound className="w-4 h-4" /> Activar
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-[#ef4444]">Token inválido o expirado.</p>}
        {info && <p className="mt-2 text-xs text-[#10b981] inline-flex items-center gap-1"><Check className="w-3 h-3" /> Acceso activo</p>}
      </div>
    </div>
  );
}

export default SupportAccessGate;
