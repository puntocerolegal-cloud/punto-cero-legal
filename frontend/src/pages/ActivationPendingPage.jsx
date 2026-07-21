import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { API } from '@/config/api';

export const ActivationPendingPage = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [activationNote, setActivationNote] = useState('');
  const [resending, setResending] = useState(false);
  const [resentSuccess, setResentSuccess] = useState(false);

  useEffect(() => {
    // Obtener datos del estado de navegación
    const state = location.state || {};
    if (state.email) {
      setEmail(state.email);
    }
    if (state.message) {
      setMessage(state.message);
    }
    if (state.activation_note) {
      setActivationNote(state.activation_note);
    }
  }, [location]);

  const handleResendActivation = async () => {
    setResending(true);
    setResentSuccess(false);
    
    try {
      // Obtener el usuario actual para obtener el user_id
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      // Primero obtener datos del usuario
      const userResponse = await fetch(`${API}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('No se pudo obtener información del usuario');
      }

      const userData = await userResponse.json();
      
      // Reenviar activación
      const response = await fetch(`${API}/auth/resend-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userData.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error al reenviar activación');
      }

      const result = await response.json();
      setResentSuccess(true);
      setMessage('Correo de activación reenviado exitosamente. Revisa tu bandeja de entrada.');
      
      // Log para debugging
      console.log('[ACTIVATION] Reenvío exitoso:', result);
      
    } catch (error) {
      console.error('[ACTIVATION] Error al reenviar:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3b82f6]/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10b981]/30 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-2xl relative z-10"
      >
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-[#f97316]/20 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-[#f97316]" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verificación Pendiente</h1>
            <p className="text-white/60">Tu cuenta está en proceso de activación</p>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#10b981] font-semibold mb-1">Información</p>
                <p className="text-sm text-white/80">{message}</p>
              </div>
            </div>
          )}

          {activationNote && (
            <div className="mb-6 p-4 rounded-xl bg-[#f97316]/10 border border-[#f97316]/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#f97316] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#f97316] font-semibold mb-1">Nota importante</p>
                <p className="text-sm text-white/80">{activationNote}</p>
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">¿Qué sigue?</h2>
            <ol className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#f97316]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#f97316]">1</span>
                <span>Revisa tu correo <strong className="text-white">{email || 'registrado'}</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#f97316]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#f97316]">2</span>
                <span>Busca el email con tus credenciales de acceso</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#f97316]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#f97316]">3</span>
                <span>Inicia sesión con la contraseña temporal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#f97316]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#f97316]">4</span>
                <span>Cambia tu contraseña en el primer acceso</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#f97316]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#f97316]">5</span>
                <span>Completa el Asistente de Activación</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleResendActivation}
              disabled={resending}
              className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <>
                  <RefreshCw className="mr-2 w-5 h-5 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 w-5 h-5" />
                  Reenviar correo de activación
                </>
              )}
            </Button>

            {resentSuccess && (
              <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
                <p className="text-sm text-[#10b981] text-center">
                  ✓ Correo reenviado exitosamente
                </p>
              </div>
            )}

            <Link to="/login">
              <Button 
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Ya tengo cuenta / Iniciar sesión
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-xs text-yellow-300 text-center">
              ⚠️ <strong>Importante:</strong> La contraseña temporal expira en 72 horas. 
              Si no la recibes, revisa tu carpeta de spam o solicita un reenvío.
            </p>
          </div>

          <p className="text-center text-white/40 text-xs mt-6">
            ¿Problemas? Contacta a <strong className="text-white/60">soporte@puntocerolegal.com</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivationPendingPage;