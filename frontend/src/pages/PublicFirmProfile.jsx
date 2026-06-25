import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Loader2, AlertCircle, MapPin, Users, Globe, Linkedin, MessageCircle,
  ArrowLeft, Mail, Phone, CheckCircle
} from 'lucide-react';
import { API } from '@/config/api';

export default function PublicFirmProfile() {
  const { slug } = useParams();
  const [firm, setFirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    loadFirmProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const loadFirmProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API}/public/firms/${slug}`);
      setFirm(res.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Firma no encontrada');
    } finally {
      setLoading(false);
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);

    try {
      await axios.post(`${API}/public/firms/${slug}/contact`, contactForm);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar mensaje');
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
      </div>
    );
  }

  if (error || !firm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]">
        <div className="container mx-auto px-6 py-12">
          <Link to="/firms" className="inline-flex items-center gap-2 text-[#3b82f6] hover:text-[#f97316] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Volver al directorio
          </Link>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-3 text-red-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error || 'Firma no encontrada'}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <Link to="/firms" className="inline-flex items-center gap-2 text-[#3b82f6] hover:text-[#f97316] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Volver al directorio
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative py-20 px-6 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.10),transparent_50%)]" />
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-3 gap-12 items-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {firm.logo ? (
                <div className="h-48 w-48 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                  <img src={firm.logo} alt={firm.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-48 w-48 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#f97316] flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">{firm.name.charAt(0)}</span>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-4">{firm.name}</h1>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-5 h-5 text-[#3b82f6]" />
                  <span>{firm.city}, {firm.country}</span>
                </div>
                
                <div className="flex items-center gap-3 text-white/70">
                  <Users className="w-5 h-5 text-[#3b82f6]" />
                  <span>{firm.active_lawyers_count || 0} abogados en el equipo</span>
                </div>
              </div>

              {firm.description && (
                <p className="text-white/60 text-lg leading-relaxed mb-6">
                  {firm.description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Specialties */}
            {firm.specialties && firm.specialties.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-white mb-6">Especialidades</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {firm.specialties.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10">
                      <CheckCircle className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{spec}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Contact Info */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-white mb-6">Contacto</h2>
              <div className="space-y-3">
                {firm.email && (
                  <a href={`mailto:${firm.email}`} className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group">
                    <Mail className="w-5 h-5 text-[#3b82f6] group-hover:text-[#f97316] transition-colors" />
                    <span className="text-white/80">{firm.email}</span>
                  </a>
                )}
                
                {firm.whatsapp && (
                  <a href={`https://wa.me/${firm.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group">
                    <MessageCircle className="w-5 h-5 text-[#25d366] group-hover:text-[#f97316] transition-colors" />
                    <span className="text-white/80">WhatsApp: {firm.whatsapp}</span>
                  </a>
                )}
                
                {firm.website && (
                  <a href={firm.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group">
                    <Globe className="w-5 h-5 text-[#3b82f6] group-hover:text-[#f97316] transition-colors" />
                    <span className="text-white/80">{firm.website}</span>
                  </a>
                )}
                
                {firm.linkedin && (
                  <a href={firm.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group">
                    <Linkedin className="w-5 h-5 text-[#0A66C2] group-hover:text-[#f97316] transition-colors" />
                    <span className="text-white/80">LinkedIn</span>
                  </a>
                )}
              </div>
            </motion.section>
          </div>

          {/* Sidebar - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 sticky top-24"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Solicitar Información</h3>

            {contactSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-lg bg-green-900/30 border border-green-700/50 flex gap-3 text-green-400"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">¡Mensaje enviado! Te contactaremos pronto.</p>
              </motion.div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                  disabled={contactLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                  disabled={contactLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  disabled={contactLoading}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50"
                  placeholder="+57 300 1234567"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Mensaje *</label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                  disabled={contactLoading}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 resize-none"
                  placeholder="Cuéntanos qué necesitas..."
                />
              </div>

              <motion.button
                type="submit"
                disabled={contactLoading}
                whileHover={!contactLoading ? { scale: 1.02 } : {}}
                whileTap={!contactLoading ? { scale: 0.98 } : {}}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#f97316] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {contactLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Mensaje'
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
