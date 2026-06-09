import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, LayoutGrid, List, Calendar, Clock, AlertTriangle, CheckCircle2, FileText, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '@/config/api';

const statusConfig = {
  open: { label: 'Abierto', color: '#3b82f6' },
  in_progress: { label: 'En Proceso', color: '#f97316' },
  closed: { label: 'Cerrado', color: '#10b981' },
  archived: { label: 'Archivado', color: '#6b7280' },
};

const priorityConfig = {
  low: { label: 'Baja', color: '#10b981' },
  medium: { label: 'Media', color: '#f97316' },
  high: { label: 'Alta', color: '#ec4899' },
  urgent: { label: 'Urgente', color: '#ef4444' },
};

export const CasesPage = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState(null);
  const emptyCase = {
    title: '', client_name: '', client_document: '', client_phone: '', client_email: '',
    materia: 'Civil', estado: 'Activo', priority_label: 'media', counterparty_name: '',
    assigned_to: '', deadline: '', summary: '',
  };
  const [newCase, setNewCase] = useState(emptyCase);

  const MATERIAS = ['Civil', 'Penal', 'Laboral', 'Familia', 'Mercantil', 'Administrativo', 'Constitucional', 'Otro'];
  const ESTADOS = ['Pendiente', 'En trámite', 'En audiencia', 'Archivada', 'Finalizada', 'En estudio', 'Activo'];

  const loadCases = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/cases/?lawyer_id=${user.id}`);
      setCases(data);
    } catch (e) {
      console.error('Error cargando casos:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateResult(null);
    try {
      const { data } = await axios.post(`${API}/cases/`, {
        ...newCase,
        lawyer_id: user.id,
        legal_area: newCase.materia,
        description: newCase.summary || newCase.title,
        deadline: newCase.deadline ? new Date(newCase.deadline).toISOString() : null,
        source: 'manual',
      });
      setCreateResult({ case_number: data.case_number, conflict: data.conflict });
      setNewCase(emptyCase);
      loadCases();
    } catch (err) {
      console.error('Error creando caso:', err);
      alert('No se pudo crear el caso.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Portal de Casos</h1>
            <p className="text-white/60">Gestión integral de expedientes legales</p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
              <button onClick={() => setView('kanban')} className={`p-2 rounded-lg ${view === 'kanban' ? 'bg-white/10' : ''}`} data-testid="view-kanban">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('table')} className={`p-2 rounded-lg ${view === 'table' ? 'bg-white/10' : ''}`} data-testid="view-table">
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="add-case-button">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Caso
            </Button>
          </div>
        </div>

        {loading && <div className="text-center py-8 text-white/50">Cargando casos...</div>}

        {!loading && view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Object.entries(statusConfig).map(([key, config]) => {
              const items = cases.filter(c => c.status === key);
              return (
                <div key={key} className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: config.color }} />
                      <h3 className="font-bold">{config.label}</h3>
                    </div>
                    <span className="text-xs text-white/60">{items.length}</span>
                  </div>
                  <div className="space-y-3">
                    {items.map(c => (
                      <motion.div key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                        <div className="text-xs text-[#f97316] font-bold mb-1">{c.case_number}</div>
                        <div className="font-semibold mb-2">{c.title}</div>
                        <div className="text-xs text-white/60 mb-3">{c.client_name}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-md font-semibold" style={{ background: `${priorityConfig[c.priority]?.color || '#f97316'}20`, color: priorityConfig[c.priority]?.color || '#f97316' }}>
                            {priorityConfig[c.priority]?.label || 'Media'}
                          </span>
                          <div className="flex items-center gap-1 text-white/60">
                            <Calendar className="w-3 h-3" /> {c.deadline || 'S/F'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && (
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-xs uppercase text-white/60">
                    <th className="px-4 py-3">Expediente</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c._id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="text-xs text-[#f97316] font-bold">{c.case_number}</div>
                        <div className="font-medium">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.client_name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${statusConfig[c.status].color}20`, color: statusConfig[c.status].color }}>
                          {statusConfig[c.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${priorityConfig[c.priority]?.color || '#f97316'}20`, color: priorityConfig[c.priority]?.color || '#f97316' }}>
                          {priorityConfig[c.priority]?.label || 'Media'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.deadline || 'S/F'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setShowModal(false); setCreateResult(null); }}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nuevo Caso · Intake</h2>
              <button onClick={() => { setShowModal(false); setCreateResult(null); }}><X className="w-5 h-5" /></button>
            </div>

            {createResult ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-[#10b981]/10 border border-[#10b981]/40 p-5 text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#10b981] mx-auto mb-2" />
                  <div className="font-bold text-lg">Caso creado</div>
                  <div className="text-sm text-white/60">Identificador único: <span className="font-mono text-[#f97316]">{createResult.case_number}</span></div>
                  <div className="text-xs text-white/50 mt-2">Se actualizó el directorio de clientes, la agenda y el CRM automáticamente.</div>
                </div>
                {createResult.conflict?.conflict && (
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/40 p-4 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-200">{createResult.conflict.message}</div>
                  </div>
                )}
                <Button onClick={() => { setShowModal(false); setCreateResult(null); }} className="w-full bg-white/10 hover:bg-white/20">Cerrar</Button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <Input placeholder="Título del caso" value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })} required className="bg-white/10 border-white/20 text-white" />

                <div className="text-xs uppercase tracking-wider text-white/40">Datos del cliente</div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Nombre completo" value={newCase.client_name} onChange={(e) => setNewCase({ ...newCase, client_name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                  <Input placeholder="Identificación / cédula" value={newCase.client_document} onChange={(e) => setNewCase({ ...newCase, client_document: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                  <Input placeholder="Teléfono" value={newCase.client_phone} onChange={(e) => setNewCase({ ...newCase, client_phone: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                  <Input type="email" placeholder="Correo" value={newCase.client_email} onChange={(e) => setNewCase({ ...newCase, client_email: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                </div>

                <div className="text-xs uppercase tracking-wider text-white/40">Clasificación</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-white/50">Materia</label>
                    <select value={newCase.materia} onChange={(e) => setNewCase({ ...newCase, materia: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                      {MATERIAS.map(m => <option key={m} value={m} className="bg-[#0f172a]">{m}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-white/50">Estado</label>
                    <select value={newCase.estado} onChange={(e) => setNewCase({ ...newCase, estado: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                      {ESTADOS.map(s => <option key={s} value={s} className="bg-[#0f172a]">{s}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs text-white/50">Prioridad (auto si se deja)</label>
                    <select value={newCase.priority_label} onChange={(e) => setNewCase({ ...newCase, priority_label: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                      <option value="">Automática</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
                    </select>
                  </div>
                  <div><label className="text-xs text-white/50">Fecha clave / vencimiento</label>
                    <Input type="date" value={newCase.deadline} onChange={(e) => setNewCase({ ...newCase, deadline: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                  </div>
                </div>

                <Input placeholder="Contraparte (se verifica conflicto de intereses)" value={newCase.counterparty_name} onChange={(e) => setNewCase({ ...newCase, counterparty_name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                <Input placeholder="Asignado a (otro abogado, opcional)" value={newCase.assigned_to} onChange={(e) => setNewCase({ ...newCase, assigned_to: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                <Textarea placeholder="Resumen de los hechos" value={newCase.summary} onChange={(e) => setNewCase({ ...newCase, summary: e.target.value })} className="bg-white/10 border-white/20 text-white" />

                <Button type="submit" disabled={creating} className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">
                  {creating ? 'Creando…' : 'Crear Caso'}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default CasesPage;
