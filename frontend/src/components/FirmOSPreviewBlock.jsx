import React from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowRight } from 'lucide-react';

export function FirmOSPreviewBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/60 transition-all duration-300"
    >
      <div className="flex items-start gap-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-600">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-2">Firm OS</h3>
          <p className="text-white/70 text-sm leading-relaxed mb-4">
            Sistema operativo especializado para gestión integral de firmas jurídicas. 
            Control total, escalabilidad empresarial y automatización avanzada.
          </p>
          
          <button className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:shadow-lg">
            Explorar Firm OS
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
