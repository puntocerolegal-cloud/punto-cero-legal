import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, BookOpen, Calendar,
  Brain, Video, Receipt, FileText, Settings, LogOut, Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useCaseContext } from '../contexts/CaseContext';
import { NotificationBell } from './layout/NotificationBell';
import { HeaderAlerts } from './layout/HeaderAlerts';
import { SupportButton } from './layout/SupportButton';

// Color por estado oficial (DEMO/TRIAL/ACTIVO/PENDIENTE_PAGO/VENCIDO/CANCELADO).
const STATE_COLOR = {
  DEMO: '#06b6d4', TRIAL: '#f59e0b', ACTIVO: '#10b981',
  PENDIENTE_PAGO: '#f97316', VENCIDO: '#ef4444', CANCELADO: '#64748b',
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

// Título profesional según el país del abogado (terminología local).
const TITLE_BY_COUNTRY = {
  "México": "Lic.", "Guatemala": "Lic.", "Honduras": "Abg.", "El Salvador": "Lic.",
  "Nicaragua": "Lic.", "Costa Rica": "Lic.", "Panamá": "Lic.",
  "Argentina": "Abg.", "Paraguay": "Abg.", "Uruguay": "Dr.", "Chile": "Abg.",
  "Colombia": "Dr.", "Perú": "Dr.", "Bolivia": "Dr.", "Ecuador": "Ab.",
  "Venezuela": "Abg.", "España": "Ltdo.", "República Dominicana": "Lic.",
};
const titleFor = (country) => TITLE_BY_COUNTRY[country] || "Dr.";
const greetingFor = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};
const lastName = (fullName) => {
  const parts = String(fullName || "").trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : (parts[0] || "");
};

export const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const apellido = lastName(user?.full_name || "");
  const titulo = titleFor(user?.country || "Colombia");

  // Contexto global de expediente (cliente/expediente activo).
  const { active, clear } = useCaseContext();

  // Fuente ÚNICA de verdad (frontend): plan y estado desde SubscriptionContext.
  const { access } = useSubscription();
  const planActual = access?.plan?.name || '—';
  const estadoActual = access?.status || 'ACTIVO';

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Marca de agua institucional — fija, centrada, opacidad baja, detrás del
          contenido (no afecta layout, scroll ni legibilidad). Para usar una foto
          de oficina, déjala en public/ y cambia la ruta del src. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <img src="/logo-pd-system.png" alt=""
          className="w-[62vmin] max-w-[640px] object-contain opacity-[0.035] select-none" draggable="false" />
      </div>

      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar (w-64 compacto) */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col bg-[#0f172a] border-r border-white/10 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <img src="/logo-pd-system.png" alt="PD System Multiservicios"
            className="w-12 h-12 object-contain rounded-lg flex-shrink-0" />
          <div className="leading-tight">
            <div className="font-bold text-sm">Punto Cero</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#f97316]">Oficina Virtual</div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/dashboard'} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all ${isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.highlight && <Sparkles className="w-3 h-3 text-[#f97316] ml-auto" />}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => { logout(); navigate('/'); }} className="m-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm">
          <LogOut className="w-4.5 h-4.5" /> Cerrar Sesión
        </button>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main — ml-64 sin espacio muerto; relative z-10 sobre la marca de agua */}
      <main className="relative z-10 lg:ml-64 min-h-screen">
        {/* Cabecera personalizada — saludo destacado del abogado conectado */}
        <header className="px-6 lg:px-8 pt-6 pb-4 pl-16 lg:pl-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">Punto Cero System OS · Oficina Virtual</div>
            <h1 className="text-3xl lg:text-4xl font-extrabold mt-1.5 leading-tight">
              {greetingFor()},{' '}
              <span className="bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">
                {titulo} {user?.full_name || apellido || 'Abogado'}
              </span>
            </h1>
          </div>
          {/* Plan + Estado + Campana · fuente única SubscriptionContext */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Contexto global activo (cliente/expediente) — filtra los módulos */}
            {active && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#06b6d4]/40 bg-[#06b6d4]/10 text-[#67e8f9] text-xs font-semibold" data-testid="active-context">
                {active.expediente_id || active.client_name}
                <button onClick={clear} title="Quitar filtro" className="hover:text-white">✕</button>
              </span>
            )}
            <div className="flex items-center gap-2 text-xs" data-testid="dashboard-plan-status">
              <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-white/70">
                Plan: <span className="text-white font-semibold">{planActual}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold"
                style={{ color: STATE_COLOR[estadoActual] || '#64748b', borderColor: `${STATE_COLOR[estadoActual] || '#64748b'}40`, background: `${STATE_COLOR[estadoActual] || '#64748b'}14` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATE_COLOR[estadoActual] || '#64748b' }} />
                {estadoActual}
              </span>
            </div>
            <SupportButton />
            <HeaderAlerts />
            <NotificationBell />
          </div>
        </header>

        {/* Contenido del módulo */}
        <div className="px-6 lg:px-8 py-5">{children}</div>
      </main>
    </div>
  );
};

// Esta línea es la que soluciona el error de "export default not found"
export default DashboardLayout;
