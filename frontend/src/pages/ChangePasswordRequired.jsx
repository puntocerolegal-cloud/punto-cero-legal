import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API } from '@/config/api';

export const ChangePasswordRequired = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validación: si no hay usuario o no requiere cambio, redirigir según rol
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.requires_password_change) {
      // Redirigir según rol del usuario
      if (['admin', 'admin_general', 'socio_comercial'].includes(user.role)) {
        navigate('/admin');
      } else if (['firm_owner', 'firm_admin', 'firm_lawyer'].includes(user.role)) {
        navigate('/firm-os');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const validatePasswords = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setError('Todos los campos son requeridos');
      return false;
    }

    if (passwords.new.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (passwords.current === passwords.new) {
      setError('La nueva contraseña debe ser diferente a la anterior');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePasswords()) return;

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `${API}/auth/change-password-first-login`,
        {
          current_password: passwords.current,
          new_password: passwords.new
        },
        { headers }
      );

      setSuccess(true);
      setTimeout(() => {
        // Hacer logout y redirigir a login para que ingrese con nueva contraseña
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña');
      console.error('Change password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-2">¡Contraseña Actualizada!</h1>
          <p className="text-white/60 mb-6">
            Tu contraseña ha sido cambiada exitosamente.<br />
            Serás redirigido al login en unos momentos...
          </p>
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3b82f6]/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f97316]/30 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scale className="w-10 h-10 text-[#f97316]" />
          <span className="text-3xl font-bold text-white">Punto Cero Legal</span>
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-300 mb-1">Cambio Obligatorio de Contraseña</p>
              <p className="text-xs text-blue-200">
                Para acceder por primera vez, debes cambiar tu contraseña temporal.
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Actualizar Contraseña</h1>
          <p className="text-white/60 mb-6">Ingresa una nueva contraseña segura</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Contraseña Actual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="bg-white/10 border-white/20 text-white pl-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="bg-white/10 border-white/20 text-white pl-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-white/50 mt-1">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="bg-white/10 border-white/20 text-white pl-10"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>

          <p className="text-center text-white/60 mt-6 text-sm">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@puntocerolegal.com" className="text-[#f97316] hover:underline font-semibold">
              Contacta a soporte
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordRequired;
