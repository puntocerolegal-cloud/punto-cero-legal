import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, BookOpen, Calendar,
  Brain, Video, Receipt, FileText, Settings, Building2, LogOut, Menu, X,
  Sparkles, UserCheck, DollarSign, TrendingUp, BarChart3, Briefcase, MessageCircle, AlertCircle, Zap, Activity, Cpu, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFirmCoreData } from "@/modules/firm-os/hooks/useFirmCoreData";
import { useAutomation } from "@/modules/firm-os/hooks/useAutomation";
import { useNotifications } from "@/modules/firm-os/hooks/useNotifications";
import NotificationBadge from "@/modules/firm-os/components/automation/NotificationBadge";

/**
 * FirmOSSidebar — Extensión dinámica de Lawyer OS
 * Reutiliza todos los módulos de Lawyer OS + agrega específicos de firma.
 * Menú base = Lawyer OS + extensiones de firma.
 */
export function FirmOSSidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const { lawyers = [], cases = [], clients = [], loading } = useFirmCoreData();
  const { automationVM = {}, history = [] } = useAutomation(lawyers, cases, clients);
  const { sidebarBadge = { show: false, count: 0, hasCritical: false } } = useNotifications(
    automationVM?.alerts || [],
    automationVM?.recommendations || [],
    history
  );

  // Mission Control status indicator
  const isMissionHealthy = !sidebarBadge?.hasCritical;

  // Base: módulos de Lawyer OS (reutilizados desde DashboardLayout)
  const lawyerItems = [
    { icon: BarChart3, label: 'Centro de Operaciones', path: '/firm-os' },
    { icon: Users, label: 'CRM Jurídico', path: '/firm-os/crm' },
    { icon: FolderKanban, label: 'Portal de Casos', path: '/firm-os/cases' },
    { icon: BookOpen, label: 'Directorio Clientes', path: '/firm-os/clients' },
    { icon: Calendar, label: 'Agenda Inteligente', path: '/firm-os/agenda' },
    { icon: Brain, label: 'IA Jurídica', path: '/firm-os/ai', highlight: true },
    { icon: FileText, label: 'Documentos', path: '/firm-os/documents' },
    { icon: Video, label: 'Sala de Conferencias', path: '/firm-os/meetings' },
    { icon: Receipt, label: 'Facturación', path: '/firm-os/invoices' },
  ];

  // Extensiones: solo módulos específicos de firma
  const firmItems = [
    { icon: AlertCircle, label: 'Centro de Alertas', path: '/firm-os/alerts' },
    { icon: UserCheck, label: 'Equipo Jurídico', path: '/firm-os/team' },
    { icon: Users, label: 'Control de Abogados', path: '/firm-os/lawyers' },
    { icon: MessageCircle, label: 'Comunicaciones', path: '/firm-os/communication' },
    { icon: BarChart3, label: 'Indicadores', path: '/firm-os/analytics' },
    { icon: Zap, label: 'Centro de Automatización', path: '/firm-os/automation', badge: sidebarBadge },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header con logo */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <Building2 className="w-6 h-6 text-[#f97316]" />
        <div className="leading-tight">
          <div className="font-bold text-sm">Firma</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#f97316]">Enterprise</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {/* Sección: Lawyer OS Modules */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/40 px-4 mb-2">
            Operaciones Jurídicas
          </div>
          <ul className="space-y-0.5">
            {lawyerItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/firm-os'}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.highlight && <Sparkles className="w-3 h-3 text-[#f97316] ml-auto" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Sección: Firm-specific modules */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/40 px-4 mb-2">
            Gestión Empresarial
          </div>
          <ul className="space-y-0.5">
            {firmItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/firm-os'}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge?.show && (
                    <span className="ml-auto">
                      <NotificationBadge count={item.badge.count} hasCritical={item.badge.hasCritical} />
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Config */}
        <div className="border-t border-white/10 pt-4 space-y-1">
          <NavLink
            to="/firm-os/settings"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>Configuración</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer: Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
