import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, LayoutGrid, List, Calendar, Clock, AlertTriangle, CheckCircle2, FileText, X, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { usePageActions } from '@/components/layout/DashboardActions';
import { ExpedienteDrawer } from '../../components/ExpedienteDrawer';
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

// Estados maestros de producción (control directo del abogado, persiste en BD).
const MASTER_STATES = [
  { value: 'Activo', label: 'Activo', color: '#10b981' },
  { value: 'En seguimiento', label: 'En Seguimiento', color: '#3b82f6' },
  { value: 'Archivada', label: 'Archivado', color: '#6b7280' },
];

export const CasesPage = () => {
  const { user } = useAuth();
  // Motor de entitlements (hook en el cuerpo del componente; guardia en el handler).
  const { requirePerform } = useEntitlement();
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
    valor_servicio: '', abono_inicial: '', forma_pago: 'Transferencia',
  };
  const [newCase, setNewCase] = useState(emptyCase);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [drawer, setDrawer] = useState({ open: false, expedienteId: null, responsable: null });

  const MATERIAS = ['Civil', 'Penal', 'Laboral', 'Familia', 'Mercantil', 'Administrativo', 'Constitucional', 'Otro'];
  const ESTADOS = ['Pendiente', 'En trámite', 'En audiencia', 'Archivada', 'Finalizada', 'En estudio', 'Activo', 'En seguimiento'];

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

  // ActionBar global → "+ Agregar" abre el modal de nuevo caso.
  usePageActions({ onAdd: () => setShowModal(true) }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    // Guardia de cuota (feature "cases"). Valida el conteo actual contra el
    // plan/Demo; sin cupo, requirePerform abre el UpgradeModal y detenemos aquí.
    if (!requirePerform('cases', cases.length)) return;
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
      // Conexión Intake → Expediente: alimenta el centro financiero con facturas
      // (usa el endpoint /invoices existente; lo recalcula la vista del expediente).
      const valor = parseFloat(newCase.valor_servicio) || 0;
      const abono = parseFloat(newCase.abono_inicial) || 0;
      if (valor > 0 && data?._id) {
        const base = { lawyer_id: user.id, case_id: data._id, client_id: data.client_id || null, client_name: newCase.client_name || 'Cliente' };
        const remaining = valor - abono;
        try {
          if (abono > 0 && remaining > 0) {
            await axios.post(`${API}/invoices/`, { ...base, amount: remaining, status: 'sent', description: `Honorarios · ${newCase.materia}` });
            await axios.post(`${API}/invoices/`, { ...base, amount: abono, status: 'paid', description: `Abono inicial · ${newCase.forma_pago}` });
          } else if (abono > 0) {
            await axios.post(`${API}/invoices/`, { ...base, amount: valor, status: 'paid', description: `Pago total · ${newCase.forma_pago}` });
          } else {
            await axios.post(`${API}/invoices/`, { ...base, amount: valor, status: 'sent', description: `Honorarios · ${newCase.materia}` });
          }
        } catch (e) { /* no romper la creación del caso si falla la facturación */ }
      }
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

  // Estado maestro → cambio persistente (refleja en producción/rentabilidad global).
  const changeEstado = useCallback(async (caseId, estado) => {
    setBusyId(caseId);
    try {
      await axios.patch(`${API}/cases/${caseId}`, { estado, user_id: user?.id });
      setToast({ type: 'success', msg: `Estado actualizado a «${estado}»` });
      await loadCases();
    } catch (e) {
      setToast({ type: 'error', msg: 'No se pudo actualizar el estado' });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 2500);
    }
  }, [loadCases, user?.id]);

  // Eliminar caso (persistente; el backend bloquea si hay facturas pendientes).
  const deleteCase = useCallback(async (caseId, label) => {
    if (!window.confirm(`¿Eliminar el caso ${label}? Esta acción es permanente.`)) return;
    setBusyId(caseId);
    try {
      await axios.delete(`${API}/cases/${caseId}`);
      setToast({ type: 'success', msg: 'Caso eliminado' });
      await loadCases();
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.detail || 'No se pudo eliminar' });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 2500);
    }
  }, [loadCases]);

  // Aceptar caso asignado → pasa a casos activos (persistente).
  const acceptCase = useCallback(async (caseId) => {
    setBusyId(caseId);
    try {
      await axios.post(`${API}/cases/${caseId}/accept`);
      setToast({ type: 'success', msg: 'Caso aceptado · ahora está en tus casos activos' });
      await loadCases();
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.detail || 'No se pudo aceptar el caso' });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 2800);
    }
  }, [loadCases]);

  // Declinar caso → se libera y vuelve al administrador para reasignación.
  const declineCase = useCallback(async (caseId, label) => {
    const reason = window.prompt(`Motivo para declinar el caso ${label} (opcional):`);
    if (reason === null) return; // canceló el prompt
    setBusyId(caseId);
    try {
      await axios.post(`${API}/cases/${caseId}/decline`, { reason });
      setToast({ type: 'success', msg: 'Caso declinado · devuelto al administrador' });
      await loadCases();
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.detail || 'No se pudo declinar el caso' });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 2800);
    }
  }, [loadCases]);

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
                        <div className="font-semibold mb-1">{c.title}</div>
                        {c.expediente_id && <div className="text-[10px] text-[#06b6d4] font-mono mb-1">{c.expediente_id}</div>}
                        <div className="text-xs text-white/60 mb-3">{c.client_name}</div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="px-2 py-0.5 rounded-md font-semibold" style={{ background: `${priorityConfig[c.priority]?.color || '#f97316'}20`, color: priorityConfig[c.priority]?.color || '#f97316' }}>
                            {priorityConfig[c.priority]?.label || 'Media'}
                          </span>
                          <div className="flex items-center gap-1 text-white/60">
                            <Calendar className="w-3 h-3" /> {c.deadline || 'S/F'}
                          </div>
                        </div>
                        {c.acceptance_status === 'pending' && (
                          <div className="mb-2 grid grid-cols-2 gap-1.5">
                            <button onClick={() => acceptCase(c._id)} disabled={busyId === c._id}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#10b981]/15 border border-[#10b981]/40 text-[#6ee7b7] hover:bg-[#10b981]/25 disabled:opacity-40"
                              data-testid={`accept-case-${c._id}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aceptar
                            </button>
                            <button onClick={() => declineCase(c._id, c.case_number)} disabled={busyId === c._id}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#fca5a5] hover:bg-[#ef4444]/25 disabled:opacity-40"
                              data-testid={`decline-case-${c._id}`}>
                              <X className="w-3.5 h-3.5" /> Declinar
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setDrawer({ open: true, expedienteId: c.expediente_id, responsable: c.lawyer_name || user?.full_name })}
                          disabled={!c.expediente_id}
                          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#67e8f9] hover:bg-[#06b6d4]/20 disabled:opacity-40"
                          data-testid={`ver-expediente-kanban-${c._id}`}>
                          <FolderKanban className="w-3.5 h-3.5" /> Ver Expediente
                        </button>
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
                    <th className="px-4 py-3 text-right">Estado maestro</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c._id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="text-xs text-[#f97316] font-bold">{c.case_number}</div>
                        <div className="font-medium">{c.title}</div>
                        {c.expediente_id && <div className="text-[11px] text-[#06b6d4] font-mono mt-0.5">{c.expediente_id}</div>}
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          {c.acceptance_status === 'pending' && (
                            <>
                              <button onClick={() => acceptCase(c._id)} disabled={busyId === c._id} title="Aceptar caso"
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#10b981]/15 border border-[#10b981]/40 text-[#6ee7b7] hover:bg-[#10b981]/25 disabled:opacity-40" data-testid={`accept-case-row-${c._id}`}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> Aceptar
                              </button>
                              <button onClick={() => declineCase(c._id, c.case_number)} disabled={busyId === c._id} title="Declinar caso"
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#fca5a5] hover:bg-[#ef4444]/25 disabled:opacity-40" data-testid={`decline-case-row-${c._id}`}>
                                <X className="w-3.5 h-3.5" /> Declinar
                              </button>
                            </>
                          )}
                          <select
                            value={MASTER_STATES.some(s => s.value === c.estado) ? c.estado : (c.estado || 'Activo')}
                            disabled={busyId === c._id}
                            onChange={(e) => changeEstado(c._id, e.target.value)}
                            className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-[#f97316]/50 disabled:opacity-40"
                            data-testid={`master-state-${c._id}`}
                          >
                            {!MASTER_STATES.some(s => s.value === c.estado) && c.estado && (
                              <option value={c.estado} className="bg-[#0f172a]">{c.estado}</option>
                            )}
                            {MASTER_STATES.map(s => <option key={s.value} value={s.value} className="bg-[#0f172a]">{s.label}</option>)}
                          </select>
                          <button
                            onClick={() => setDrawer({ open: true, expedienteId: c.expediente_id, responsable: c.lawyer_name || user?.full_name })}
                            disabled={!c.expediente_id}
                            title="Ver Expediente"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[#06b6d4]/30 bg-[#06b6d4]/10 text-[#67e8f9] hover:bg-[#06b6d4]/20 disabled:opacity-40" data-testid={`ver-expediente-${c._id}`}>
                            <FolderKanban className="w-3.5 h-3.5" /> Ver Expediente
                          </button>
                          <button onClick={() => deleteCase(c._id, c.case_number)} disabled={busyId === c._id} title="Eliminar caso"
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 disabled:opacity-40 disabled:cursor-not-allowed" data-testid={`delete-case-${c._id}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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

                <div className="text-xs uppercase tracking-wider text-white/40">Honorarios y pago (alimenta el expediente)</div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs text-white/50">Valor del servicio</label>
                    <Input type="number" min="0" placeholder="0" value={newCase.valor_servicio} onChange={(e) => setNewCase({ ...newCase, valor_servicio: e.target.value })} className="bg-white/10 border-white/20 text-white" data-testid="case-valor" />
                  </div>
                  <div><label className="text-xs text-white/50">Abono inicial</label>
                    <Input type="number" min="0" placeholder="0" value={newCase.abono_inicial} onChange={(e) => setNewCase({ ...newCase, abono_inicial: e.target.value })} className="bg-white/10 border-white/20 text-white" data-testid="case-abono" />
                  </div>
                  <div><label className="text-xs text-white/50">Forma de pago</label>
                    <select value={newCase.forma_pago} onChange={(e) => setNewCase({ ...newCase, forma_pago: e.target.value })} className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white" data-testid="case-forma-pago">
                      <option className="bg-[#0f172a]">Transferencia</option><option className="bg-[#0f172a]">Efectivo</option>
                      <option className="bg-[#0f172a]">Tarjeta</option><option className="bg-[#0f172a]">MercadoPago</option><option className="bg-[#0f172a]">Otro</option>
                    </select>
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

      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-4 py-3 rounded-2xl border text-sm font-semibold backdrop-blur-md ${
          toast.type === 'success' ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#6ee7b7]' : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#fca5a5]'
        }`} data-testid="cases-toast">
          {toast.msg}
        </div>
      )}

      <ExpedienteDrawer
        open={drawer.open}
        expedienteId={drawer.expedienteId}
        responsableName={drawer.responsable}
        onClose={() => setDrawer({ open: false, expedienteId: null, responsable: null })}
      />
    </DashboardLayout>
  );
};

export default CasesPage;
