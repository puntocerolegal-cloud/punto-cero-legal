import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Gate de consentimiento legal empresarial (FASE 4.4).
 * Bloquea Firm OS hasta que el usuario acepte los documentos obligatorios.
 * Consume /api/firm-os/consent (GET estado, POST aceptación con IP/fecha/versión).
 */
const DOCS = [
  { key: "terms", label: "Términos y Condiciones", href: "/terms" },
  { key: "privacy", label: "Política de Privacidad", href: "/privacy" },
  { key: "habeas_data", label: "Habeas Data", href: "/privacy" },
  { key: "saas_contract", label: "Contrato SaaS", href: "/subscription-agreement" },
  { key: "data_processing", label: "Tratamiento de Datos", href: "/privacy" },
];

const authHeaders = () => {
  const t = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export function LegalConsentGate({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, accepted: true }); // asumir aceptado hasta comprobar
  const [checks, setChecks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.firm_id) { setState({ loading: false, accepted: true }); return; }
    axios.get(`${API}/firm-os/consent`, { headers: authHeaders() })
      .then((r) => setState({ loading: false, accepted: !!r.data?.accepted }))
      .catch(() => setState({ loading: false, accepted: true })); // no bloquear si el check falla
  }, [user?.firm_id]);

  const allChecked = DOCS.every((d) => checks[d.key]);

  const accept = async () => {
    if (!allChecked) return;
    setSaving(true);
    try {
      await axios.post(`${API}/firm-os/consent`, { documents: Object.fromEntries(DOCS.map((d) => [d.key, true])) }, { headers: authHeaders() });
      setState({ loading: false, accepted: true });
    } catch (e) {
      alert(e.response?.data?.detail || "No se pudo registrar el consentimiento");
    } finally {
      setSaving(false);
    }
  };

  if (state.loading || state.accepted) return children;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-[#0f172a] border border-white/15 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-[#10b981]" />
            <h2 className="text-2xl font-bold text-white">Aceptación legal requerida</h2>
          </div>
          <p className="text-white/70 text-sm">
            Para operar tu firma debes revisar y aceptar los siguientes documentos. Tu aceptación queda registrada con fecha, hora e IP.
          </p>
          <div className="space-y-3">
            {DOCS.map((d) => (
              <label key={d.key} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
                <input type="checkbox" checked={!!checks[d.key]} onChange={(e) => setChecks({ ...checks, [d.key]: e.target.checked })}
                  className="w-4 h-4 accent-[#10b981]" />
                <span className="flex-1 text-sm text-white">Acepto los <strong>{d.label}</strong></span>
                <a href={d.href} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white"><ExternalLink className="w-4 h-4" /></a>
              </label>
            ))}
          </div>
          <button onClick={accept} disabled={!allChecked || saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-bold disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Aceptar y continuar
          </button>
        </div>
      </div>
    </>
  );
}

export default LegalConsentGate;
