import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Shield, CheckCircle, ArrowRight } from 'lucide-react';

export default function FirmsSection({ onOpen }) {
  return (
    <section id="firmas" className="relative py-24 px-6 overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#10b981]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3b82f6]/20 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-14"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#10b981]/20 to-[#3b82f6]/20 border border-[#10b981]/30 backdrop-blur-sm text-[#10b981] text-xs font-bold uppercase tracking-wider mb-6">
            ◆ Para Firmas Jurídicas
          </span>

          <h2 className="text-5xl lg:text-7xl font-bold mb-6 text-white">
            Firmas, Bufetes y <span className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent">Despachos</span>
          </h2>

          <p className="text-xl text-white/70 leading-relaxed mb-6">
            Soluciones integrales de gestión legal para tu organización. Automatiza procesos, centraliza operaciones y escala tu práctica legal sin limitaciones.
          </p>
        </motion.div>

        {/* Beneficios */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-12">
          {[
            {
              icon: Building2,
              title: 'CONTROL ORGANIZACIONAL',
              color: '#10b981',
              desc: 'Gestiona múltiples equipos, casos y flujos de trabajo en una plataforma centralizada'
            },
            {
              icon: Users,
              title: 'EQUIPO INTEGRADO',
              color: '#3b82f6',
              desc: 'Colaboración en tiempo real entre abogados, paralegales y personal administrativo'
            },
            {
              icon: Shield,
              title: 'SEGURIDAD LEGAL',
              color: '#f97316',
              desc: 'Protección de datos sensibles con cumplimiento normativo internacional'
            }
          ].map((benefit, i) => (
            <motion.div
              key={`firm-benefit-${benefit.title}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-3xl p-7 hover:bg-white/[0.07] hover:border-white/20"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border" style={{ background: `${benefit.color}1f`, borderColor: `${benefit.color}55` }}>
                <benefit.icon className="w-7 h-7" style={{ color: benefit.color }} />
              </div>
              <h3 className="text-white font-bold tracking-wide mb-2">{benefit.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Planes */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {[
            {
              title: 'Firma en Crecimiento',
              price: 'A medida',
              features: [
                'Hasta 5 usuarios',
                'Gestión de 50+ casos',
                'Comunicación interna',
                'Reportes básicos',
                'Soporte por email'
              ]
            },
            {
              title: 'Consolidación Empresarial',
              price: 'A medida',
              highlight: true,
              features: [
                'Usuarios ilimitados',
                'Casos ilimitados',
                'Automatizaciones avanzadas',
                'Integraciones personalizadas',
                'Consultoría exclusiva',
                'Soporte dedicado 24/7'
              ]
            }
          ].map((plan, i) => (
            <motion.div
              key={`firm-plan-${plan.title}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative backdrop-blur-xl border rounded-3xl p-8 ${
                plan.highlight
                  ? 'bg-gradient-to-br from-[#10b981]/20 to-[#3b82f6]/20 border-[#10b981]/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]'
                  : 'bg-white/[0.05] border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white px-4 py-1 rounded-full text-xs font-bold">
                  RECOMENDADO
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan.title}</h3>
              <p className="text-[#10b981] text-lg font-semibold mb-6">{plan.price}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-white/80">
                    <CheckCircle className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <motion.button
                onClick={onOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Solicitar Demo
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-10"
        >
          <p className="text-white/70 mb-6 leading-relaxed">
            ¿Tu firma necesita una solución integral de gestión legal? Contáctanos para conocer cómo podemos optimizar tus operaciones.
          </p>
          <motion.button
            onClick={onOpen}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex items-center px-10 py-5 rounded-2xl bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#3b82f6] text-white font-bold text-lg overflow-hidden group shadow-[0_0_40px_rgba(16,185,129,0.45)]"
          >
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#10b981] to-[#3b82f6] opacity-50 blur-md animate-pulse pointer-events-none" />
            <span className="relative flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              REGISTRAR MI FIRMA
            </span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
