import React from "react";
import {
  UserPlus, Building2, Layers, Handshake, Target, DollarSign,
  Stethoscope, Smile, Scale, FileSignature, Rocket, Wallet, Clock,
} from "lucide-react";
import { MetricCard, DataTable, StatusBadge } from "@/shared/components";
import { FunnelChart, RevenueChart, ConversionChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { PartnerPipeline } from "../components/PartnerPipeline";
import { VerticalCard } from "../components/VerticalCard";
import { CommissionSummary } from "../components/CommissionSummary";
import { usePartners } from "@/hooks/os";
import { ConnectionState } from "@/modules/admin/components/ConnectionState";
import { AgentManager } from "../components/AgentManager";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

const VERTICAL_ICONS = { medicina: Stethoscope, odontologia: Smile, juridicas: Scale };

export function PartnersDashboard() {
  const { data, loading, error } = usePartners();
  const {
    KPIS, OPPORTUNITIES, PIPELINE_STAGES, VERTICALS, PARTNERS, COMMISSIONS, OPERATIONS,
  } = data;

  // Manejadores de estado (datos reales de Mongo): Cargando / Error / Estado Cero.
  const isEmpty = !(PARTNERS && PARTNERS.length);
  if (loading || error || isEmpty) {
    return (
      <div className="space-y-8">
        <AgentManager />
        <ConnectionState loading={loading} error={error} empty={isEmpty} title="Socios Comerciales" />
      </div>
    );
  }
  // ── KPIs superiores ──
  const kpis = [
    { title: "Leads captados", value: n(KPIS.leads), icon: UserPlus, accent: "#3b82f6" },
    { title: "Empresas registradas", value: n(KPIS.companies), icon: Building2, accent: "#6366f1" },
    { title: "Verticales activas", value: n(KPIS.activeVerticals), icon: Layers, accent: "#8b5cf6" },
    { title: "Partners activos", value: n(KPIS.activePartners), icon: Handshake, accent: "#ec4899" },
    { title: "Conversiones", value: n(KPIS.conversions), icon: Target, accent: "#f97316" },
    { title: "Comisiones generadas", value: money(KPIS.commissionsGenerated), icon: DollarSign, accent: "#10b981" },
  ];

  // ── Centro de Operaciones (Partners) ──
  const ops = [
    { key: "new-leads", label: "Leads nuevos", count: OPERATIONS.newLeads, icon: UserPlus, accent: "#3b82f6", to: "/admin/analytics" },
    { key: "proposals", label: "Propuestas pendientes", count: OPERATIONS.pendingProposals, icon: FileSignature, accent: "#f59e0b", to: "/admin/partners" },
    { key: "negotiations", label: "Negociaciones activas", count: OPERATIONS.activeNegotiations, icon: Handshake, accent: "#f97316", to: "/admin/partners" },
    { key: "contracts", label: "Contratos por firmar", count: OPERATIONS.contractsToSign, icon: FileSignature, accent: "#10b981", to: "/admin/partners", tone: "alert" },
    { key: "implementation", label: "Verticales en implementación", count: OPERATIONS.verticalsInImplementation, icon: Rocket, accent: "#8b5cf6", to: "/admin/partners" },
    { key: "commissions", label: "Comisiones pendientes", count: OPERATIONS.pendingCommissions, icon: Wallet, accent: "#ec4899", to: "/admin/billing", tone: "alert" },
  ];

  // ── Analítica (reutiliza shared/charts) ──
  const funnelData = PIPELINE_STAGES.map((s) => ({
    label: s.label,
    value: OPPORTUNITIES.filter((o) => o.stage === s.key).length,
    color: s.accent,
  }));
  const conversionByVertical = VERTICALS.map((v) => ({ label: v.name, value: v.conversion }));
  const revenueByPartner = COMMISSIONS.top.map((t) => ({ label: t.company.split(" ")[0], value: Math.round(t.amount / 1_000_000) }));

  // ── Tabla de partners ──
  const columns = [
    { key: "company", label: "Empresa", sortable: true, render: (r) => <span className="text-white">{r.company}</span> },
    { key: "contact", label: "Contacto", sortable: true },
    { key: "vertical", label: "Vertical", sortable: true },
    { key: "status", label: "Estado", render: (r) => <StatusBadge tone={r.status} /> },
    { key: "commission", label: "Comisión", sortable: true, render: (r) => money(r.commission) },
    { key: "joined", label: "Fecha alta", sortable: true },
  ];

  return (
    <div className="space-y-8">
      <AgentManager />
      <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] px-4 py-2.5 text-xs text-[#f59e0b]">
        Módulo Socios Comerciales · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Partners</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Centro de Oportunidades (Kanban) */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Oportunidades</h2>
        <PartnerPipeline opportunities={OPPORTUNITIES} />
      </section>

      {/* Nuevas Verticales */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Nuevas Verticales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VERTICALS.map((v) => (
            <VerticalCard key={v.key} vertical={{ ...v, icon: VERTICAL_ICONS[v.key] }} />
          ))}
        </div>
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica comercial</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FunnelChart data={funnelData} title="Embudo comercial" />
          <ConversionChart data={conversionByVertical} title="Conversión por vertical (%)" />
          <RevenueChart data={revenueByPartner} title="Ingresos por partner (millones COP)" />
        </div>
      </section>

      {/* Partners activos */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Partners activos</h2>
        <DataTable
          columns={columns}
          data={PARTNERS}
          pageSize={6}
          searchKeys={["company", "contact", "vertical"]}
          empty={{ title: "Sin partners", description: "Aún no hay socios comerciales registrados." }}
        />
      </section>

      {/* Comisiones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Comisiones</h2>
        <CommissionSummary data={COMMISSIONS} />
      </section>
    </div>
  );
}

export default PartnersDashboard;
