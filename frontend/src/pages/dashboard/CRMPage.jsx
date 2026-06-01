import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Mail, Phone, MapPin,
  Tag, FileText, MoreVertical, X, ChevronDown
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const mockLeads = [
  { id: 1, name: 'María González', email: 'maria@ejemplo.com', phone: '+57 300 123 4567', status: 'new', area: 'Derecho Familiar', tag: 'Caliente', date: '2025-12-10' },
  { id: 2, name: 'Carlos Mendoza', email: 'carlos@ejemplo.com', phone: '+57 301 234 5678', status: 'contacted', area: 'Derecho Corporativo', tag: 'Tibio', date: '2025-12-09' },
  { id: 3, name: 'Ana Rodríguez', email: 'ana@ejemplo.com', phone: '+57 302 345 6789', status: 'qualified', area: 'Derecho Migratorio', tag: 'Caliente', date: '2025-12-08' },
  { id: 4, name: 'Luis Torres', email: 'luis@ejemplo.com', phone: '+57 303 456 7890', status: 'converted', area: 'Derecho Civil', tag: 'Convertido', date: '2025-12-07' },
];

const statusConfig = {
  new: { label: 'Nuevo', color: '#3b82f6' },
  contacted: { label: 'Contactado', color: '#f97316' },
  qualified: { label: 'Calificado', color: '#8b5cf6' },
  converted: { label: 'Convertido', color: '#10b981' },
};

export const CRMPage = () => {
  const [leads, setLeads] = useState(mockLeads);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', area: 'Derecho Civil', status: 'new', tag: 'Nuevo' });

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || l.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setLeads([...leads, { ...newLead, id: Date.now(), date: new Date().toISOString().split('T')[0] }]);
    setNewLead({ name: '', email: '', phone: '', area: 'Derecho Civil', status: 'new', tag: 'Nuevo' });
    setShowModal(false);
  };

  const handleDelete = (id) => setLeads(leads.filter(l => l.id !== id));

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">CRM Jurídico</h1>
            <p className="text-white/60">Gestión inteligente de clientes y oportunidades</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold" data-testid="add-lead-button">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = leads.filter(l => l.status === key).length;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10"
                style={{ borderColor: `${config.color}40` }}
              >
                <div className="text-xs text-white/60 uppercase">{config.label}</div>
                <div className="text-3xl font-bold mt-1" style={{ color: config.color }}>{count}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." className="bg-white/10 border-white/20 text-white pl-10" data-testid="search-lead" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white" data-testid="filter-status">
            <option value="all">Todos los estados</option>
            <option value="new">Nuevos</option>
            <option value="contacted">Contactados</option>
            <option value="qualified">Calificados</option>
            <option value="converted">Convertidos</option>
          </select>
        </div>

        {/* Leads Table */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-left text-xs uppercase text-white/60">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 hidden md:table-cell">Contacto</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Área</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 hidden md:table-cell">Etiqueta</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const config = statusConfig[lead.status];
                  return (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center font-bold text-sm">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-xs text-white/40 md:hidden">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm">{lead.email}</div>
                        <div className="text-xs text-white/40">{lead.phone}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm">{lead.area}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${config.color}20`, color: config.color }}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2 py-1 rounded-md text-xs bg-white/10 text-white/80">{lead.tag}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid={`edit-lead-${lead.id}`}>
                            <Edit className="w-4 h-4 text-[#3b82f6]" />
                          </button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid={`delete-lead-${lead.id}`}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Create Lead */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="Nombre completo" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Email" type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Teléfono" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <select value={newLead.area} onChange={(e) => setNewLead({ ...newLead, area: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                <option>Derecho Civil</option><option>Derecho Penal</option><option>Derecho Familiar</option>
                <option>Derecho Corporativo</option><option>Derecho Migratorio</option><option>Derecho Laboral</option>
              </select>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Crear Cliente</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default CRMPage;
