import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, Edit, Trash2, X, FolderKanban,
  TrendingUp, Brain, Lightbulb, BarChart3, Receipt, Award, DollarSign
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { usePageActions } from '@/components/layout/DashboardActions';
import { useCaseContext } from '../../contexts/CaseContext';
import { ContextFilterChip } from '../../components/layout/ContextFilterChip';
import { CasesChart } from '@/shared/charts';
import { API } from '@/config/api';

const statusConfig = {
  new: { label: 'Nuevo', color: '#3b82f6' },
  contacted: { label: 'Contactado', color: '#f97316' },
  qualified: { label: 'Calificado', color: '#8b5cf6' },
  converted: { label: 'Convertido', color: '#10b981' },
};

export const CRMPage = () => {
  const { user } = useAuth();
  const { active } = useCaseContext();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newLead, setNewLead] = useState({ client_name: '', client_email: '', client_phone: '', legal_area: 'Derecho Civil', status: 'new', description: '' });
  const [report, setReport] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

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

  const loadReport = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/dashboard/crm-report/${user.id}`);
      setReport(data);
    } catch (e) { /* sin datos */ }
  }, [user?.id]);

  useEffect(() => { loadLeads(); loadReport(); }, [loadLeads, loadReport]);

  const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API}/leads/${editLead._id}`, { status: editLead.status, description: editLead.description });
      setEditLead(null);
      loadLeads();
    } catch (err) { alert('No se pudo actualizar el lead.'); }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.client_name?.toLowerCase().includes(search.toLowerCase()) || l.client_email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'all' || l.status === filterStatus;
    // Filtro por contexto global: cliente del expediente activo.
    const matchesContext = !active?.client_name || (l.client_name || '').trim().toLowerCase() === active.client_name.trim().toLowerCase();
    return matchesSearch && matchesFilter && matchesContext;
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

  // INTEGRACIÓN CRM → Caso: convierte el lead y crea su Biblioteca de Expediente.
  const convertToCase = async (lead) => {
    setBusyId(lead._id);
    try {
      const { data } = await axios.post(`${API}/leads/${lead._id}/convert`);
      setToast({ type: 'success', msg: `Caso ${data.case_number} creado · expediente con ${data.expediente_folders?.length || 5} carpetas` });
      loadLeads();
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.detail || 'No se pudo convertir el lead' });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  usePageActions({ onAdd: () => setShowModal(true) }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <ContextFilterChip />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">CRM Jurídico</h1>
            <p className="text-white/60">Gestión inteligente de clientes y oportunidades</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold" data-testid="add-lead-button">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
          </Button>
        </div>

        {/* Gráfico de rendimiento — leads por estado (métrica inmediata) */}
        <CasesChart
          title="Rendimiento · Leads por estado"
          data={Object.entries(statusConfig).map(([k, c]) => ({ label: c.label, value: leads.filter((l) => l.status === k).length, color: c.color }))}
        />

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

        {/* Centro de Inteligencia (CRM central) */}
        {report && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase"><Receipt className="w-4 h-4" /> Casos totales</div>
                <div className="text-3xl font-bold mt-1">{report.total_cases}</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase"><Users className="w-4 h-4" /> Clientes nuevos (mes)</div>
                <div className="text-3xl font-bold mt-1 text-[#3b82f6]">{report.new_clients_this_month}</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase"><Award className="w-4 h-4" /> Tasa de éxito</div>
                <div className="text-3xl font-bold mt-1 text-[#10b981]">{report.success_rate}%</div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase"><DollarSign className="w-4 h-4" /> Ingresos (6m)</div>
                <div className="text-2xl font-bold mt-1 text-[#f97316]">{fmt(report.income_by_month.reduce((s, m) => s + m.income, 0))}</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {/* Ingresos por mes */}
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#f97316]" /> Ingresos por mes</h3>
                <div className="flex items-end justify-between gap-2 h-32">
                  {report.income_by_month.map((m) => {
                    const max = Math.max(...report.income_by_month.map(x => x.income), 1);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-gradient-to-t from-[#f97316] to-[#fb923c] rounded-t" style={{ height: `${Math.max((m.income / max) * 100, 2)}%` }} title={fmt(m.income)} />
                        <div className="text-[9px] text-white/40">{m.month.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Casos por materia */}
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-[#3b82f6]" /> Casos por materia</h3>
                <div className="space-y-2">
                  {Object.entries(report.cases_by_materia).length === 0 && <div className="text-xs text-white/40">Sin casos aún.</div>}
                  {Object.entries(report.cases_by_materia).map(([k, v]) => {
                    const max = Math.max(...Object.values(report.cases_by_materia), 1);
                    return (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-0.5"><span>{k}</span><span className="text-white/50">{v}</span></div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#3b82f6]" style={{ width: `${(v / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Casos por estado */}
              <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-[#10b981]" /> Casos por estado</h3>
                <div className="space-y-2">
                  {Object.entries(report.cases_by_estado).length === 0 && <div className="text-xs text-white/40">Sin casos aún.</div>}
                  {Object.entries(report.cases_by_estado).map(([k, v]) => {
                    const max = Math.max(...Object.values(report.cases_by_estado), 1);
                    return (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-0.5"><span>{k}</span><span className="text-white/50">{v}</span></div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#10b981]" style={{ width: `${(v / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recomendaciones inteligentes */}
            {report.recommendations?.length > 0 && (
              <div className="backdrop-blur-xl bg-gradient-to-r from-[#f97316]/10 to-[#3b82f6]/10 rounded-2xl p-5 border border-[#f97316]/30">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#f97316]" /> Recomendaciones inteligentes</h3>
                <div className="space-y-2">
                  {report.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${r.priority === 'alta' ? 'bg-red-500/20 text-red-300' : r.priority === 'media' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>{r.priority}</span>
                      <span className="text-white/80">{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
                            {lead.status === 'converted' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#10b981] font-semibold px-2"><FolderKanban className="w-3.5 h-3.5" /> Caso creado</span>
                            ) : (
                              <button onClick={() => convertToCase(lead)} disabled={busyId === lead._id} title="Convertir a Caso"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#10b981]/30 bg-[#10b981]/10 text-[#6ee7b7] hover:bg-[#10b981]/20 disabled:opacity-40" data-testid={`convert-lead-${lead._id}`}>
                                <FolderKanban className="w-3.5 h-3.5" /> {busyId === lead._id ? 'Convirtiendo…' : 'Convertir a Caso'}
                              </button>
                            )}
                            <button onClick={() => setEditLead({ ...lead })} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" data-testid={`edit-lead-${lead._id}`}>
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

      {/* Modal Editar Lead */}
      {editLead && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditLead(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Editar · {editLead.client_name}</h2>
              <button onClick={() => setEditLead(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs text-white/50">Estado del lead</label>
                <select value={editLead.status} onChange={(e) => setEditLead({ ...editLead, status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k} className="bg-[#0f172a]">{v.label}</option>)}
                </select>
              </div>
              <Textarea placeholder="Descripción / notas" value={editLead.description || ''} onChange={(e) => setEditLead({ ...editLead, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold">Guardar</Button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-2xl border text-sm font-semibold backdrop-blur-md ${
          toast.type === 'success' ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#6ee7b7]' : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#fca5a5]'
        }`} data-testid="crm-toast">
          {toast.msg}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CRMPage;
