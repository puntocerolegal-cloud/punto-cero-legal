import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ShieldCheck, Sparkles, Users, PieChart, Plus } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { RoleCard } from "../components/RoleCard";
import { RoleDirectory } from "../components/RoleDirectory";
import { RoleFormModal } from "../components/RoleFormModal";
import { useRoles } from "@/hooks/os";
import { rolesService } from "@/services/os";

const n = (v) => Number(v || 0).toLocaleString("es-CO");

/** Administración centralizada de roles de la plataforma — Punto Cero System OS. */
export function RolesDashboard() {
  const { data } = useRoles();
  const [roles, setRoles] = useState(data.ROLES);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // { role, mode }

  useEffect(() => { setRoles(data.ROLES); }, [data.ROLES]);

  const kpis = useMemo(() => {
    const list = roles || [];
    const active = list.filter((r) => r.status === "ACTIVO").length;
    const totalUsers = list.reduce((s, r) => s + (r.users || 0), 0);
    return {
      activeRoles: active,
      customRoles: list.filter((r) => r.custom).length,
      totalRoles: list.length,
      avgUsers: list.length ? (totalUsers / list.length).toFixed(1) : 0,
    };
  }, [roles]);

  const ops = useMemo(() => [
    { key: "active", label: "Roles activos", count: kpis.activeRoles, icon: ShieldCheck, accent: "#10b981", to: "/admin/roles" },
    { key: "custom", label: "Roles personalizados", count: kpis.customRoles, icon: Sparkles, accent: "#8b5cf6", to: "/admin/roles" },
    { key: "inactive", label: "Roles inactivos", count: (roles || []).filter((r) => r.status === "INACTIVO").length, icon: ShieldCheck, accent: "#64748b", to: "/admin/roles" },
    { key: "empty", label: "Roles sin usuarios", count: (roles || []).filter((r) => !r.users).length, icon: Users, accent: "#f59e0b", to: "/admin/roles", tone: "alert" },
  ], [roles, kpis]);

  const usersByRole = useMemo(() => (roles || []).map((r) => ({ label: r.name, value: r.users })), [roles]);
  const statusDistribution = useMemo(() => ([
    { label: "Activos", value: kpis.activeRoles, color: "#10b981" },
    { label: "Inactivos", value: (roles || []).filter((r) => r.status === "INACTIVO").length, color: "#64748b" },
  ]), [roles, kpis]);

  const handleAction = useCallback(async (id, action) => {
    const role = (roles || []).find((r) => r._id === id);
    if (action === "edit") return setModal({ role, mode: "edit" });
    if (action === "duplicate") return setModal({ role, mode: "duplicate" });
    setBusyId(id);
    try {
      const status = action === "activate" ? "ACTIVO" : "INACTIVO";
      await rolesService.setStatus(id, status);
      setRoles((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
    } finally {
      setBusyId(null);
    }
  }, [roles]);

  const handleSave = useCallback(async (payload) => {
    if (payload._id) {
      await rolesService.update(payload._id, payload);
      setRoles((prev) => prev.map((r) => (r._id === payload._id ? { ...r, ...payload } : r)));
    } else {
      const created = { ...payload, _id: `rol-${Date.now()}`, users: 0 };
      await rolesService.create(payload);
      setRoles((prev) => [created, ...prev]);
    }
    setModal(null);
  }, []);

  const metricCards = [
    { title: "Roles activos", value: n(kpis.activeRoles), icon: ShieldCheck, accent: "#10b981" },
    { title: "Roles personalizados", value: n(kpis.customRoles), icon: Sparkles, accent: "#8b5cf6" },
    { title: "Usuarios por rol (prom.)", value: kpis.avgUsers, icon: Users, accent: "#3b82f6" },
    { title: "Roles totales", value: n(kpis.totalRoles), icon: PieChart, accent: "#f97316" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#f97316]/30 bg-[#f97316]/[0.06] px-4 py-2.5 text-xs text-[#fdba74]">
        Administración centralizada de roles · Punto Cero System OS · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Centro de Operaciones · Roles</h2>
          <button onClick={() => setModal({ role: null, mode: "create" })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold" data-testid="role-create-btn">
            <Plus className="w-4 h-4" /> Crear rol
          </button>
        </div>
        <OperationsCenter items={ops} />
      </section>

      {/* Tarjetas de rol */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Roles de la plataforma</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(roles || []).map((r) => (
            <RoleCard key={r._id} role={r} onAction={handleAction} busy={busyId === r._id} />
          ))}
        </div>
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Distribución de roles</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasesChart data={usersByRole} title="Usuarios por rol" />
          <CasesChart data={statusDistribution} title="Estado de roles" />
        </div>
      </section>

      {/* Directorio */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Directorio de roles</h2>
        <RoleDirectory data={roles} onRowClick={(r) => setModal({ role: r, mode: "edit" })} />
      </section>

      {modal && (
        <RoleFormModal role={modal.role} mode={modal.mode} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}

export default RolesDashboard;
