import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, MessageCircle, Clock, LogOut, FileCheck2, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export const VerificacionPendiente = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Polling automático cada 30s para detectar aprobación
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await refreshUser();
      if (fresh?.is_verified === true) {
        navigate('/dashboard');
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshUser, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setFeedback('');
    const fresh = await refreshUser();
    if (fresh?.is_verified === true) {
      setFeedback('✅ Tu cuenta fue aprobada. Redirigiendo a Mi Oficina Jurídica...');
      setTimeout(() => navigate('/dashboard'), 1200);
    } else {
      setFeedback('⏳ Tu solicitud sigue en revisión. Te notificaremos por correo cuando esté lista.');
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#f97316]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#3b82f6]/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="backdrop-blur-2xl bg-white/[0.04] rounded-3xl p-8 lg:p-12 border border-white/[0.08] shadow-2xl text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#ec4899] items-center justify-center relative"
          >
            <ShieldCheck className="w-12 h-12 text-white" />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-3xl border-2 border-[#f97316]"
            />
          </motion.div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] text-xs font-bold uppercase tracking-[0.2em] mb-6">
            <Clock className="w-3 h-3" /> Validación en curso
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Gracias por registrarte,
            <br />
            <span className="bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">
              {user?.full_name || 'Doctor'}
            </span>
          </h1>

          <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md mx-auto">
            Tu solicitud está siendo validada por nuestro equipo de <strong className="text-white">compliance</strong>.
            Recibirás un correo cuando tu acceso esté listo.
          </p>

          {/* Pasos del proceso */}
          <div className="space-y-3 mb-8 text-left max-w-md mx-auto">
            {[
              { icon: FileCheck2, label: 'Cuenta creada exitosamente', done: true },
              { icon: Sparkles, label: 'Validación de credenciales jurídicas', done: false, current: true },
              { icon: ShieldCheck, label: 'Activación de acceso al panel', done: false },
            ].map((step, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                step.done ? 'bg-[#10b981]/10 border-[#10b981]/30' :
                step.current ? 'bg-[#f97316]/10 border-[#f97316]/40' :
                'bg-white/[0.02] border-white/10'
              }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  step.done ? 'bg-[#10b981]' :
                  step.current ? 'bg-gradient-to-br from-[#f97316] to-[#fb923c]' :
                  'bg-white/10'
                }`}>
                  <step.icon className={`w-4 h-4 ${step.done || step.current ? 'text-white' : 'text-white/40'}`} />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${step.done || step.current ? 'text-white' : 'text-white/50'}`}>
                    {step.label}
                  </div>
                  {step.current && (
                    <div className="text-xs text-[#f97316] mt-0.5">En proceso · 24-48h hábiles</div>
                  )}
                </div>
                {step.current && (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Contact buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-all disabled:opacity-60"
              data-testid="verification-check-status"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Consultando...' : 'Verificar estado'}
            </button>
            <a
              href="mailto:puntocerolegal@gmail.com"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-semibold"
            >
              <Mail className="w-4 h-4 text-[#3b82f6]" /> Contactar Compliance
            </a>
            <a
              href="https://wa.me/573028322083?text=Hola,%20necesito%20agilizar%20mi%20verificación%20de%20cuenta."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white text-sm font-semibold hover:shadow-[0_10px_30px_rgba(37,211,102,0.3)] transition-all"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>

          {feedback && (
            <div className="mt-4 text-sm text-white/80 text-center" data-testid="verification-feedback">
              {feedback}
            </div>
          )}

          {/* Logout */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-xs text-white/40 hover:text-white/80 flex items-center gap-1 mx-auto transition-colors"
              data-testid="verification-logout"
            >
              <LogOut className="w-3 h-3" /> Cerrar sesión y volver al inicio
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          🔒 Punto Cero Legal · Compliance Department · Inversiones y Variedades DJGG 2013
        </p>
      </motion.div>
    </div>
  );
};

export default VerificacionPendiente;
