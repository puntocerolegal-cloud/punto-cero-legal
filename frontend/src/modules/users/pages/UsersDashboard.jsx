import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Users, UserCheck, Ban, UserPlus, TrendingUp, Clock } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart, RevenueChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { UserFilters } from "../components/UserFilters";
import { UserDirectory } from "../components/UserDirectory";
import { UserFormModal } from "../components/UserFormModal";
import { useUsers } from "@/hooks/os";
import { usersService } from "@/services/os";

const n = (v) => Number(v || 0).toLocaleString("es-CO");
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
const ACTION_STATUS = { activate: "ACTIVO", deactivate: "INACTIVO", suspend: "SUSPENDIDO" };
const EMPTY_FILTERS = { search: "", role: "", vertical: "", organization: "", status: "" };

/** Centro de administración global de usuarios — Punto Cero System OS. */
export function UsersDashboard() {
  const { data } = useUsers();
  const [users, setUsers] = useState(data.USERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // { user } | { user: null } (crear)

  useEffect(() => { setUsers(data.USERS); }, [data.USERS]);

  const options = useMemo(() => ({
    roles: uniq((users || []).map((u) => u.role)),
    verticals: uniq((users || []).map((u) => u.vertical)),
    organizations: uniq((users || []).map((u) => u.organization)),
    statuses: ["ACTIVO", "INACTIVO", "SUSPENDIDO", "PENDIENTE"],
  }), [users]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return (users || []).filter((u) => {
      if (q && !`${u.name} ${u.email} ${u.organization}`.toLowerCase().includes(q)) return false;
      if (filters.role && u.role !== filters.role) return false;
      if (filters.vertical && u.vertical !== filters.vertical) return false;
      if (filters.organization && u.organization !== filters.organization) return false;
      if (filters.status && u.status !== filters.status) return false;
      return true;
    });
  }, [users, filters]);

  const kpis = useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      active: list.filter((u) => u.status === "ACTIVO").length,
      suspended: list.filter((u) => u.status === "SUSPENDIDO").length,
      pending: list.filter((u) => u.status === "PENDIENTE").length,
      growth: data.KPIS?.monthlyGrowth ?? 0,
    };
  }, [users, data.KPIS]);

  const ops = useMemo(() => {
    const c = (st) => (users || []).filter((u) => u.status === st).length;
    return [
      { key: "new", label: "Nuevos usuarios", count: data.KPIS?.newUsers ?? 0, icon: UserPlus, accent: "#3b82f6", to: "/admin/users" },
      { key: "pending", label: "Pendientes de activación", count: c("PENDIENTE"), icon: Clock, accent: "#f59e0b", to: "/admin/users", tone: "alert" },
      { key: "suspended", label: "Suspendidos", count: c("SUSPENDIDO"), icon: Ban, accent: "#ef4444", to: "/admin/users", tone: "alert" },
      { key: "inactive", label: "Inactivos", count: c("INACTIVO"), icon: Users, accent: "#64748b", to: "/admin/users" },
    ];
  }, [users, data.KPIS]);

  const usersByRole = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => { map[u.role] = (map[u.role] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [users]);

  const usersByStatus = useMemo(() => ([
    { label: "Activo", value: kpis.active, color: "#10b981" },
    { label: "Pendiente", value: kpis.pending, color: "#f59e0b" },
    { label: "Suspendido", value: kpis.suspended, color: "#ef4444" },
    { label: "Inactivo", value: (users || []).filter((u) => u.status === "INACTIVO").length, color: "#64748b" },
  ]), [kpis, users]);

  const handleAction = useCallback(async (id, action) => {
    if (action === "edit") {
      setModal({ user: (users || []).find((u) => u._id === id) });
      return;
    }
    setBusyId(id);
    try {
      if (action === "reset") {
        await usersService.resetAccess(id);
      } else {
        const status = ACTION_STATUS[action];
        await usersService.setStatus(id, status);
        setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status } : u)));
      }
    } finally {
      setBusyId(null);
    }
  }, [users]);

  const handleSave = useCallback(async (payload) => {
    if (payload._id) {
      await usersService.update(payload._id, payload);
      setUsers((prev) => prev.map((u) => (u._id === payload._id ? { ...u, ...payload } : u)));
    } else {
      const created = { ...payload, _id: `usr-${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), lastAccess: "—" };
      await usersService.create(payload);
      setUsers((prev) => [created, ...prev]);
    }
    setModal(null);
  }, []);

  const metricCards = [
    { title: "Usuarios totales", value: n(kpis.total), icon: Users, accent: "#3b82f6" },
    { title: "Usuarios activos", value: n(kpis.active), icon: UserCheck, accent: "#10b981" },
    { title: "Usuarios suspendidos", value: n(kpis.suspended), icon: Ban, accent: "#ef4444" },
    { title: "Nuevos usuarios", value: n(data.KPIS?.newUsers ?? 0), icon: UserPlus, accent: "#8b5cf6" },
    { title: "Crecimiento mensual", value: `${kpis.growth}%`, icon: TrendingUp, accent: "#f97316" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/[0.06] px-4 py-2.5 text-xs text-[#93c5fd]">
        Centro de administración global de usuarios · Punto Cero System OS · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Centro de Operaciones · Usuarios</h2>
          <button onClick={() => setModal({ user: null })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold" data-testid="user-create-btn">
            <UserPlus className="w-4 h-4" /> Crear usuario
          </button>
        </div>
        <OperationsCenter items={ops} />
      </section>

      {/* Filtros + directorio */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Directorio global</h2>
        <UserFilters value={filters} onChange={setFilters} options={options} />
        <UserDirectory data={filtered} onAction={handleAction} busyId={busyId} />
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasesChart data={usersByRole} title="Usuarios por rol" />
          <CasesChart data={data.USERS_BY_VERTICAL} title="Usuarios por vertical" />
          <CasesChart data={usersByStatus} title="Usuarios por estado" />
          <RevenueChart data={data.MONTHLY_GROWTH} title="Crecimiento mensual (usuarios)" accent="#f97316" />
        </div>
      </section>

      {modal && (
        <UserFormModal
          user={modal.user}
          options={options}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default UsersDashboard;
