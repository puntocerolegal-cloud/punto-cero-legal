import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { API } from '@/config/api';

export function ActivateFirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [form, setForm] = useState({
    password: '',
    passwordConfirm: ''
  });
  
  const [validation, setValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    matches: false,
    isValid: false
  });

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token de activación no encontrado. Verifica el enlace del email.');
      return;
    }
    setToken(tokenParam);
  }, [searchParams]);

  const validatePassword = (pwd, confirm) => {
    const minLength = pwd.length >= 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const matches = pwd === confirm && pwd.length > 0;
    const isValid = minLength && hasUppercase && hasNumber && matches;

    setValidation({
      minLength,
      hasUppercase,
      hasNumber,
      matches,
      isValid
    });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setForm(prev => ({ ...prev, password: newPassword }));
    validatePassword(newPassword, form.passwordConfirm);
  };

  const handleConfirmChange = (e) => {
    const newConfirm = e.target.value;
    setForm(prev => ({ ...prev, passwordConfirm: newConfirm }));
    validatePassword(form.password, newConfirm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validation.isValid) {
      setError('Por favor, completa los requisitos de contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API}/firms/activate-account`, {
        token,
        password: form.password
      });

      setSuccess(true);
      
      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Cuenta activada exitosamente. Por favor, inicia sesión.'
          }
        });
      }, 2000);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      
      if (detail.includes('expirado')) {
        setError('El enlace de activación ha expirado. Solicita uno nuevo.');
      } else if (detail.includes('inválido') || detail.includes('no encontrado')) {
        setError('El enlace de activación no es válido.');
      } else {
        setError(detail || 'Error al activar cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Activar Cuenta</h1>
          <p className="text-gray-400">Crea una contraseña segura para tu firma</p>
        </div>

        {/* Contenido Principal */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          {error && (
            <div className="p-4 rounded-lg bg-red-900/30 border border-red-700 flex gap-3 text-red-400 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">¡Éxito!</h2>
              <p className="text-gray-400 mb-6">Tu cuenta ha sido activada exitosamente.</p>
              <p className="text-sm text-gray-500">Redirigiendo a login en unos momentos...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nueva Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handlePasswordChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.passwordConfirm}
                    onChange={handleConfirmChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Confirma tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Requisitos de Contraseña */}
              <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-300 mb-3">Requisitos:</p>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${validation.minLength ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {validation.minLength && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={validation.minLength ? 'text-green-400' : 'text-gray-400'}>
                    Mínimo 8 caracteres
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${validation.hasUppercase ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {validation.hasUppercase && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={validation.hasUppercase ? 'text-green-400' : 'text-gray-400'}>
                    Una mayúscula (A-Z)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${validation.hasNumber ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {validation.hasNumber && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={validation.hasNumber ? 'text-green-400' : 'text-gray-400'}>
                    Un número (0-9)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${validation.matches ? 'bg-green-600' : 'bg-gray-600'}`}>
                    {validation.matches && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={validation.matches ? 'text-green-400' : 'text-gray-400'}>
                    Contraseñas coinciden
                  </span>
                </div>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading || !validation.isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    ACTIVAR CUENTA
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-500 hover:text-blue-400 font-semibold"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>

        {/* Información */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Este enlace de activación expira en 24 horas.</p>
          <p>Si no puedes activar tu cuenta, solicita un nuevo enlace.</p>
        </div>
      </div>
    </div>
  );
}

export default ActivateFirmPage;
