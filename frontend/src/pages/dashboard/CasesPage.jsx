import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Plus, LayoutGrid, List, Calendar, Clock, AlertTriangle, CheckCircle2, FileText, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const initialCases = [
  { id: 1, number: 'CASO-2025-A3B7D', title: 'Divorcio Express - González', client: 'María González', area: 'Familiar', status: 'open', priority: 'high', deadline: '2025-12-25', progress: 30 },
  { id: 2, number: 'CASO-2025-X8C9E', title: 'Visa de Trabajo - EE.UU.', client: 'Carlos Mendoza', area: 'Migratorio', status: 'in_progress', priority: 'urgent', deadline: '2025-12-20', progress: 65 },
  { id: 3, number: 'CASO-2025-K2M4F', title: 'Constitución de Empresa', client: 'Luis Torres', area: 'Corporativo', status: 'in_progress', priority: 'medium', deadline: '2026-01-15', progress: 45 },
  { id: 4, number: 'CASO-2025-P5Q1G', title: 'Indemnización Laboral', client: 'Ana Rodríguez', area: 'Laboral', status: 'closed', priority: 'low', deadline: '2025-11-30', progress: 100 },
];

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
  const [cases, setCases] = useState(initialCases);
  const [view, setView] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', client: '', area: 'Civil', status: 'open', priority: 'medium', deadline: '' });

  const handleCreate = (e) => {
    e.preventDefault();
    const id = Date.now();
    setCases([...cases, { ...newCase, id, number: `CASO-2025-${id.toString().slice(-5).toUpperCase()}`, progress: 0 }]);
    setNewCase({ title: '', client: '', area: 'Civil', status: 'open', priority: 'medium', deadline: '' });
    setShowModal(false);
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

        {view === 'kanban' ? (
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
                      <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                        <div className="text-xs text-[#f97316] font-bold mb-1">{c.number}</div>
                        <div className="font-semibold mb-2">{c.title}</div>
                        <div className="text-xs text-white/60 mb-3">{c.client}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="px-2 py-0.5 rounded-md font-semibold" style={{ background: `${priorityConfig[c.priority].color}20`, color: priorityConfig[c.priority].color }}>
                            {priorityConfig[c.priority].label}
                          </span>
                          <div className="flex items-center gap-1 text-white/60">
                            <Calendar className="w-3 h-3" /> {c.deadline}
                          </div>
                        </div>
                        <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fb923c]" style={{ width: `${c.progress}%` }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
                    <th className="px-4 py-3">Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="text-xs text-[#f97316] font-bold">{c.number}</div>
                        <div className="font-medium">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.client}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${statusConfig[c.status].color}20`, color: statusConfig[c.status].color }}>
                          {statusConfig[c.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${priorityConfig[c.priority].color}20`, color: priorityConfig[c.priority].color }}>
                          {priorityConfig[c.priority].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.deadline}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fb923c]" style={{ width: `${c.progress}%` }} />
                          </div>
                          <span className="text-xs">{c.progress}%</span>
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nuevo Caso</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="Título del caso" value={newCase.title} onChange={(e) => setNewCase({ ...newCase, title: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Cliente" value={newCase.client} onChange={(e) => setNewCase({ ...newCase, client: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <select value={newCase.priority} onChange={(e) => setNewCase({ ...newCase, priority: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                <option value="low">Prioridad Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option>
              </select>
              <Input type="date" value={newCase.deadline} onChange={(e) => setNewCase({ ...newCase, deadline: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Crear Caso</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default CasesPage;
