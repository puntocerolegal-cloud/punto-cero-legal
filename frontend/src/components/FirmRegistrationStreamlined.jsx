import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Loader2, AlertCircle, CheckCircle, Globe, Phone, ArrowRight } from 'lucide-react';
import { API } from '../config/api';

// Phone validation
const PHONE_PREFIXES = {
  'México': '+52', 'Guatemala': '+502', 'Honduras': '+504', 'El Salvador': '+503',
  'Nicaragua': '+505', 'Costa Rica': '+506', 'Panamá': '+507', 'Cuba': '+53',
  'República Dominicana': '+1', 'Puerto Rico': '+1', 'Colombia': '+57', 'Venezuela': '+58',
  'Ecuador': '+593', 'Perú': '+51', 'Bolivia': '+591', 'Chile': '+56', 'Argentina': '+54',
  'Uruguay': '+598', 'Paraguay': '+595', 'Brasil': '+55', 'España': '+34',
};

const PHONE_NATIONAL_LEN = {
  'Colombia': 10, 'México': 10, 'Argentina': 10, 'Perú': 9, 'Chile': 9, 'Ecuador': 9,
  'Venezuela': 10, 'Bolivia': 8, 'Paraguay': 9, 'Uruguay': 8, 'Guatemala': 8,
  'Honduras': 8, 'El Salvador': 8, 'Nicaragua': 8, 'Costa Rica': 8, 'Panamá': 8,
  'Cuba': 8, 'República Dominicana': 10, 'Puerto Rico': 10, 'Brasil': 11, 'España': 9,
};

const FIRM_SIZES = [
  { id: 'solo', label: 'Solo yo', value: 'solo' },
  { id: '2-5', label: '2–5 abogados', value: '2-5' },
  { id: '6-20', label: '6–20 abogados', value: '6-20' },
  { id: '20+', label: 'Más de 20 abogados', value: '20+' },
];

const validatePhone = (country, phone) => {
  const prefix = PHONE_PREFIXES[country] || '';
  if (!phone || !phone.trim()) return { prefix, valid: null, message: '' };
  let digits = phone.replace(/\D/g, '');
  const px = prefix.replace('+', '');
  if (digits.startsWith(px)) digits = digits.slice(px.length);
  const expected = PHONE_NATIONAL_LEN[country];
  if (expected && digits.length !== expected) {
    return { prefix, valid: false, message: `Debe tener ${expected} dígitos` };
  }
  if (!expected && digits.length < 7) {
    return { prefix, valid: false, message: 'Número demasiado corto' };
  }
  return { prefix, valid: true, message: `${prefix} ${digits}` };
};

