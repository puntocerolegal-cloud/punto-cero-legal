import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, User
} from 'lucide-react';
import { API } from '@/config/api';

export default function ActivateLawyerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState(token ? 'activate' : 'error');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    password_confirm: ''
  });

  useEffect(() => {
    if (!token) {
      setError('Token de invitación no encontrado o expirado');
      setStep('error');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError('Por favor ingresa tu nombre');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/firm-os/activate-lawyer`, {
        token,
        full_name: formData.full_name,
        password: formData.password
      });

      setSuccess(true);

      setTimeout(() => {
        // Redirigir a login
        navigate('/login', { 
          state: { 
            message: 'Cuenta activada exitosamente. Por favor inicia sesión.',
            email: response.data.email
          } 
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al activar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Enlace inválido</h1>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Activar Cuenta
            </h1>
            <p className="text-white/70">
              Completa tu registro como abogado en Punto Cero Legal
            </p>
          </motion.div>

          {success ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle2 className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido!</h2>
              <p className="text-white/70">
                Tu cuenta ha sido activada exitosamente.
              </p>
              <p className="text-white/60 text-sm mt-4">
                Serás redirigido a la página de login...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-3 text-red-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:border-[#3b82f6] focus:outline-none disabled:opacity-50"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder-white/40 focus:border-[#3b82f6] focus:outline-none disabled:opacity-50"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white placeholder-white/40 focus:border-[#3b82f6] focus:outline-none disabled:opacity-50"
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#f97316] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activando...
                  </>
                ) : (
                  'Activar Cuenta'
                )}
              </motion.button>
            </form>
          )}

          <p className="text-center text-white/50 text-xs mt-6">
            Al activar tu cuenta aceptas nuestros términos de servicio
          </p>
        </div>
      </motion.div>
    </div>
  );
}
