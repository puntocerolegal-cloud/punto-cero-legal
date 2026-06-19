import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import axios from 'axios';
import { API } from '@/config/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Campana de notificaciones del header — Punto Cero Legal.
 * Contador dinámico de no leídas, lista desplegable y modal de detalle al hacer
 * clic. Lee /dashboard/notifications/{id} (mismas notificaciones que genera el
 * organismo: caso nuevo, documento, audiencia, factura, pago, etc.).
 */
export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/dashboard/notifications/${user.id}`);
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (e) { /* sin datos */ }
  }, [user?.id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);   // refresco dinámico cada 60s
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const openDetail = async (n) => {
    if (!n.read) {
      try { await axios.post(`${API}/dashboard/notifications/${n._id}/read`); } catch (e) { /* */ }
    }
    setSelected(n);
    setOpen(false);
    load();
  };

  const markAll = async () => {
    try { await axios.post(`${API}/dashboard/notifications/${user.id}/read-all`); } catch (e) { /* */ }
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones" data-testid="notif-bell"
        className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
        <Bell className="w-4 h-4 text-white/70" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#ef4444] text-[10px] font-bold flex items-center justify-center" data-testid="notif-count">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl z-[70]" data-testid="notif-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-[#0f172a]">
            <span className="font-bold text-sm">Notificaciones</span>
            {unread > 0 && <button onClick={markAll} className="text-[11px] text-[#f97316] hover:underline">Marcar todo leído</button>}
          </div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-white/40 text-sm">Sin notificaciones</div>
          ) : items.map((n) => (
            <button key={n._id} onClick={() => openDetail(n)}
              className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-white/[0.03]' : ''}`}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#f97316] mt-1.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="text-xs text-white/50 truncate">{n.message}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)} data-testid="notif-modal">
          <div className="bg-[#0f172a] border border-white/20 rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg pr-4">{selected.title}</h3>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-white/70 whitespace-pre-line">{selected.message}</p>
            {selected.created_at && (
              <div className="text-xs text-white/40 mt-4">{new Date(selected.created_at).toLocaleString('es-CO')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
