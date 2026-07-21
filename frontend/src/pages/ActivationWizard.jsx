import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../lib/utils';
import { API } from '@/config/api';

/**
 * Asistente de Activación — PLACEHOLDER FUNCIONAL
 *
 * Punto de continuidad del flujo oficial de activación. ProtectedRoute redirige
 * aquí cuando ready_for_onboarding=true && !onboarding_completed. Su única
 * responsabilidad es cerrar el onboarding (POST /onboarding/complete) para que
 * el usuario no quede atrapado en el redirect. NO implementa el wizard completo
 * (selección de plan, pasos guiados): eso queda pendiente de diseño.
 */
export const ActivationWizard = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/onboarding/complete`);
      // Sincronizar el estado del usuario (onboarding_completed=true) antes de salir
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo completar la activación'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3b82f6]/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10b981]/30 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-[#10b981]/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#10b981]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Asistente de Activación</h1>
          <p className="text-white/60 mb-8">
            Tu contraseña ya fue actualizada. Finaliza la activación para acceder a tu espacio de trabajo.
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Activando...' : 'Completar activación y continuar'}
            {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivationWizard;
