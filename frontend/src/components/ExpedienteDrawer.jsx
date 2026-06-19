import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FolderKanban, User, Scale, DollarSign, TrendingUp, FileText,
  Clock, Briefcase, CheckCircle2, Target, MessageCircle,
} from 'lucide-react';
import axios from 'axios';
import { API } from '@/config/api';
import { useCaseContext } from '../contexts/CaseContext';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const FOLDER_ICONS = {
  Contratos: '📄', Poderes: '🖋️', Demandas: '⚖️', Pruebas: '🔍',
  Audiencias: '🏛️', 'Facturación': '🧾', Comunicaciones: '💬', Otros: '📁',
};

/**
 * Drawer lateral del Expediente — Punto Cero Legal.
 * Consume GET /integration/expediente/{expediente_id} y muestra la inteligencia
 * completa del expediente (general, financiera, documental, actividad) sin salir
 * del módulo. No redirige ni abre página nueva.
 */
export function ExpedienteDrawer({ expedienteId, responsableName, open, onClose }) {
  const { select } = useCaseContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!expedienteId) return;
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/integration/expediente/${expedienteId}`);
      setData(res.data);
    } catch (e) {
      setError('No se pudo cargar el expediente.');
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => { if (open && expedienteId) load(); }, [open, expedienteId, load]);

  const fin = data?.indicators?.financial || {};
  const ind = data?.indicators || {};
  const rent = fin.rentabilidad || 0;
  const rentColor = rent >= 40 ? '#10b981' : rent >= 15 ? '#f59e0b' : '#ef4444';

  const trabajar = () => {
    if (!data) return;
    select({
      expediente_id: data.expediente_id, case_id: data.case_id,
      case_number: data.case_number, client_id: data.client?.id, client_name: data.client?.name,
    });
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[460px] z-[91] bg-[#0f172a] border-l border-white/10 overflow-y-auto"
            data-testid="expediente-drawer"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/10 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#06b6d4]" />
                <div>
                  <div className="font-bold text-sm">{data?.expediente_id || 'Expediente'}</div>
                  <div className="text-[11px] text-white/40">{data?.case_number}</div>
                </div>
              </div>
              <button onClick={onClose} data-testid="drawer-close" className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>

            {loading && <div className="p-8 text-center text-white/50 text-sm">Cargando expediente…</div>}
            {error && <div className="p-8 text-center text-red-300 text-sm">{error}</div>}

            {data && !loading && (
              <div className="p-5 space-y-6">
                {/* GENERAL */}
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> General</h3>
                  <div className="space-y-2 text-sm">
                    <Row icon={FolderKanban} label="Expediente" value={data.expediente_id} accent="#06b6d4" />
                    <Row icon={Scale} label="Caso" value={`${data.case_number} · ${data.title || ''}`} />
                    <Row icon={User} label="Cliente" value={data.client?.name || '—'} />
                    <Row icon={User} label="Responsable" value={responsableName || data.responsable_id || '—'} />
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 flex items-center gap-2"><Target className="w-4 h-4" /> Estado</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#10b981]/15 text-[#6ee7b7]">{data.estado || '—'}</span>
                    </div>
                  </div>
                </section>

                {/* FINANCIERA */}
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> Financiera</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Facturado" value={fmt(fin.ingresos_proyectados)} color="#3b82f6" />
                    <Stat label="Cobrado" value={fmt(fin.ingresos)} color="#10b981" />
                    <Stat label="Pendiente" value={fmt(fin.saldo_pendiente)} color="#f59e0b" />
                    <Stat label="Gastos" value={fmt(fin.gastos)} color="#ef4444" />
                    <Stat label="Utilidad" value={fmt(fin.utilidad)} color="#8b5cf6" />
                    <Stat label="Rentabilidad" value={`${rent}%`} color={rentColor} />
                  </div>
                  {/* Indicador visual de rentabilidad */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-white/40 mb-1"><span>Rentabilidad</span><span style={{ color: rentColor }}>{rent}%</span></div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(rent, 0), 100)}%`, background: rentColor }} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 text-[11px]">
                    <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">Pagadas: <b className="text-[#10b981]">{ind.facturas_pagadas ?? 0}</b></span>
                    <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">Pendientes: <b className="text-[#f59e0b]">{ind.facturas_pendientes ?? 0}</b></span>
                  </div>
                </section>

                {/* DOCUMENTAL */}
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Documental ({ind.documentos_cargados ?? 0})</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(data.folders || []).map((f) => (
                      <div key={f.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm">
                        <span className="flex items-center gap-2"><span>{FOLDER_ICONS[f.name] || '📁'}</span> {f.name}</span>
                        <span className="text-white/50 text-xs font-semibold">{f.count}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ACTIVIDAD */}
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Actividad</h3>
                  <div className="space-y-3 relative">
                    {(data.timeline || []).length === 0 && <div className="text-xs text-white/40">Sin actividad registrada.</div>}
                    {(data.timeline || []).map((t, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#06b6d4] mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{t.stage}</div>
                          {t.description && <div className="text-xs text-white/50">{t.description}</div>}
                          {t.date && <div className="text-[10px] text-white/30 mt-0.5">{new Date(t.date).toLocaleString('es-CO')}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* CONVERSACIÓN (chatbot WhatsApp) */}
                <section>
                  <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
                    <MessageCircle className="w-3.5 h-3.5" /> Conversación (WhatsApp)
                    {data.chat_status && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">{data.chat_status}</span>}
                  </h3>
                  {(data.conversacion || []).length === 0 ? (
                    <div className="text-xs text-white/40">Sin conversación registrada todavía.</div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {data.conversacion.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'client' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                            m.role === 'client'
                              ? 'bg-[#10b981]/15 border border-[#10b981]/30 text-[#d1fae5] rounded-br-sm'
                              : 'bg-white/5 border border-white/10 text-white/80 rounded-bl-sm'
                          }`}>
                            <div className="text-[9px] uppercase tracking-wider opacity-50 mb-0.5">{m.role === 'client' ? 'Cliente' : 'Bot'}</div>
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Próximos eventos */}
                {ind.proximo_evento && (
                  <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-4 py-3 text-sm text-[#fcd34d] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Próximo: {ind.proximo_evento.title} · {new Date(ind.proximo_evento.date).toLocaleDateString('es-CO')}
                  </div>
                )}

                <button onClick={trabajar} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white font-bold text-sm flex items-center justify-center gap-2" data-testid="drawer-set-context">
                  <CheckCircle2 className="w-4 h-4" /> Trabajar sobre este expediente
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const Row = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-white/50 flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
    <span className="font-medium text-right truncate max-w-[60%]" style={accent ? { color: accent } : undefined}>{value}</span>
  </div>
);

const Stat = ({ label, value, color }) => (
  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
    <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    <div className="text-base font-bold mt-0.5" style={{ color }}>{value}</div>
  </div>
);

export default ExpedienteDrawer;
