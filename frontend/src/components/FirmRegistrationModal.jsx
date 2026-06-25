import React, { useState } from 'react';
import axios from 'axios';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { API } from '@/config/api';

export function FirmRegistrationModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Colombia',
    plan: 'firm_growth',
    founder_name: '',
    founder_email: '',
    founder_phone: '',
    founder_document: '',
    founder_bar_number: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await axios.post(`${API}/firms/register`, form);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess?.(res.data);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error al registrar firma');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Registrar Mi Firma</h2>
            <p className="text-gray-400 text-sm mt-1">Completa el formulario para comenzar</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-900/30 border border-red-700 flex gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-900/30 border border-green-700 flex gap-3 text-green-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">¡Éxito!</p>
                <p className="text-sm">Tu firma ha sido registrada. Redirigiendo...</p>
              </div>
            </div>
          )}

          {!success && (
            <>
              {/* DATOS DE LA FIRMA */}
              <div className="space-y-4 pb-4 border-b border-gray-700">
                <h3 className="font-semibold text-white">Datos de la Firma</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nombre de la Firma *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Ej: Firma Jurídica XYZ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">NIT *</label>
                    <input
                      type="text"
                      name="nit"
                      value={form.nit}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Ej: 123456789-1"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Corporativo *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="info@firma.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="+57 1 2345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dirección *</label>
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="Cra 7 #120-50"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ciudad *</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Bogotá"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">País *</label>
                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Colombia"
                    />
                  </div>
                </div>
              </div>

              {/* SOCIO FUNDADOR */}
              <div className="space-y-4 pb-4 border-b border-gray-700">
                <h3 className="font-semibold text-white">Socio Fundador</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      name="founder_name"
                      value={form.founder_name}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Juan Pérez"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email de Acceso *</label>
                    <input
                      type="email"
                      name="founder_email"
                      value={form.founder_email}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="juan@firma.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Teléfono *</label>
                    <input
                      type="tel"
                      name="founder_phone"
                      value={form.founder_phone}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="+57 301 2345678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Documento *</label>
                    <input
                      type="text"
                      name="founder_document"
                      value={form.founder_document}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="12345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tarjeta Profesional *</label>
                  <input
                    type="text"
                    name="founder_bar_number"
                    value={form.founder_bar_number}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="123456 - Consejo Superior de la Judicatura"
                  />
                </div>
              </div>

              {/* PLAN */}
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Plan Selecciona do</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="cursor-pointer p-4 rounded-lg border-2 transition-all" style={{
                    borderColor: form.plan === 'firm_growth' ? '#3b82f6' : '#374151',
                    backgroundColor: form.plan === 'firm_growth' ? '#1e3a8a' : '#111827'
                  }}>
                    <input
                      type="radio"
                      name="plan"
                      value="firm_growth"
                      checked={form.plan === 'firm_growth'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <span className="font-semibold text-white">Firma en Crecimiento</span>
                    <p className="text-sm text-gray-300 mt-2">Hasta 5 abogados</p>
                  </label>
                  
                  <label className="cursor-pointer p-4 rounded-lg border-2 transition-all" style={{
                    borderColor: form.plan === 'firm_enterprise' ? '#3b82f6' : '#374151',
                    backgroundColor: form.plan === 'firm_enterprise' ? '#1e3a8a' : '#111827'
                  }}>
                    <input
                      type="radio"
                      name="plan"
                      value="firm_enterprise"
                      checked={form.plan === 'firm_enterprise'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <span className="font-semibold text-white">Consolidación Empresarial</span>
                    <p className="text-sm text-gray-300 mt-2">Hasta 10 abogados</p>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-white font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors text-white font-medium flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Registrando...' : success ? 'Registrado!' : 'Registrar Firma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FirmRegistrationModal;
