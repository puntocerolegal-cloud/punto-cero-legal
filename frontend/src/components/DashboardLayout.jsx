import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scale, LayoutDashboard, Users, FolderKanban, BookOpen, Calendar,
  Brain, Video, Receipt, FileText, Settings, LogOut, Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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
