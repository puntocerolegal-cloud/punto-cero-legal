import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X, Calendar, Receipt, FolderKanban, FileWarning } from 'lucide-react';
import axios from 'axios';
import { API } from '@/config/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Alertas del header — Punto Cero Legal.
 * Área de alertas operativas (facturas vencidas, audiencias próximas, casos sin
 * movimiento, documentos faltantes). Clicables → modal de detalle.
 * Consume GET /dashboard/alerts/{lawyer_id}.
 */
const TONE = {
  high: { color: '#ef4444', bg: 'bg-[#ef4444]/15', border: 'border-[#ef4444]/40', text: 'text-[#fca5a5]' },
  medium: { color: '#f59e0b', bg: 'bg-[#f59e0b]/15', border: 'border-[#f59e0b]/40', text: 'text-[#fcd34d]' },
  low: { color: '#3b82f6', bg: 'bg-[#3b82f6]/15', border: 'border-[#3b82f6]/40', text: 'text-[#93c5fd]' },
};
const ICON_BY_TYPE = { invoice: Receipt, hearing: Calendar, case: FolderKanban, document: FileWarning };

export function HeaderAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/dashboard/alerts/${user.id}`);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (e) { /* sin datos */ }
  }, [user?.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const count = alerts.length;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Alertas" data-testid="header-alerts"
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
        <AlertTriangle className="w-4 h-4 text-white/70" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#f59e0b] text-[10px] font-bold flex items-center justify-center text-black" data-testid="alerts-count">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl z-[70]" data-testid="alerts-panel">
          <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f172a] font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#f59e0b]" /> Alertas
          </div>
          {count === 0 ? (
            <div className="p-6 text-center text-white/40 text-sm">Sin alertas. Todo al día.</div>
          ) : alerts.map((a, i) => {
            const tone = TONE[a.priority] || TONE.low;
            const Icon = ICON_BY_TYPE[a.type] || AlertTriangle;
            return (
              <button key={i} onClick={() => { setSelected(a); setOpen(false); }}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors`}>
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: tone.color }} />
                  <span className="text-sm text-white/80">{a.message}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)} data-testid="alert-modal">
          <div className="bg-[#0f172a] border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" style={{ color: (TONE[selected.priority] || TONE.low).color }} /> Alerta
              </h3>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-white/80">{selected.message}</p>
            <div className="text-xs text-white/40 mt-3 capitalize">Prioridad: {selected.priority || 'normal'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeaderAlerts;
