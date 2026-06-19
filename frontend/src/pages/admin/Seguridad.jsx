import React, { useState } from "react";
import { ShieldCheck, KeyRound, Copy, Check, Trash2, Clock } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { generateToken, activateToken, revokeToken, getActiveTokenInfo } from "@/core/security/supportToken";

const DURATIONS = [
  { hours: 4, label: "4 horas" },
  { hours: 24, label: "24 horas" },
  { hours: 72, label: "3 días" },
  { hours: 168, label: "7 días" },
];

/**
 * Panel de Seguridad — emisión y revocación de tokens de soporte.
 * Solo accesible bajo /admin (ProtectedRoute = roles admin). Aquí el
 * administrador genera tokens que habilitan las rutas técnicas protegidas por
 * SupportAccessGate, y los revoca cuando lo necesite.
 */
function Seguridad() {
  const [hours, setHours] = useState(24);
  const [label, setLabel] = useState("soporte");
  const [generated, setGenerated] = useState(null); // { token, exp, label }
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState(() => getActiveTokenInfo());

  const handleGenerate = () => {
    const t = generateToken({ hours, label: label.trim() || "soporte" });
    setGenerated(t);
    activateToken(t.token);          // se activa en esta sesión del admin
    setActive(getActiveTokenInfo());
    setCopied(false);
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard?.writeText(generated.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRevoke = () => {
    revokeToken();
    setActive(null);
    setGenerated(null);
  };

  const fmtDate = (ms) => new Date(ms).toLocaleString("es-CO");

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/[0.06] px-4 py-2.5 text-xs text-[#fca5a5]">
        Panel de Seguridad · emisión y revocación de tokens de soporte para acceso técnico. El acceso a rutas protegidas requiere un token vigente.
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Estado de acceso" value={active ? "Activo" : "Sin token"} icon={ShieldCheck} accent={active ? "#10b981" : "#ef4444"} />
        <MetricCard title="Etiqueta del token" value={active?.label || "—"} icon={KeyRound} accent="#3b82f6" />
        <MetricCard title="Expira" value={active ? fmtDate(active.exp) : "—"} icon={Clock} accent="#f97316" />
      </section>

      {/* Acceso Técnico — generar token */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 space-y-4">
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Acceso Técnico · Generar Token de Soporte</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-white/50 mb-1">Vigencia</label>
            <select value={hours} onChange={(e) => setHours(Number(e.target.value))}
              className="w-full bg-[#0a0e1a] border border-white/20 rounded-xl px-3 py-2 text-sm text-white">
              {DURATIONS.map((d) => <option key={d.hours} value={d.hours}>{d.label}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-white/50 mb-1">Etiqueta (ej. nombre del proveedor)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]/50" />
          </div>
        </div>
        <button onClick={handleGenerate} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold inline-flex items-center gap-2" data-testid="generate-support-token">
          <KeyRound className="w-4 h-4" /> Generar token
        </button>

        {generated && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Token (compártelo con el técnico)</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-[#10b981] font-mono break-all">{generated.token}</code>
              <button onClick={handleCopy} className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10" title="Copiar">
                {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="text-[11px] text-white/40 mt-2">Expira: {fmtDate(generated.exp)}</div>
          </div>
        )}
      </section>

      {/* Revocar */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6">
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Revocar acceso</h2>
        <p className="text-xs text-white/50 mb-3">
          Revoca el token activo en este equipo. Los técnicos perderán acceso a las rutas protegidas al expirar su token o al recibir uno nuevo.
        </p>
        <button onClick={handleRevoke} disabled={!active}
          className="px-4 py-2 rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444] text-sm font-bold inline-flex items-center gap-2 disabled:opacity-40"
          data-testid="revoke-support-token">
          <Trash2 className="w-4 h-4" /> Revocar token activo
        </button>
      </section>
    </div>
  );
}

export default Seguridad;
