import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Users, UserCheck, FolderKanban, Settings, Building2, DollarSign, TrendingUp } from "lucide-react";

export function FirmOSSidebar({ onNavigate }) {
  const menuItems = [
    { icon: BarChart3, label: "Dashboard", path: "/firm-os" },
    { icon: Users, label: "Abogados", path: "/firm-os/lawyers" },
    { icon: UserCheck, label: "Equipo", path: "/firm-os/team" },
    { icon: FolderKanban, label: "Casos", path: "/firm-os/cases" },
    { icon: DollarSign, label: "Finanzas", path: "/firm-os/finance" },
    { icon: DollarSign, label: "Facturación", path: "/firm-os/billing" },
    { icon: TrendingUp, label: "CRM", path: "/firm-os/crm" },
    { icon: TrendingUp, label: "IA Corporativa", path: "/firm-os/ia" },
    { icon: Building2, label: "Directorio Público", path: "/firm-os/directory" },
    { icon: TrendingUp, label: "Analytics", path: "/firm-os/analytics" },
    { icon: Settings, label: "Configuración", path: "/firm-os/settings" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold">Firm OS</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/firm-os"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        <p>Firm OS v1.0</p>
      </div>
    </div>
  );
}
