import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Clock, Calendar, Video, Receipt, FileText, Gavel, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { API } from '@/config/api';

const statusLabels = {
  open: { label: 'Abierto', color: '#3b82f6' },
  in_progress: { label: 'En Proceso', color: '#f97316' },
  closed: { label: 'Cerrado', color: '#10b981' },
  archived: { label: 'Archivado', color: '#6b7280' },
};

const eventIcon = {
  case: FolderKanban,
  activity: FileText,
  appointment: Calendar,
  meeting: Video,
  invoice: Receipt,
};

const eventColor = {
  case: '#3b82f6',
  activity: '#8b5cf6',
  appointment: '#f97316',
  meeting: '#10b981',
  invoice: '#ec4899',
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return iso;
  }
};

export const PortalPage = () => {
  const { user, logout } = useAuth();
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const loadCases = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/portal/cases?client_id=${user.id}`);
      setCases(data);
      if (data.length > 0) setSelected(data[0]);
    } catch (e) {
      console.error('Error cargando casos:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const loadTimeline = useCallback(async () => {
    if (!selected?._id) return;
    setLoadingTimeline(true);
    try {
      const { data } = await axios.get(`${API}/portal/timeline/${selected._id}?client_id=${user.id}`);
      setTimeline(data.events || []);
    } catch (e) {
      console.error('Error cargando línea de tiempo:', e);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  }, [selected?._id, user?.id]);

  useEffect(() => { loadTimeline(); }, [loadTimeline]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center font-bold">PC</div>
            <div>
              <div className="font-bold">Portal del Cliente</div>
              <div className="text-xs text-white/50">{user?.full_name || 'Cliente'}</div>
            </div>
          </div>
          <Button onClick={logout} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Seguimiento de tus casos</h1>
          <p className="text-white/60 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#10b981]" /> Información confidencial protegida</p>
        </div>

        {loading && <div className="text-center py-12 text-white/50">Cargando tus casos...</div>}
        {!loading && cases.length === 0 && (
          <div className="text-center py-16 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <div className="text-white/60">Aún no tienes casos registrados.</div>
            <div className="text-sm text-white/40 mt-1">Tu abogado te notificará cuando haya novedades.</div>
          </div>
        )}

        {!loading && cases.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Lista de casos */}
            <div className="space-y-3">
              <h2 className="text-sm uppercase tracking-wider text-white/40 px-1">Mis Casos</h2>
              {cases.map((c) => {
                const st = statusLabels[c.status] || statusLabels.open;
                const active = selected?._id === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${active ? 'border-[#f97316]/40 bg-[#f97316]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    data-testid={`portal-case-${c._id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-[#f97316]">{c.case_number}</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: `${st.color}20`, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-xs text-white/50 mt-1 flex items-center gap-2">
                      <Gavel className="w-3 h-3" /> {c.legal_area || 'General'}
                      {c.lawyer_name && <span className="text-white/30">· {c.lawyer_name}</span>}
                    </div>
                    <div className="flex items-center text-xs text-[#f97316] mt-2"><ChevronRight className="w-3 h-3" /> Ver línea de tiempo</div>
                  </button>
                );
              })}
            </div>

            {/* Línea de tiempo */}
            <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Clock className="w-5 h-5 text-[#f97316]" /> Línea de tiempo</h2>
              <p className="text-sm text-white/50 mb-6">{selected?.title}</p>

              {loadingTimeline && <div className="text-center py-8 text-white/50">Cargando...</div>}
              {!loadingTimeline && timeline.length === 0 && <div className="text-center py-8 text-white/40">Sin eventos registrados todavía.</div>}

              <div className="relative">
                {timeline.map((ev, i) => {
                  const Icon = eventIcon[ev.type] || FileText;
                  const color = eventColor[ev.type] || '#3b82f6';
                  return (
                    <motion.div
                      key={`${ev.type}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-4 pb-6 relative"
                    >
                      {i < timeline.length - 1 && <div className="absolute left-[19px] top-10 bottom-0 w-px bg-white/10" />}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: `${color}20`, color }}>{ev.category}</span>
                          <span className="text-xs text-white/40">{fmtDate(ev.date)}</span>
                        </div>
                        <div className="font-medium mt-1">{ev.title}</div>
                        {ev.description && <div className="text-sm text-white/50">{ev.description}</div>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PortalPage;
