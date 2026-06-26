import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Users, Briefcase, Brain, BarChart3, Zap, MapPin,
  ArrowRight, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { API } from '@/config/api';

export function FirmOSPreviewBlock() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: 'Colombia',
    firm_size: 'solo',
  });

  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) return false;
    if (!formData.contact_name.trim()) return false;
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return false;
    if (!formData.phone.match(/^\+?[\d\s\-()]{10,}/)) return false;
    if (!formData.country) return false;
    return true;
  };

  const benefits = [
    { icon: Briefcase, title: 'CRM Jurídico', desc: 'Gestiona clientes, oportunidades y seguimiento comercial.' },
    { icon: Users, title: 'Gestión de Casos', desc: 'Administra expedientes, tareas y procesos desde un solo lugar.' },
    { icon: Brain, title: 'Documentos Inteligentes', desc: 'Automatiza contratos, escritos y documentos legales.' },
    { icon: Zap, title: 'Firma Electrónica', desc: 'Firma documentos con validez jurídica de forma segura.' },
    { icon: BarChart3, title: 'IA Jurídica', desc: 'Redacta, analiza y optimiza documentos con Inteligencia Artificial.' },
    { icon: MapPin, title: 'Seguridad Empresarial', desc: 'Protección avanzada para la información de tu firma.' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (submitted) return;
      setSubmitted(true);

      // Map form fields to FirmCreate schema
      // POST /firms/register expects full FirmCreate model
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const firmPayload = {
        name: formData.name,
        nit: `TRIAL-${Date.now()}`, // Auto-generated NIT for trial
        email: formData.email,
        phone: formData.phone,
        address: 'A completar en onboarding',
        city: 'A completar en onboarding',
        country: formData.country,
        plan: 'firm_growth', // Default plan
        founder_name: formData.contact_name,
        founder_email: formData.email, // Use same email as firm
        founder_phone: formData.phone,
        founder_document: 'TRIAL-PENDING',
        founder_bar_number: 'TRIAL-PENDING',
      };

      const res = await axios.post(`${API}/firms/register`, firmPayload);
      setSuccess(true);

      // Reset form after success
      setTimeout(() => {
        setFormData({
          name: '',
          contact_name: '',
          email: '',
          phone: '',
          country: 'Colombia',
          firm_size: 'solo',
        });
        setSuccess(false);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      let errorMsg = 'Error al registrar la firma. Intenta nuevamente.';

      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data) {
        const data = err.response.data;
        // Handle Pydantic validation errors array
        if (Array.isArray(data)) {
          errorMsg = data.map(e => e.msg || String(e)).join(', ');
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />

      {/* Watermark Background Image */}
      <div
        className="absolute inset-0 opacity-8 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1589829085787-f47371aff97b?auto=format&fit=crop&w=1920&q=80")',
          backgroundAttachment: 'fixed'
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.10),transparent_50%)]" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 border border-white/15 backdrop-blur-sm text-white/80 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            PROGRAMA PARA FIRMAS JURÍDICAS
          </span>
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-4">
            El futuro de tu firma <span className="text-[#f97316]">comienza aquí.</span>
          </h2>
          <p className="text-white/60 max-w-3xl mx-auto text-lg leading-relaxed">
            Prueba Punto Cero Legal durante <strong>7 días completamente gratis</strong> y descubre cómo una plataforma todo en uno puede optimizar la gestión de clientes, expedientes, documentos, facturación e inteligencia jurídica para tu firma.
          </p>
          <p className="text-white/60 max-w-3xl mx-auto text-base mt-3">
            No se requiere compromiso y tendrás acompañamiento durante todo el proceso de evaluación.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-12 gap-12 mb-16">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-white/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 to-[#f97316]/20 flex items-center justify-center mb-3 group-hover:shadow-lg transition-shadow">
                    <benefit.icon className="w-6 h-6 text-[#3b82f6]" />
                  </div>
                  <h4 className="text-white font-semibold mb-1 text-sm">{benefit.title}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Plan Band */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="backdrop-blur-xl bg-gradient-to-r from-[#3b82f6]/10 to-[#f97316]/10 border border-white/10 rounded-2xl p-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="border-r border-white/10 pr-8">
                  <h4 className="text-white font-bold text-lg mb-2">Firma en crecimiento</h4>
                  <p className="text-white/60 text-sm">Hasta 5 abogados</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">Firma consolidada</h4>
                  <p className="text-white/60 text-sm">Más de 10 abogados</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5"
          >
            <div className="backdrop-blur-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/15 rounded-3xl p-8 sticky top-24">
              <h3 className="text-2xl font-bold text-white mb-2">Comienza tu prueba gratuita</h3>
              <p className="text-white/60 text-sm mb-6">Activa tu acceso <strong>Trial de 7 días</strong> y conoce todas las funcionalidades de Punto Cero Legal. Un especialista configurará tu espacio y te acompañará durante el proceso.</p>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-xl bg-red-900/30 border border-red-700/50 flex gap-3 text-red-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Success Alert */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 rounded-xl bg-green-900/30 border border-green-700/50 flex gap-3 text-green-400"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">¡Registro exitoso! Un asesor se contactará pronto.</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre de la Firma */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Nombre de la firma *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all disabled:opacity-50"
                    placeholder="Tu firma jurídica"
                  />
                </div>

                {/* Nombre Completo */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Nombre completo *</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all disabled:opacity-50"
                    placeholder="Nombre completo"
                  />
                </div>

                {/* Email Corporativo */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Correo corporativo *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all disabled:opacity-50"
                    placeholder="contacto@firma.com"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">WhatsApp *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all disabled:opacity-50"
                    placeholder="+57 300 1234567"
                  />
                </div>

                {/* País */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">País *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="Colombia" className="bg-[#0f172a]">Colombia</option>
                    <option value="México" className="bg-[#0f172a]">México</option>
                    <option value="Argentina" className="bg-[#0f172a]">Argentina</option>
                    <option value="Chile" className="bg-[#0f172a]">Chile</option>
                    <option value="Perú" className="bg-[#0f172a]">Perú</option>
                    <option value="Ecuador" className="bg-[#0f172a]">Ecuador</option>
                    <option value="Venezuela" className="bg-[#0f172a]">Venezuela</option>
                    <option value="España" className="bg-[#0f172a]">España</option>
                  </select>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || !validateForm()}
                  whileHover={!loading && validateForm() ? { scale: 1.02 } : {}}
                  whileTap={!loading && validateForm() ? { scale: 0.98 } : {}}
                  className="w-full mt-6 relative inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold text-sm overflow-hidden group shadow-[0_0_30px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] opacity-30 blur-md group-hover:opacity-50 transition-opacity pointer-events-none" title={!validateForm() ? "Por favor completa todos los campos correctamente" : ""}  />
                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : validateForm() ? (
                      <>
                        Iniciar prueba gratuita de 7 días
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      "Completa todos los campos"
                    )}
                  </span>
                </motion.button>

                {/* Helper Text */}
                <div className="text-xs text-white/60 text-center pt-3 space-y-1">
                  <p>✓ Sin tarjeta de crédito</p>
                  <p>✓ Acceso inmediato al Trial</p>
                  <p>✓ Acompañamiento personalizado</p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
