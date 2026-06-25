import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Briefcase, Brain, BarChart3, Zap, MapPin,
  Check, ArrowRight
} from 'lucide-react';

export function FirmOSPreviewBlock() {
  const [formData, setFormData] = useState({
    firmName: '',
    founderName: '',
    email: '',
    phone: '',
    city: '',
    plan: 'crecimiento'
  });

  const benefits = [
    { icon: Users, title: 'Gestión de Equipo Jurídico', desc: 'Organiza equipos y asigna casos de forma inteligente' },
    { icon: Briefcase, title: 'CRM Jurídico Inteligente', desc: 'Gestión completa de clientes y casos en una plataforma' },
    { icon: Brain, title: 'Inteligencia Artificial Legal', desc: 'Análisis de documentos y generación automática de contratos' },
    { icon: BarChart3, title: 'Métricas y Reportes', desc: 'Visibilidad total de resultados y productividad' },
    { icon: Zap, title: 'Automatización de Procesos', desc: 'Reduce tareas manuales y aumenta eficiencia' },
    { icon: MapPin, title: 'Expansión Multi Oficina', desc: 'Escala tu firma a múltiples ubicaciones sin complejidad' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Future: API integration here
  };

  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.10),transparent_50%)]" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-4">
            Programa para <span className="bg-gradient-to-r from-[#3b82f6] to-[#f97316] bg-clip-text text-transparent">Firmas Jurídicas</span>
          </h2>
          <p className="text-xl text-white/70 mb-2">
            Firma en Crecimiento y Consolidación Empresarial
          </p>
          <p className="text-white/60 max-w-3xl mx-auto text-lg">
            Escale su firma jurídica con tecnología, automatización, inteligencia artificial y herramientas de gestión 
            diseñadas para aumentar productividad, control operativo y rentabilidad.
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
                  <h4 className="text-white font-bold text-lg mb-2">Hasta 5 abogados</h4>
                  <p className="text-[#f97316] font-semibold mb-1">Plan Firma en Crecimiento</p>
                  <p className="text-white/60 text-sm">Ideal para firmas independientes y pequeños equipos</p>
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-2">Hasta 10 abogados</h4>
                  <p className="text-[#3b82f6] font-semibold mb-1">Plan Consolidación Empresarial</p>
                  <p className="text-white/60 text-sm">Solución escalable para firmas en expansión</p>
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
              <h3 className="text-2xl font-bold text-white mb-6">Solicite Información</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Firm Name */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Nombre de la Firma</label>
                  <input
                    type="text"
                    name="firmName"
                    value={formData.firmName}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all"
                    placeholder="Tu firma jurídica"
                    required
                  />
                </div>

                {/* Founder Name */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Nombre del Socio Fundador</label>
                  <input
                    type="text"
                    name="founderName"
                    value={formData.founderName}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all"
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Correo Corporativo</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all"
                    placeholder="contacto@firma.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all"
                    placeholder="+57 (1) 2345 6789"
                    required
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all"
                    placeholder="Bogotá, Colombia"
                    required
                  />
                </div>

                {/* Plan Selector */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Plan de Interés</label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#3b82f6] focus:bg-white/[0.08] transition-all appearance-none cursor-pointer"
                  >
                    <option value="crecimiento" className="bg-[#0f172a]">Firma en Crecimiento</option>
                    <option value="consolidacion" className="bg-[#0f172a]">Consolidación Empresarial</option>
                  </select>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 relative inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#f97316] text-white font-bold text-sm overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                >
                  <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#f97316] opacity-30 blur-md group-hover:opacity-50 transition-opacity pointer-events-none" />
                  <span className="relative flex items-center justify-center">
                    SOLICITAR INFORMACIÓN
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </motion.button>

                {/* Helper Text */}
                <p className="text-xs text-white/50 text-center pt-3">
                  Un asesor especializado se pondrá en contacto para presentar la plataforma y validar requisitos de activación.
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
