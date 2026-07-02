import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { FirmOSSidebar } from "./FirmOSSidebar";

/**
 * Firm OS Layout — Extensión de Lawyer OS
 * Reutiliza DashboardLayout pero con FirmOSSidebar dinámico.
 * Solo agrega contexto de firma, todo lo demás es del Lawyer OS.
 */
export function FirmOSLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Reutiliza estructura de DashboardLayout pero con sidebar de Firm */}
      <aside className="fixed top-0 left-0 h-full w-64 z-40 flex flex-col bg-[#0f172a] border-r border-white/10">
        <FirmOSSidebar />
      </aside>

      <main className="relative z-10 lg:ml-64 min-h-screen">
        {/* Delega header y layout al contenido envuelto */}
        {children}
      </main>
    </div>
  );
}
