import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

const KEY = 'pcl_trial_agreement';

/** ¿Ya aceptó este usuario el contrato para el trial? */
export function hasAcceptedTrial(email) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return Boolean(all[email || '_']?.accepted);
  } catch (e) { return false; }
}

/**
 * Gate de aceptación obligatoria ANTES de iniciar/usar el período de prueba.
 * No modifica la lógica del Trial: solo exige aceptar el Contrato de Suscripción
 * Profesional y registra fecha, hora y usuario (IP si el backend la provee).
 */
export function TrialAgreementGate() {
  const { user } = useAuth();
  const email = user?.email || '_';
  const [accepted, setAccepted] = useState(() => hasAcceptedTrial(email));
  const [checked, setChecked] = useState(false);

  if (!user || accepted) return null;

  const confirm = () => {
    if (!checked) return;
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || '{}');
      all[email] = {
        accepted: true,
        document: 'Contrato de Suscripción Profesional',
        user: email,
        user_id: user?.id || null,
        accepted_at: new Date().toISOString(),   // fecha + hora
        // IP: se captura del lado servidor cuando la arquitectura lo permita.
      };
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (e) { /* almacenamiento no disponible */ }
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" data-testid="trial-agreement-gate">
      <div className="bg-[#0f172a] border border-white/20 rounded-3xl p-7 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-6 h-6 text-[#f97316]" />
          <h2 className="text-xl font-bold">Activación del período de prueba</h2>
        </div>
        <p className="text-sm text-white/60 mb-4">
          Para iniciar tu prueba gratuita debes aceptar el Contrato de Suscripción Profesional.
        </p>
        <Link to="/subscription-agreement" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-[#f97316] hover:underline mb-4">
          <FileText className="w-4 h-4" /> Leer el Contrato de Suscripción Profesional
        </Link>
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer mb-4">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#f97316]" data-testid="trial-accept-checkbox" />
          <span className="text-sm text-white/80">He leído y acepto el Contrato de Suscripción Profesional.</span>
        </label>
        <Button onClick={confirm} disabled={!checked}
          className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold disabled:opacity-40"
          data-testid="trial-accept-confirm">
          Aceptar y comenzar mi prueba
        </Button>
      </div>
    </div>
  );
}

export default TrialAgreementGate;
