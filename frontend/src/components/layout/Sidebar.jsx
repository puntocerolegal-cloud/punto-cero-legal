import React from "react";
import { NavLink } from "react-router-dom";
import { getOsModules, MODULE_GROUPS } from "@/core/registry/moduleRegistry";
import { useEntitlement } from "@/hooks/useEntitlement";
import { isSupportAccessActive } from "@/core/security/supportToken";

/**
 * Navegación dinámica del System OS — Punto Cero System Core.
 * Render por GRUPOS (Flujo de Valor) con cabecera de color y separadores:
 *   Operaciones (Cian) · Negocio (Oro) · Red y Talento (Violeta) · Sistema (Gris).
 * Filtra por DOS capas:
 *  1. Entitlement (canAccess) → acceso por plan (null = solo rol, siempre pasa).
 *  2. Token de soporte → módulos `requiresSupportToken` solo si hay token vigente.
 */
export function SidebarNav({ onNavigate }) {
  const { canAccess } = useEntitlement();
  const supportActive = isSupportAccessActive();

  const visible = getOsModules()
    .filter((m) => canAccess(m.requiredFeature))
    .filter((m) => !m.requiresSupportToken || supportActive);

  return (
    <div className="space-y-5">
      {MODULE_GROUPS.map((group) => {
        const items = visible.filter((m) => m.group === group.key);
        if (items.length === 0) return null;
        return (
          <div key={group.key}>
            {/* Cabecera de grupo codificada por color */}
            <div className="flex items-center gap-2 px-4 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.accent }} />
              <span className="text-[10px] uppercase tracking-[0.18em] font-semibold" style={{ color: group.accent }}>
                {group.label}
              </span>
              <span className="flex-1 h-px" style={{ background: `${group.accent}26` }} />
            </div>
            <ul className="space-y-0.5">
              {items.map((m) => {
                const Icon = m.icon;
                return (
                  <li key={m.key}>
                    <NavLink
                      to={m.to}
                      end={m.end}
                      onClick={() => onNavigate?.()}
                      style={({ isActive }) => (isActive ? { borderColor: `${group.accent}66` } : undefined)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                          isActive
                            ? "bg-white/[0.06] text-white"
                            : "border-transparent text-white/55 hover:text-white hover:bg-white/5"
                        }`
                      }
                    >
                      {Icon && <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ color: group.accent }} />}
                      <span className="text-sm font-medium">{m.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default SidebarNav;
