import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ShieldCheck, KeyRound, Lock, Gauge } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { usePermissions } from "@/hooks/os";
import { permissionsService } from "@/services/os";

const n = (v) => Number(v || 0).toLocaleString("es-CO");
const SCOPES = ["Rol", "Organización", "Vertical"];
const READONLY_ROLES = ["SUPER_ADMIN"]; // acceso total no editable
const clone = (m) => JSON.parse(JSON.stringify(m));

/** Motor central de control de acceso (RBAC) — Punto Cero System OS. */
export function PermissionsDashboard() {
  const { data } = usePermissions();
  const MODULES = data.PERMISSION_MODULES;
  const ROLES = data.PERMISSION_ROLES;
  const TYPES = data.PERMISSION_TYPES;

  const [matrix, setMatrix] = useState(() => clone(data.MATRIX));
  const [type, setType] = useState(TYPES[0]);
  const [scope, setScope] = useState("Rol");
  const [scopeEntity, setScopeEntity] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setMatrix(clone(data.MATRIX)); }, [data.MATRIX]);

  const scopeOptions = useMemo(() => ({
    "Organización": ["Centro Médico Vida", "Legal Partners SAS", "Clínica Dental Sonríe"],
    "Vertical": ["Jurídico", "Medicina", "Odontología", "Contabilidad"],
  }), []);

  const kpis = useMemo(() => {
    let total = 0, active = 0;
    const rolesActive = {};
    TYPES.forEach((t) => MODULES.forEach((m) => ROLES.forEach((r) => {
      total += 1;
      if (matrix?.[t]?.[m.key]?.[r.key]) { active += 1; rolesActive[r.key] = true; }
    })));
    return {
      total,
      active,
      configuredRoles: Object.keys(rolesActive).length,
      coverage: total ? Math.round((active / total) * 100) : 0,
    };
  }, [matrix, MODULES, ROLES, TYPES]);

  const ops = useMemo(() => [
    { key: "roles", label: "Roles configurados", count: kpis.configuredRoles, icon: ShieldCheck, accent: "#10b981", to: "/admin/permissions" },
    { key: "modules", label: "Módulos cubiertos", count: MODULES.length, icon: KeyRound, accent: "#3b82f6", to: "/admin/permissions" },
    { key: "active", label: "Permisos activos", count: kpis.active, icon: Lock, accent: "#8b5cf6", to: "/admin/permissions" },
    { key: "coverage", label: "Cobertura de seguridad", count: kpis.coverage, icon: Gauge, accent: "#f97316", to: "/admin/permissions" },
  ], [kpis, MODULES]);

  const permissionsByRole = useMemo(() => ROLES.map((r) => {
    let v = 0;
    TYPES.forEach((t) => MODULES.forEach((m) => { if (matrix?.[t]?.[m.key]?.[r.key]) v += 1; }));
    return { label: r.name, value: v };
  }), [matrix, ROLES, MODULES, TYPES]);

  const coverageByModule = useMemo(() => MODULES.map((m) => {
    let v = 0;
    TYPES.forEach((t) => ROLES.forEach((r) => { if (matrix?.[t]?.[m.key]?.[r.key]) v += 1; }));
    return { label: m.label, value: Math.round((v / (TYPES.length * ROLES.length)) * 100) };
  }), [matrix, MODULES, ROLES, TYPES]);

  const onToggle = useCallback((moduleKey, roleKey, value) => {
    setMatrix((prev) => {
      const next = clone(prev);
      next[type][moduleKey][roleKey] = value;
      return next;
    });
    permissionsService.setPermission({ type, module: moduleKey, role: roleKey, value, scope, scopeEntity });
  }, [type, scope, scopeEntity]);

  const handleSave = useCallback(async () => {
    setBusy(true);
    try { await permissionsService.saveMatrix(matrix); } finally { setBusy(false); }
  }, [matrix]);

  const metricCards = [
    { title: "Permisos totales", value: n(kpis.total), icon: KeyRound, accent: "#3b82f6" },
    { title: "Permisos activos", value: n(kpis.active), icon: Lock, accent: "#10b981" },
    { title: "Roles configurados", value: n(kpis.configuredRoles), icon: ShieldCheck, accent: "#8b5cf6" },
    { title: "Cobertura de seguridad", value: `${kpis.coverage}%`, icon: Gauge, accent: "#f97316" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/[0.06] px-4 py-2.5 text-xs text-[#c4b5fd]">
        Motor central de control de acceso (RBAC) · Punto Cero System OS · datos sincronizados desde MongoDB.
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Permisos</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Controles de la matriz */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Matriz de permisos · Módulo × Rol</h2>
          <button onClick={handleSave} disabled={busy} className="self-start lg:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold disabled:opacity-60" data-testid="permissions-save-btn">
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* Ámbito (scope) */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-white/40">Administrar por:</span>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {SCOPES.map((s) => (
              <button key={s} onClick={() => { setScope(s); setScopeEntity(""); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${scope === s ? "bg-[#3b82f6]/30 text-white" : "text-white/50 hover:text-white"}`}
                data-testid={`permissions-scope-${s}`}>
                {s}
              </button>
            ))}
          </div>
          {scope !== "Rol" && (
            <select value={scopeEntity} onChange={(e) => setScopeEntity(e.target.value)}
              className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#f97316]/50">
              <option value="">{scope}: seleccionar…</option>
              {(scopeOptions[scope] || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
        </div>

        {/* Tipo de permiso */}
        <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${type === t ? "bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white" : "text-white/50 hover:text-white"}`}
              data-testid={`permissions-type-${t}`}>
              {t}
            </button>
          ))}
        </div>

        <PermissionMatrix
          modules={MODULES}
          roles={ROLES}
          layer={matrix[type]}
          onToggle={onToggle}
          readOnlyRoles={READONLY_ROLES}
        />
        <p className="text-[11px] text-white/40">
          Editando permiso <span className="text-white/70 font-semibold">{type}</span>
          {scope !== "Rol" && scopeEntity ? <> · ámbito {scope}: <span className="text-white/70">{scopeEntity}</span></> : null}
          · SUPER_ADMIN mantiene acceso total (no editable).
        </p>
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica de acceso</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasesChart data={permissionsByRole} title="Permisos activos por rol" />
          <CasesChart data={coverageByModule} title="Cobertura por módulo (%)" />
        </div>
      </section>
    </div>
  );
}

export default PermissionsDashboard;
