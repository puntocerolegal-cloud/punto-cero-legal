import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Shield, ArrowRight } from 'lucide-react';

export default function FirmsBlock({ onOpenRegistration }) {
  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Firmas, Bufetes y Despachos
          </h3>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            Gestiona tu firma jurídica dentro del ecosistema Punto Cero Legal con herramientas profesionales diseñadas para bufetes en crecimiento.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: Building2,
              title: 'Control Total',
              desc: 'Gestiona múltiples equipos, casos y flujos de trabajo centralizados'
            },
            {
              icon: Users,
              title: 'Equipo Integrado',
              desc: 'Colaboración en tiempo real entre abogados y personal administrativo'
            },
            {
              icon: Shield,
              title: 'Seguridad Garantizada',
              desc: 'Protección de datos con estándares internacionales de seguridad'
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all"
            >
              <feature.icon className="w-10 h-10 text-blue-500 mb-4" />
              <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
              <p className="text-white/60 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={onOpenRegistration}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all"
          >
            Registrar Mi Firma
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
