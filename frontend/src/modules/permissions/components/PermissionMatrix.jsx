import React from "react";
import { PermissionToggle } from "./PermissionToggle";

/**
 * Matriz visual de permisos Módulo × Rol para un tipo de permiso dado.
 * props:
 *  - modules: [{ key, label }]
 *  - roles:   [{ key, name }]
 *  - layer:   { [moduleKey]: { [roleKey]: bool } }  (la capa del tipo actual)
 *  - onToggle(moduleKey, roleKey, value)
 *  - readOnlyRoles: roles cuyo acceso no se edita (p.ej. SUPER_ADMIN)
 */
export function PermissionMatrix({ modules, roles, layer, onToggle, readOnlyRoles = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-white/50 border-b border-white/10">
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs sticky left-0 bg-[#0f172a]/80 backdrop-blur-md z-10">
                Módulo
              </th>
              {roles.map((r) => (
                <th key={r.key} className="px-3 py-3 font-semibold uppercase tracking-wider text-[10px] text-center whitespace-nowrap">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.key} className="border-b border-white/5 hover:bg-white/[0.03]">
                <td className="px-4 py-3 text-white font-medium whitespace-nowrap sticky left-0 bg-[#0f172a]/60 backdrop-blur-md z-10">
                  {m.label}
                </td>
                {roles.map((r) => (
                  <td key={r.key} className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      <PermissionToggle
                        checked={Boolean(layer?.[m.key]?.[r.key])}
                        disabled={readOnlyRoles.includes(r.key)}
                        onChange={(v) => onToggle?.(m.key, r.key, v)}
                        label={`${m.label} · ${r.name}`}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PermissionMatrix;
