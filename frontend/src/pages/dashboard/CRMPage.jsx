import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, Filter, Edit, Trash2, Mail, Phone, MapPin,
  Tag, FileText, MoreVertical, X, ChevronDown
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  new: { label: 'Nuevo', color: '#3b82f6' },
  contacted: { label: 'Contactado', color: '#f97316' },
  qualified: { label: 'Calificado', color: '#8b5cf6' },
  converted: { label: 'Convertido', color: '#10b981' },
};

export const CRMPage = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newLead, setNewLead] = useState({ client_name: '', client_email: '', client_phone: '', legal_area: 'Derecho Civil', status: 'new', description: '' });

  const loadLeads = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/leads/?lawyer_id=${user.id}`);
      setLeads(data);
    } catch (e) {
      console.error('Error cargando leads:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.client_name?.toLowerCase().includes(search.toLowerCase()) || l.client_email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || l.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/leads/`, { ...newLead, lawyer_id: user.id, source: 'dashboard' });
      setNewLead({ client_name: '', client_email: '', client_phone: '', legal_area: 'Derecho Civil', status: 'new', description: '' });
      setShowModal(false);
      loadLeads();
    } catch (e) {
      console.error('Error creando lead:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/leads/${id}`);
      setLeads(prev => prev.filter(l => l._id !== id));
    } catch (e) {
      console.error('Error eliminando lead:', e);
    }
  };

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

        {/* Loading State */}
        {loading && <div className="text-center py-8 text-white/50">Cargando leads...</div>}

        {/* Leads Table */}
        {!loading && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-xs uppercase text-white/60">
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 hidden md:table-cell">Contacto</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Área</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => {
                    const config = statusConfig[lead.status];
                    return (
                      <tr key={lead._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center font-bold text-sm">
                              {lead.client_name?.split(' ').map(n => n[0]).join('') || 'CL'}
                            </div>
                            <div>
                              <div className="font-medium">{lead.client_name}</div>
                              <div className="text-xs text-white/40 md:hidden">{lead.client_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="text-sm">{lead.client_email}</div>
                          <div className="text-xs text-white/40">{lead.client_phone}</div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm">{lead.legal_area}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${config.color}20`, color: config.color }}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid={`edit-lead-${lead._id}`}>
                              <Edit className="w-4 h-4 text-[#3b82f6]" />
                            </button>
                            <button onClick={() => handleDelete(lead._id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid={`delete-lead-${lead._id}`}>
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
        )}
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
              <Input placeholder="Nombre completo" value={newLead.client_name} onChange={(e) => setNewLead({ ...newLead, client_name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Email" type="email" value={newLead.client_email} onChange={(e) => setNewLead({ ...newLead, client_email: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Teléfono" value={newLead.client_phone} onChange={(e) => setNewLead({ ...newLead, client_phone: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <select value={newLead.legal_area} onChange={(e) => setNewLead({ ...newLead, legal_area: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                <option>Derecho Civil</option><option>Derecho Penal</option><option>Derecho Familiar</option>
                <option>Derecho Corporativo</option><option>Derecho Migratorio</option><option>Derecho Laboral</option>
              </select>
              <Textarea placeholder="Descripción del lead" value={newLead.description} onChange={(e) => setNewLead({ ...newLead, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Crear Cliente</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default CRMPage;
