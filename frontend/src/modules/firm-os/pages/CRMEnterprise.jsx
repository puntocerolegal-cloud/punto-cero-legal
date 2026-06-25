import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Target, FileText, TrendingUp, Plus, Filter } from 'lucide-react';

export default function CRMEnterprise({ firmId }) {
  const [activeTab, setActiveTab] = useState('leads');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'leads', label: 'Leads', icon: Target, color: '#f97316' },
    { id: 'clients', label: 'Clientes', icon: Users, color: '#3b82f6' },
    { id: 'cases', label: 'Casos', icon: FileText, color: '#10b981' },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-white">CRM Empresarial</h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors">
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
        <p className="text-white/60">Gestiona leads, clientes, casos y tu pipeline comercial</p>
      </motion.div>

      {/* Search & Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3"
      >
        <div className="flex-1 relative">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, empresa, caso..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
          />
        </div>
        <button className="px-4 py-3 rounded-lg border border-white/10 text-white hover:bg-white/[0.05] transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
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
