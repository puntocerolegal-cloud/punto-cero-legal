import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowRight, ArrowLeft, Check, Loader2, ShieldCheck, Upload } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { PhoneInput } from "@/components/PhoneInput";

const STEPS = [
  "Fundador", "Datos comerciales", "Identidad", "Plan", "Aceptación legal", "Crear", "Ingreso",
];
const LEGAL = [
  { key: "terms", label: "Términos y Condiciones" },
  { key: "privacy", label: "Política de Privacidad" },
  { key: "habeas_data", label: "Habeas Data" },
  { key: "saas_contract", label: "Contrato SaaS" },
  { key: "data_processing", label: "Tratamiento de Datos" },
];

const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-semibold mb-1 text-white/80">{label}</label>
    <input {...props} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40" />
  </div>
);

export default function FirmOnboardingWizard() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(0);
  const [founder, setFounder] = useState({ email: "", password: "", confirm: "", full_name: "", phone: "" });
  const [commercial, setCommercial] = useState({ commercial_name: "", legal_name: "", nit: "", address: "", city: "", country: "Colombia", phone: "", corporate_email: "", website: "", specialties: "", social_links: "" });
  const [branding, setBranding] = useState({ logo_url: "", avatar_url: "", cover_url: "", favicon_url: "", primary_color: "#3b82f6", secondary_color: "#10b981", public_name: "" });
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState([]);
  const [consent, setConsent] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API}/firm-os/plans`).then((r) => setPlans(r.data?.plans || [])).catch(() => {});
  }, []);

  const upField = (setter) => (k, v) => setter((p) => ({ ...p, [k]: v }));
  const upFounder = upField(setFounder);
  const upComm = upField(setCommercial);
  const upBrand = upField(setBranding);

  const uploadImg = (field) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert("Máx 2MB"); return; }
    const r = new FileReader();
    r.onload = () => upBrand(field, r.result);
    r.readAsDataURL(f);
  };

  const canNext = () => {
    if (step === 0) return founder.email && founder.password && founder.password === founder.confirm && founder.full_name;
    if (step === 1) return commercial.commercial_name;
    if (step === 3) return !!planId;
    if (step === 4) return LEGAL.every((d) => consent[d.key]);
    return true;
  };

  const submit = async () => {
    setSubmitting(true); setError("");
    try {
      const payload = {
        founder: { email: founder.email, password: founder.password, full_name: founder.full_name, phone: founder.phone },
        commercial, branding, plan_id: planId,
        consent: { documents: Object.fromEntries(LEGAL.map((d) => [d.key, true])) },
      };
      await axios.post(`${API}/firm-os/onboarding`, payload);
      setStep(6);
      // Auto-ingreso reutilizando el login del contexto.
      await login(founder.email, founder.password);
      setTimeout(() => navigate("/firm-os"), 1200);
    } catch (e) {
      setError(e.response?.data?.detail || "No se pudo crear la firma");
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-[#f97316]" />
          <div>
            <h1 className="text-2xl font-bold">Crear firma jurídica</h1>
            <p className="text-white/50 text-sm">Paso {Math.min(step + 1, 7)} de 7 · {STEPS[step]}</p>
          </div>
        </div>
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#f97316]" : "bg-white/10"}`} />)}
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
          {step === 0 && (
            <>
              <h2 className="text-lg font-bold">Abogado fundador (será Firm Owner / Administrador)</h2>
              <Field label="Nombre completo" value={founder.full_name} onChange={(e) => upFounder("full_name", e.target.value)} />
              <Field label="Correo" type="email" value={founder.email} onChange={(e) => upFounder("email", e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contraseña" type="password" value={founder.password} onChange={(e) => upFounder("password", e.target.value)} />
                <Field label="Confirmar contraseña" type="password" value={founder.confirm} onChange={(e) => upFounder("confirm", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-white/80">Teléfono</label>
                <PhoneInput value={founder.phone} onChange={(v) => upFounder("phone", v)} />
              </div>
              {founder.password && founder.confirm && founder.password !== founder.confirm && <p className="text-red-400 text-sm">Las contraseñas no coinciden</p>}
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold">Información comercial</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre comercial" value={commercial.commercial_name} onChange={(e) => upComm("commercial_name", e.target.value)} />
                <Field label="Razón social" value={commercial.legal_name} onChange={(e) => upComm("legal_name", e.target.value)} />
                <Field label="NIT / RIF" value={commercial.nit} onChange={(e) => upComm("nit", e.target.value)} />
                <div>
                  <label className="block text-sm font-semibold mb-1 text-white/80">Teléfono</label>
                  <PhoneInput value={commercial.phone} onChange={(v) => upComm("phone", v)} />
                </div>
                <Field label="Dirección" value={commercial.address} onChange={(e) => upComm("address", e.target.value)} />
                <Field label="Ciudad" value={commercial.city} onChange={(e) => upComm("city", e.target.value)} />
                <Field label="País" value={commercial.country} onChange={(e) => upComm("country", e.target.value)} />
                <Field label="Email corporativo" value={commercial.corporate_email} onChange={(e) => upComm("corporate_email", e.target.value)} />
                <Field label="Página web" value={commercial.website} onChange={(e) => upComm("website", e.target.value)} />
                <Field label="Especialidades" value={commercial.specialties} onChange={(e) => upComm("specialties", e.target.value)} />
              </div>
              <Field label="Redes sociales" value={commercial.social_links} onChange={(e) => upComm("social_links", e.target.value)} />
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-lg font-bold">Identidad corporativa (White Label)</h2>
              <div className="grid grid-cols-2 gap-4">
                {["logo_url", "avatar_url", "cover_url", "favicon_url"].map((f) => (
                  <div key={f}>
                    <label className="block text-sm font-semibold mb-1 text-white/80 capitalize">{f.replace("_url", "")}</label>
                    <div className="flex items-center gap-2">
                      {branding[f] ? <img src={branding[f]} alt={f} className="w-10 h-10 rounded object-cover border border-white/20" /> : <div className="w-10 h-10 rounded bg-white/5 border border-white/10" />}
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm flex items-center gap-1"><Upload className="w-3 h-3" /> Subir<input type="file" accept="image/*" onChange={uploadImg(f)} className="hidden" /></label>
                    </div>
                  </div>
                ))}
                <Field label="Nombre público" value={branding.public_name} onChange={(e) => upBrand("public_name", e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="block text-sm font-semibold mb-1 text-white/80">Color principal</label><input type="color" value={branding.primary_color} onChange={(e) => upBrand("primary_color", e.target.value)} className="w-full h-10 rounded bg-white/10 border border-white/20" /></div>
                  <div><label className="block text-sm font-semibold mb-1 text-white/80">Color secundario</label><input type="color" value={branding.secondary_color} onChange={(e) => upBrand("secondary_color", e.target.value)} className="w-full h-10 rounded bg-white/10 border border-white/20" /></div>
                </div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-lg font-bold">Selecciona un plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plans.map((p) => (
                  <div key={p.id} onClick={() => setPlanId(p.id)} className={`p-4 rounded-xl border-2 cursor-pointer ${planId === p.id ? "border-[#f97316] bg-[#f97316]/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}>
                    <div className="flex items-center justify-between"><p className="font-bold" style={{ color: p.color }}>{p.name}</p><span className="text-sm text-white/70">{p.price_display}</span></div>
                    <p className="text-xs text-white/50 mt-1">Hasta {p.max_lawyers} abogados · {p.max_storage_gb} GB · {p.ai_monthly} IA/mes</p>
                    <ul className="mt-2 space-y-0.5">{(p.features || []).slice(0, 5).map((f, i) => <li key={i} className="text-xs text-white/60">• {f}</li>)}</ul>
                  </div>
                ))}
                {plans.length === 0 && <p className="text-white/50 text-sm">Cargando planes…</p>}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#10b981]" /> Aceptación legal</h2>
              <p className="text-white/60 text-sm">Tu aceptación se registra con fecha, hora e IP.</p>
              {LEGAL.map((d) => (
                <label key={d.key} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked={!!consent[d.key]} onChange={(e) => setConsent({ ...consent, [d.key]: e.target.checked })} className="w-4 h-4 accent-[#10b981]" />
                  <span className="text-sm">Acepto los <strong>{d.label}</strong></span>
                </label>
              ))}
            </>
          )}
          {step === 5 && (
            <>
              <h2 className="text-lg font-bold">Revisar y crear</h2>
              <div className="text-sm text-white/70 space-y-1">
                <p>Firma: <strong className="text-white">{commercial.commercial_name}</strong></p>
                <p>Fundador: <strong className="text-white">{founder.full_name}</strong> ({founder.email})</p>
                <p>Plan: <strong className="text-white">{plans.find((p) => p.id === planId)?.name || planId}</strong></p>
                <p>Legales aceptados: <strong className="text-white">{LEGAL.length}/5</strong></p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={submit} disabled={submitting} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#f97316] hover:bg-[#ea6a0c] font-bold disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Crear mi firma
              </button>
            </>
          )}
          {step === 6 && (
            <div className="text-center py-8">
              <Check className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
              <h2 className="text-xl font-bold">¡Firma creada!</h2>
              <p className="text-white/60 mt-2">Ingresando a tu Dashboard…</p>
            </div>
          )}

          {step < 5 && (
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40"><ArrowLeft className="w-4 h-4" /> Atrás</button>
              <button onClick={() => canNext() && setStep((s) => s + 1)} disabled={!canNext()} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40">Siguiente <ArrowRight className="w-4 h-4" /></button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
