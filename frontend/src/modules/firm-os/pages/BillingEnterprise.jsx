import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, DollarSign, BarChart3, Download, Plus } from 'lucide-react';

export default function BillingEnterprise({ firmId }) {
  const [activeTab, setActiveTab] = useState('invoices');

  const tabs = [
    { id: 'invoices', label: 'Facturas', icon: FileText, color: '#3b82f6' },
    { id: 'collections', label: 'Cobros', icon: DollarSign, color: '#10b981' },
    { id: 'fees', label: 'Honorarios', icon: BarChart3, color: '#f97316' },
    { id: 'reports', label: 'Reportes', icon: Download, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-white">Facturación</h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors">
            <Plus className="w-4 h-4" />
            Nueva Factura
          </button>
        </div>
        <p className="text-white/60">Gestiona facturas, cobros, honorarios y reportes financieros</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Facturado', value: '$0', change: '+0%' },
          { label: 'Cobrado', value: '$0', change: '+0%' },
          { label: 'Pendiente', value: '$0', change: '0%' },
          { label: 'Tasa Cobranza', value: '0%', change: '0%' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-lg p-4"
          >
            <p className="text-white/60 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-green-400 text-xs mt-2">{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border-b border-white/10"
      >
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-all font-semibold whitespace-nowrap ${
                  isActive
                    ? 'border-b-[#3b82f6] text-[#3b82f6]'
                    : 'border-b-transparent text-white/60 hover:text-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-2xl p-8"
      >
        <div className="text-center py-12 text-white/60">
          <p>Módulo {tabs.find(t => t.id === activeTab)?.label} en desarrollo</p>
          <p className="text-sm mt-2">Las funcionalidades estarán disponibles próximamente</p>
        </div>
      </motion.div>
    </div>
  );
}
