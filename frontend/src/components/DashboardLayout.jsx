import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Scale, LayoutDashboard, Users, FolderKanban, BookOpen, Calendar,
  Brain, Video, Receipt, FileText, Settings, LogOut, Menu, X, Sparkles, Bell, CheckCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '@/config/api';

const NotificationBell = ({ userId }) => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`${API}/dashboard/notifications/${userId}`);
      setItems(data.notifications || []);
      setUnread(data.unread || 0);
    } catch (e) { /* silencioso */ }
  }, [userId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // sondea cada 30s → "tiempo real"
    return () => clearInterval(t);
  }, [load]);

  const markAllRead = async () => {
    try { await axios.post(`${API}/dashboard/notifications/${userId}/read-all`); setUnread(0); setItems(items.map(i => ({ ...i, read: true }))); }
    catch (e) { /* noop */ }
  };

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) load(); }} className="relative w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20" data-testid="notification-bell">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto z-50 bg-[#0f172a] border border-white/20 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#0f172a]">
                <span className="font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-[#f97316]" /> Notificaciones</span>
                {unread > 0 && <button onClick={markAllRead} className="text-xs text-[#3b82f6] hover:underline flex items-center gap-1"><CheckCheck className="w-3 h-3" /> Marcar leídas</button>}
              </div>
              <div className="divide-y divide-white/5">
                {items.length === 0 && <div className="p-6 text-center text-white/40 text-sm">Sin notificaciones</div>}
                {items.map(n => (
                  <div key={n._id} className={`p-3 ${n.read ? 'opacity-60' : 'bg-white/[0.03]'}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#f97316] mt-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{n.title}</div>
                        <div className="text-xs text-white/60">{n.message}</div>
                        <div className="text-[10px] text-white/30 mt-1">{(n.created_at || '').slice(0, 16).replace('T', ' ')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const menuItems = [
  { icon: LayoutDashboard, label: 'Inicio', path: '/dashboard' },
  { icon: Users, label: 'CRM Jurídico', path: '/dashboard/crm' },
  { icon: FolderKanban, label: 'Portal de Casos', path: '/dashboard/cases' },
  { icon: BookOpen, label: 'Directorio Clientes', path: '/dashboard/clients' },
  { icon: Calendar, label: 'Agenda Inteligente', path: '/dashboard/agenda' },
  { icon: Brain, label: 'IA Jurídica', path: '/dashboard/ai', highlight: true },
  { icon: Video, label: 'Sala de Conferencias', path: '/dashboard/meetings' },
  { icon: Receipt, label: 'Facturación', path: '/dashboard/invoices' },
  { icon: FileText, label: 'Documentos', path: '/dashboard/documents' },
  { icon: Settings, label: 'Configuración', path: '/dashboard/settings' },
];

export const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
        data-testid="sidebar-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-40 backdrop-blur-xl bg-[#0f172a]/95 border-r border-white/10 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-8 h-8 text-[#f97316]" />
              <span className="text-xl font-bold">Punto Cero Legal</span>
            </div>
            <div className="backdrop-blur-md bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 rounded-xl p-3 border border-[#f97316]/30">
              <div className="text-xs text-white/60 uppercase tracking-wider">Plan Profesional</div>
              <div className="font-semibold text-sm mt-1">{user?.full_name || 'Cargando...'}</div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs text-[#10b981]">Suscripción Activa</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === '/dashboard'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 text-white border border-[#f97316]/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`
                    }
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.highlight && (
                      <Sparkles className="w-3 h-3 text-[#f97316] ml-auto" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Campana de notificaciones (visible en todo el dashboard) */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell userId={user?.id} />
      </div>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 lg:p-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
