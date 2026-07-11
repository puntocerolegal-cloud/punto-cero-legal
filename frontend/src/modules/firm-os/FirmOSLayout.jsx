import React from "react";
import DashboardLayout, { NestedLayoutContext } from "@/components/DashboardLayout";
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
        {/* F-013: padding uniforme + Provider para que las páginas reutilizadas de
            Lawyer OS (que se auto-envuelven en DashboardLayout) no pinten un
            segundo sidebar/header/margen y queden alineadas. */}
        <div className="px-6 lg:px-8 py-5">
          <NestedLayoutContext.Provider value={true}>{children}</NestedLayoutContext.Provider>
        </div>
      </main>
    </div>
  );
}
