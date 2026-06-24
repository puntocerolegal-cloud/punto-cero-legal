import { useState, useEffect } from "react";
import { ShieldCheck, Lock, Server, KeyRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { isSupportAccessActive } from "@/core/security/supportToken";

/**
 * Componente interactivo de Sellos de Seguridad y Confianza.
 * Vincula cada sello a funcionalidades reales del sistema:
 * - Ley 1581: enlace a políticas de privacidad
 * - SSL 256: detección automática de HTTPS
 * - Cloud: tooltip de infraestructura
 * - SupportAccessGate: detección de estado activo
 */
export function SecuritySeals() {
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isHttps, setIsHttps] = useState(false);
  const [supportAccessActive, setSupportAccessActive] = useState(false);

  useEffect(() => {
    // Detectar HTTPS dinámicamente
    setIsHttps(typeof window !== "undefined" ? window.location.protocol === "https:" : false);
    // Detectar si SupportAccessGate está activo
    setSupportAccessActive(isSupportAccessActive());
  }, []);

  const handleSealClick = (sealKey, action) => {
    trackEvent("security_badge_click", {
      seal: sealKey,
      action: action,
    });

    if (sealKey === "habeas-data" && action === "navigate") {
      navigate("/privacy");
    }

    setActiveTooltip(activeTooltip === sealKey ? null : sealKey);
  };

  const handleSealView = (sealKey) => {
    trackEvent("security_badge_view", {
      seal: sealKey,
    });
  };

  const seals = [
    {
      key: "habeas-data",
      icon: ShieldCheck,
      title: "Cumplimiento Ley 1581",
      highlight: "Habeas Data",
      desc: "Datos jurídicos protegidos bajo normativa legal colombiana de protección de datos.",
      tooltip: "Acceso a políticas de privacidad y tratamiento de datos personales en conformidad con la Ley 1581 de 2013.",
      interactive: true,
      actionLabel: "Ver Políticas",
      actionType: "navigate",
    },
    {
      key: "ssl-256",
      icon: Lock,
      title: "Cifrado SSL 256 bits",
      highlight: isHttps ? "Conexión Segura" : "Extremo a extremo",
      desc: "Conexión encriptada para transacciones y datos sensibles en toda la plataforma.",
      tooltip: isHttps
        ? "Conexión Segura Verificada — Tu comunicación está protegida con cifrado TLS 1.3 (256-bit)."
        : "Esta conexión no está cifrada. En producción, esta aplicación usa HTTPS.",
      interactive: false,
      statusIcon: isHttps ? "verified" : "neutral",
    },
    {
      key: "cloud-infrastructure",
      icon: Server,
      title: "Cloud Blindada",
      highlight: "Alta disponibilidad",
      desc: "Servidores con respaldos continuos automáticos y redundancia permanente.",
      tooltip: "Infraestructura desplegada en entorno cloud con alta disponibilidad, respaldos automáticos continuos y redundancia permanente en múltiples zonas.",
      interactive: false,
    },
    {
      key: "support-access",
      icon: KeyRound,
      title: "SupportAccessGate",
      highlight: supportAccessActive ? "Acceso Activo" : "Acceso controlado",
      desc: "Acceso técnico restringido bajo autorización explícita del bufete.",
      tooltip: supportAccessActive
        ? "Acceso técnico controlado mediante autorización explícita y registro de auditoría. Token activo."
        : "Acceso técnico controlado mediante autorización explícita y registro de auditoría. Sin token activo.",
      interactive: false,
      statusIcon: supportAccessActive ? "active" : "locked",
    },
  ];

  return (
    <section
      aria-labelledby="trust-seals-title"
      className="relative bg-[#0a1226] border-t border-white/10 py-16 px-6 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#0a1226] to-[#0a1226] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-40 bg-[#f97316]/10 blur-3xl rounded-full pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f97316]/15 border border-[#f97316]/30 text-[#fb923c] text-[11px] font-bold uppercase tracking-[0.18em]">
            <ShieldCheck className="w-3.5 h-3.5" /> Seguridad y Confianza
          </span>
          <h2
            id="trust-seals-title"
            className="text-2xl sm:text-3xl font-bold text-white mt-4"
          >
            Su información protegida con{" "}
            <span className="text-[#f97316]">estándares premium</span>
          </h2>
          <p className="text-white/50 text-sm mt-2 max-w-2xl mx-auto">
            Infraestructura, cifrado y normativa que blindan cada caso, documento
            y transacción.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {seals.map((seal) => (
            <li
              key={seal.key}
              className="group relative flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-[#f97316]/40 hover:bg-white/[0.05]"
              data-testid={`trust-seal-${seal.key}`}
              role="region"
              aria-label={`Sello de seguridad: ${seal.title}`}
              aria-describedby={`seal-desc-${seal.key}`}
              onMouseEnter={() => {
                handleSealView(seal.key);
                setActiveTooltip(seal.key);
              }}
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={() => {
                handleSealView(seal.key);
                setActiveTooltip(seal.key);
              }}
              onBlur={() => setActiveTooltip(null)}
              tabIndex={seal.interactive ? 0 : -1}
              role={seal.interactive ? "button" : undefined}
            >
              {/* Icon container */}
              <div className="w-14 h-14 rounded-2xl border border-[#f97316]/40 bg-[#f97316]/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                <seal.icon
                  className="w-7 h-7 text-[#fb923c]"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                {seal.statusIcon === "verified" && (
                  <div className="absolute w-5 h-5 rounded-full bg-[#10b981] border-2 border-[#0a1226] -bottom-1 -right-1 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">✓</span>
                  </div>
                )}
                {seal.statusIcon === "active" && (
                  <div className="absolute w-5 h-5 rounded-full bg-[#f97316] border-2 border-[#0a1226] -bottom-1 -right-1 animate-pulse" />
                )}
              </div>

              {/* Content */}
              <h3 className="text-white font-semibold text-sm leading-tight">
                {seal.title}
              </h3>
              <span className="text-[#f97316] text-[11px] font-bold uppercase tracking-wider mt-1">
                {seal.highlight}
              </span>
              <p
                className="text-white/50 text-xs leading-relaxed mt-3"
                id={`seal-desc-${seal.key}`}
              >
                {seal.desc}
              </p>

              {/* Interactive tooltip */}
              {activeTooltip === seal.key && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-[#1a2847] border border-[#f97316]/40 rounded-xl p-3 text-xs text-white/90 shadow-2xl z-20 pointer-events-auto">
                  <p className="mb-3">{seal.tooltip}</p>
                  {seal.interactive && (
                    <button
                      onClick={() =>
                        handleSealClick(seal.key, seal.actionType)
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-[10px] font-bold transition-opacity hover:opacity-90"
                      aria-label={seal.actionLabel}
                    >
                      {seal.actionLabel}
                    </button>
                  )}
                  <button
                    className="absolute top-1 right-1 p-1 hover:bg-white/10 rounded transition-colors"
                    onClick={() => setActiveTooltip(null)}
                    aria-label="Cerrar tooltip"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Touch-friendly interactivity indicator */}
              {seal.interactive && (
                <span className="absolute top-3 right-3 text-[#f97316]/60 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default SecuritySeals;
