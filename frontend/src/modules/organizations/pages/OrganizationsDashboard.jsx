import React, { useState } from "react";
import { Building2, Users, Layers, CreditCard, DollarSign, AlertTriangle, RefreshCw, LifeBuoy, UserX } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart, RevenueChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { OrganizationDirectory } from "../components/OrganizationDirectory";
import { OrganizationCard } from "../components/OrganizationCard";
import { OrganizationHealth } from "../components/OrganizationHealth";
import { TenantUsage } from "../components/TenantUsage";
import { OrganizationUsers } from "../components/OrganizationUsers";
import { useOrganizations } from "@/hooks/os";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function OrganizationsDashboard() {
  const { data } = useOrganizations();
  const {
    KPIS, ORGANIZATIONS, ORG_USERS, OPERATIONS,
    ORGS_BY_VERTICAL, USERS_BY_ORG, MRR_BY_ORG, HEALTH_DISTRIBUTION,
  } = data;
  const [selected, setSelected] = useState(ORGANIZATIONS[0]);

  const kpis = [
    { title: "Organizaciones activas", value: n(KPIS.activeOrgs), icon: Building2, accent: "#3b82f6" },
    { title: "Usuarios totales", value: n(KPIS.totalUsers), icon: Users, accent: "#6366f1" },
    { title: "Verticales activas", value: n(KPIS.activeVerticals), icon: Layers, accent: "#8b5cf6" },
    { title: "Suscripciones activas", value: n(KPIS.activeSubscriptions), icon: CreditCard, accent: "#ec4899" },
    { title: "MRR total", value: money(KPIS.totalMrr), icon: DollarSign, accent: "#10b981" },
    { title: "Organizaciones en riesgo", value: n(KPIS.orgsAtRisk), icon: AlertTriangle, accent: "#ef4444" },
  ];

  const ops = [
    { key: "new", label: "Nuevas organizaciones", count: OPERATIONS.newOrgs, icon: Building2, accent: "#3b82f6", to: "/admin/organizations" },
    { key: "active", label: "Organizaciones activas", count: OPERATIONS.activeOrgs, icon: Building2, accent: "#10b981", to: "/admin/organizations" },
    { key: "risk", label: "Organizaciones en riesgo", count: OPERATIONS.orgsAtRisk, icon: AlertTriangle, accent: "#ef4444", to: "/admin/organizations", tone: "alert" },
    { key: "blocked", label: "Usuarios bloqueados", count: OPERATIONS.blockedUsers, icon: UserX, accent: "#f59e0b", to: "/admin/organizations", tone: "alert" },
    { key: "renewals", label: "Renovaciones próximas", count: OPERATIONS.upcomingRenewals, icon: RefreshCw, accent: "#f97316", to: "/admin/subscriptions" },
    { key: "tickets", label: "Tickets abiertos", count: OPERATIONS.openTickets, icon: LifeBuoy, accent: "#8b5cf6", to: "/admin/analytics" },
  ];

  const orgUsers = (selected && ORG_USERS[selected._id]) || [];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/[0.06] px-4 py-2.5 text-xs text-[#93c5fd]">
        Módulo Organizaciones · representación visual del sistema Multi-Tenant · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Organizaciones</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Tarjetas de organización */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Organizaciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ORGANIZATIONS.map((o) => (
            <OrganizationCard key={o._id} organization={o} onClick={setSelected} />
          ))}
        </div>
      </section>

      {/* Detalle del tenant seleccionado */}
      {selected && (
        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">
            Detalle · <span className="text-white">{selected.name}</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OrganizationHealth health={selected.health} />
            <TenantUsage tenant={selected.tenant} totalUsers={selected.users} />
          </div>
          <OrganizationUsers data={orgUsers} />
        </section>
      )}

      {/* Directorio */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Directorio de organizaciones</h2>
        <OrganizationDirectory data={ORGANIZATIONS} onRowClick={setSelected} />
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasesChart data={ORGS_BY_VERTICAL} title="Organizaciones por vertical" />
          <CasesChart data={USERS_BY_ORG} title="Usuarios por organización" />
          <RevenueChart data={MRR_BY_ORG} title="MRR por organización (miles COP)" />
          <CasesChart data={HEALTH_DISTRIBUTION} title="Salud organizacional" />
        </div>
      </section>
    </div>
  );
}

export default OrganizationsDashboard;
