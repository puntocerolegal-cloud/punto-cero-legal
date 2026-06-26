import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { API } from '@/config/api';

export function InviteLawyerModal({ isOpen, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('pcl_token') || localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(`${API}/firm-os/invite-lawyer`, {
        email: email.trim()
      }, { headers });

      setSuccess(true);
      setTimeout(() => {
        setEmail('');
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Invitar Abogado</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">¡Invitación enviada!</h3>
                  <p className="text-white/70">
                    Se ha enviado un correo a <strong>{email}</strong> con las instrucciones para activar su cuenta.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-white/70 text-sm">
                    Ingresa el correo del abogado que deseas invitar a tu firma.
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-2 text-red-400 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm text-white/70 mb-2">
                      Correo del Abogado
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:border-[#3b82f6] focus:outline-none disabled:opacity-50"
                        placeholder="abogado@ejemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/[0.05] transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Invitación'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