export function FirmRegistrationStreamlined({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatbotTimeoutRef = useRef(null);
  const formStartTimeRef = useRef(Date.now());

  const [formData, setFormData] = useState({
    firm_name: '',
    contact_name: '',
    contact_email: '',
    contact_country: 'Colombia',
    contact_phone: '',
    firm_size: 'solo',
  });

  const phoneValidation = validatePhone(formData.contact_country, formData.contact_phone);

  // Show chatbot after 15 seconds
  useEffect(() => {
    if (!open || success) return;
    
    const resetTimer = () => {
      if (chatbotTimeoutRef.current) clearTimeout(chatbotTimeoutRef.current);
      chatbotTimeoutRef.current = setTimeout(() => {
        setShowChatbot(true);
      }, 15000);
    };

    const events = ['input', 'change', 'click', 'keydown'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetTimer));
      if (chatbotTimeoutRef.current) clearTimeout(chatbotTimeoutRef.current);
    };
  }, [open, success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.firm_name.trim()) {
        setError('Nombre de la firma requerido');
        setLoading(false);
        return;
      }
      if (!formData.contact_name.trim()) {
        setError('Nombre de contacto requerido');
        setLoading(false);
        return;
      }
      if (!formData.contact_email.trim()) {
        setError('Email corporativo requerido');
        setLoading(false);
        return;
      }
      if (phoneValidation.valid !== true) {
        setError('WhatsApp inválido');
        setLoading(false);
        return;
      }

      const payload = {
        name: formData.firm_name,
        contact_name: formData.contact_name,
        email: formData.contact_email,
        phone: formData.contact_phone,
        country: formData.contact_country,
        firm_size: formData.firm_size,
        metadata: {
          form_completion_time_ms: Date.now() - formStartTimeRef.current,
          form_version: 'streamlined_v1',
        },
      };

      const res = await axios.post(`${API}/firms/register-lead`, payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess(res.data);
        onClose();
      }, 2000);
    } catch (err) {
      let errorMsg = 'Error al registrar firma';

      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data)) {
          errorMsg = data.map(e => e.msg || String(e)).join(', ');
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl border border-white/10 max-w-lg w-full shadow-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Crear mi espacio</h2>
            <p className="text-white/60 text-sm mt-1">Toma menos de 40 segundos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex gap-3 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>¡Perfecto! Tu firma está lista. Redirigiendo...</span>
            </div>
          )}

          {!success && (
            <>
              {/* Firma Name */}
              <div>
                <label htmlFor="firm_name" className="block text-sm font-semibold text-white mb-1.5">
                  Nombre de la firma
                </label>
                <input
                  id="firm_name"
                  type="text"
                  name="firm_name"
                  value={formData.firm_name}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-white placeholder:text-white/40 focus:border-[#f97316] focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Ej: Firma Jurídica XYZ"
                  autoFocus
                />
              </div>

              {/* Contact Name */}
              <div>
                <label htmlFor="contact_name" className="block text-sm font-semibold text-white mb-1.5">
                  Tu nombre
                </label>
                <input
                  id="contact_name"
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-white placeholder:text-white/40 focus:border-[#f97316] focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Ej: Juan García"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact_email" className="block text-sm font-semibold text-white mb-1.5">
                  Email corporativo
                </label>
                <input
                  id="contact_email"
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-white placeholder:text-white/40 focus:border-[#f97316] focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="info@firma.com"
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="contact_country" className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  País
                </label>
                <select
                  id="contact_country"
                  name="contact_country"
                  value={formData.contact_country}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-white focus:border-[#f97316] focus:outline-none transition-colors disabled:opacity-50"
                >
                  {['Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Bolivia', 'Venezuela',
                    'Paraguay', 'Uruguay', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua',
                    'Costa Rica', 'Panamá', 'Cuba', 'República Dominicana', 'Puerto Rico', 'España'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </label>
                <div className="flex gap-2">
                  <div className="bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-white/60 text-sm min-w-fit">
                    {PHONE_PREFIXES[formData.contact_country] || '+57'}
                  </div>
                  <input
                    id="contact_phone"
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    disabled={loading}
                    className={`flex-1 bg-white/5 border rounded-lg px-3.5 py-2.5 text-white placeholder:text-white/40 focus:outline-none transition-colors disabled:opacity-50 ${
                      phoneValidation.valid === true ? 'border-green-500/50' :
                      phoneValidation.valid === false ? 'border-red-500/50' :
                      'border-white/15 focus:border-[#f97316]'
                    }`}
                    placeholder="3001234567"
                  />
                </div>
                {phoneValidation.message && (
                  <p className={`text-xs mt-1.5 ${phoneValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {phoneValidation.message}
                  </p>
                )}
              </div>

              {/* Firm Size */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2.5">
                  Tamaño de tu firma
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FIRM_SIZES.map(size => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, firm_size: size.value }))}
                      disabled={loading}
                      className={`p-2.5 rounded-lg border transition-all text-sm font-medium disabled:opacity-50 ${
                        formData.firm_size === size.value
                          ? 'bg-[#f97316]/20 border-[#f97316] text-white'
                          : 'bg-white/5 border-white/15 text-white/60 hover:border-white/30'
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || phoneValidation.valid !== true}
                className="w-full mt-6 bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-lg hover:shadow-[#f97316]/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    Crear mi espacio
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {showChatbot && (
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-blue-300 text-sm">
                    💬 <strong>¿Necesitas ayuda para registrar tu firma?</strong>
                  </p>
                  <p className="text-blue-200/70 text-xs mt-1">
                    Nuestro asistente puede responder tus preguntas.
                  </p>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
