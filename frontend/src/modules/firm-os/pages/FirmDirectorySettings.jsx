import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Globe, Share2 } from 'lucide-react';
import { API } from '@/config/api';

export default function FirmDirectorySettings({ firmId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');

  const [settings, setSettings] = useState({
    logo: '',
    description: '',
    city: '',
    country: '',
    practice_areas: [],
    website: '',
    linkedin: '',
    whatsapp: '',
    visibility_public: false
  });

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('pcl_token') || localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/firms/${firmId}/directory-settings`, { headers });
      setSettings(res.data.data);
      setPublicUrl(`${window.location.origin}/firms/${res.data.data.slug}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('pcl_token') || localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put(`${API}/firms/${firmId}/directory-settings`, settings, { headers });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = () => {
    setSettings(prev => ({ ...prev, visibility_public: !prev.visibility_public }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">Perfil Público</h2>
        <p className="text-white/60">Administra tu presencia en el directorio de firmas jurídicas</p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-3 text-red-400"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-green-900/30 border border-green-700/50 flex gap-3 text-green-400"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>Cambios guardados exitosamente</p>
        </motion.div>
      )}

      {/* Visibility Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Visibilidad Pública</h3>
            <p className="text-white/60 text-sm mt-1">
              {settings.visibility_public ? 'Tu perfil es visible en el directorio' : 'Tu perfil está oculto'}
            </p>
          </div>
          <button
            onClick={toggleVisibility}
            className={`p-3 rounded-lg transition-all ${
              settings.visibility_public
                ? 'bg-[#10b981]/20 text-[#10b981]'
                : 'bg-white/[0.03] text-white/60'
            }`}
          >
            {settings.visibility_public ? (
              <Eye className="w-6 h-6" />
            ) : (
              <EyeOff className="w-6 h-6" />
            )}
          </button>
        </div>

        {settings.visibility_public && publicUrl && (
          <div className="flex gap-2">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white/70 text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Copiar
            </button>
          </div>
        )}
      </motion.div>

      {/* Settings Form */}
      {settings.visibility_public && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6"
        >
          <div>
            <label className="block text-sm text-white/70 mb-2">Logo URL</label>
            <input
              type="url"
              value={settings.logo}
              onChange={(e) => setSettings(prev => ({ ...prev, logo: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Descripción</label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] resize-none"
              placeholder="Describe tu firma jurídica..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">Website</label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                placeholder="https://tufiima.com"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2">LinkedIn</label>
              <input
                type="url"
                value={settings.linkedin}
                onChange={(e) => setSettings(prev => ({ ...prev, linkedin: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                placeholder="https://linkedin.com/company/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">WhatsApp</label>
            <input
              type="tel"
              value={settings.whatsapp}
              onChange={(e) => setSettings(prev => ({ ...prev, whatsapp: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
              placeholder="+57 300 1234567"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#f97316] text-white font-bold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
