import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { SidebarNav } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { HeaderAlerts } from "@/components/layout/HeaderAlerts";

/**
 * Layout del Dashboard Administrativo — Punto Cero OS.
 * El shell (header/footer) vive aquí; la navegación se delega al Sidebar
 * dinámico (components/layout/Sidebar), que itera el moduleRegistry y filtra por
 * entitlement. Antes la lista de secciones estaba hardcodeada aquí.
 */
export function AdminOSLayout({ title, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      {/* Toggle móvil */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-40 backdrop-blur-xl bg-[#0f172a]/95 border-r border-white/10 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-8 h-8 text-[#f97316]" />
              <div>
                <div className="text-lg font-bold leading-none">Punto Cero</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#f97316]">System OS · Admin</div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 rounded-xl p-3 border border-[#f97316]/30">
              <div className="text-xs text-white/60 uppercase tracking-wider">Punto Cero System OS</div>
              <div className="font-semibold text-sm mt-1 truncate">{user?.full_name || "Administrador"}</div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs text-[#10b981] capitalize">{user?.role || "admin"}</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </nav>

          <div className="p-4 border-t border-white/10 space-y-1">
            {/* "Panel Legacy" eliminado: el detalle de actividad ahora es intrínseco
                al System OS (ActivityDetailDrawer en el Dashboard Ejecutivo). */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <main className="lg:ml-72 min-h-screen">
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#0f172a]/70 border-b border-white/10 px-10 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">{title}</h1>
          {/* Campanita + Alertas Inteligentes del System OS (reutiliza componentes existentes) */}
          <div className="flex items-center gap-2.5">
            <HeaderAlerts variant="admin" />
            <NotificationBell variant="admin" />
          </div>
        </header>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default AdminOSLayout;
