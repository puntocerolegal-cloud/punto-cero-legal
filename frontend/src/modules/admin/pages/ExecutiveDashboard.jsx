import React, { useMemo, useState } from "react";
import {
  DollarSign, FolderKanban, TrendingUp, Handshake, AlertTriangle,
  Users, CheckCircle2, Clock, RefreshCw,
} from "lucide-react";
import { MetricCard, StatusBadge, EmptyState } from "@/shared/components";
import { CasesChart, RevenueChart } from "@/shared/charts";
import { OperationsCenter } from "../components/OperationsCenter";
import { ActivityDetailDrawer } from "../components/ActivityDetailDrawer";
import { ConnectionState } from "../components/ConnectionState";
import { useDashboardState } from "@/hooks/os/useDashboardState";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

const PENDING_CASE = (c) => c.assignment_status === "sin_asignar" || c.status === "PENDING_ASSIGNMENT";
const CLOSED_CASE = (c) => ["atendido", "cerrado", "closed"].includes(c.assignment_status) || ["finalizada", "Finalizada", "CLOSED"].includes(c.estado || c.status);
const PENDING_SUB = (s) => ["pending", "expired", "suspended"].includes(s.status);

/**
 * Dashboard Ejecutivo — HUB central reactivo (Punto Cero System OS).
 * Una sola consulta consolidada (useDashboardState) agrupa Casos + Suscripciones
 * + Socios desde MongoDB y se autorefresca (polling + EventBus). Sin pestañas:
 * todo el impacto financiero y operativo se ve al entrar.
 */
export function ExecutiveDashboard() {
  const { cases, subscriptions, partners, partnersKpis, loading, error, lastUpdated, refresh } = useDashboardState();
  const [selected, setSelected] = useState(null);

  // ── Derivados (JOIN lógico en memoria) ──
  const fin = useMemo(() => {
    // MRR normalizado por ciclo: anual aporta annualAmount/12; mensual aporta monthlyAmount.
    const mrr = subscriptions.reduce((s, x) =>
      s + (x.billingCycle === "annual" ? (Number(x.annualAmount) || 0) / 12 : (Number(x.monthlyAmount) || 0)), 0);
    const arr = mrr * 12;
    const byVertical = {};
    subscriptions.forEach((x) => { byVertical[x.vertical || "—"] = (byVertical[x.vertical || "—"] || 0) + (Number(x.monthlyAmount) || 0); });
    return { mrr, arr, byVertical: Object.entries(byVertical).map(([label, value]) => ({ label, value: Math.round(value / 1000) })) };
  }, [subscriptions]);

  // Distribución geográfica (casos por país de origen).
  const casesByCountry = useMemo(() => {
    const map = {};
    cases.forEach((c) => { const k = c.client_country || "—"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [cases]);

  const casesStat = useMemo(() => ({
    total: cases.length,
    pending: cases.filter(PENDING_CASE).length,
    inProcess: cases.filter((c) => c.assignment_status === "asignado" || c.status === "IN_PROGRESS").length,
    closed: cases.filter(CLOSED_CASE).length,
  }), [cases]);

  const sales = useMemo(() => {
    const sold = cases.filter((c) => c.lawyer_name);             // casos cerrados por un vendedor
    const conversion = cases.length ? Math.round((sold.length / cases.length) * 100) : 0;
    // JOIN: casos cerrados agrupados por vendedor
    const byVendedor = {};
    sold.forEach((c) => { byVendedor[c.lawyer_name] = (byVendedor[c.lawyer_name] || 0) + 1; });
    const topVendedores = Object.entries(byVendedor).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    return { sold: sold.length, conversion, topVendedores };
  }, [cases]);

  const partnersStat = useMemo(() => ({
    active: partners.filter((p) => p.status === "active"),
    pending: partners.filter((p) => p.status === "pending"),
    commissions: partnersKpis.commissionsGenerated || 0,
  }), [partners, partnersKpis]);

  // ── Alertas automáticas (incluye suscripciones pendientes) ──
  const alerts = useMemo(() => {
    const pendingSubs = subscriptions.filter(PENDING_SUB);
    return [
      casesStat.pending > 0 && { tone: "atencion", text: `${casesStat.pending} caso(s) sin asignar en la cola.` },
      pendingSubs.length > 0 && { tone: "riesgo", text: `${pendingSubs.length} suscripción(es) pendiente(s)/vencida(s) por gestionar.` },
      partnersStat.pending.length > 0 && { tone: "atencion", text: `${partnersStat.pending.length} socio(s) en estado pendiente.` },
    ].filter(Boolean);
  }, [subscriptions, casesStat, partnersStat]);

  // Estados de conexión (datos reales): Cargando / Error.
  const empty = !loading && !error && cases.length === 0 && subscriptions.length === 0 && partners.length === 0;
  if (loading || error || empty) {
    return <ConnectionState loading={loading} error={error} empty={empty} title="PUNTO CERO SYSTEM OS" />;
  }

  const ops = [
    { key: "pending-cases", label: "Casos sin asignar", count: casesStat.pending, icon: AlertTriangle, accent: "#ef4444", to: "/admin/cases-portal", tone: "alert" },
    { key: "in-process", label: "Casos en proceso", count: casesStat.inProcess, icon: Clock, accent: "#3b82f6", to: "/admin/cases-portal" },
    { key: "active-partners", label: "Socios activos", count: partnersStat.active.length, icon: Handshake, accent: "#10b981", to: "/admin/partners" },
    { key: "pending-subs", label: "Suscripciones pendientes", count: subscriptions.filter(PENDING_SUB).length, icon: RefreshCw, accent: "#f59e0b", to: "/admin/subscriptions", tone: "alert" },
  ];

  const recent = cases.slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[11px] text-white/40">
          Hub consolidado · datos reales de MongoDB · {lastUpdated ? `actualizado ${new Date(lastUpdated).toLocaleTimeString("es-CO")}` : ""}
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refrescar
        </button>
      </div>

      {/* ── 4 WIDGETS MAESTROS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="MRR (recurrente mensual)" value={money(fin.mrr)} icon={DollarSign} accent="#10b981" subtitle={`ARR ${money(fin.arr)}`} />
        <MetricCard title="Casos (pend/proc/cerr)" value={`${n(casesStat.pending)}/${n(casesStat.inProcess)}/${n(casesStat.closed)}`} icon={FolderKanban} accent="#06b6d4" subtitle={`${casesStat.total} totales`} />
        <MetricCard title="Salud de ventas" value={`${sales.conversion}%`} icon={TrendingUp} accent="#f97316" subtitle={`${sales.sold} casos cerrados`} />
        <MetricCard title="Socios activos" value={n(partnersStat.active.length)} icon={Handshake} accent="#8b5cf6" subtitle={`${money(partnersStat.commissions)} comisiones`} />
      </section>

      {/* Centro de Operaciones (clicable) */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Analítica real + Monitor de socios */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={fin.byVertical} title="Ingresos de suscripciones por vertical (miles COP)" />
        <CasesChart
          data={[
            { label: "Pendientes", value: casesStat.pending, color: "#ef4444" },
            { label: "En proceso", value: casesStat.inProcess, color: "#3b82f6" },
            { label: "Cerrados", value: casesStat.closed, color: "#10b981" },
          ]}
          title="Estado de casos"
        />
        <CasesChart data={casesByCountry} title="Distribución geográfica (casos por país)" />
      </section>

      {/* Alertas + Monitor de Socios */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Alertas</h3>
          {alerts.length ? (
            <ul className="space-y-3">{alerts.map((a, i) => <li key={i} className="flex items-start gap-3"><StatusBadge tone={a.tone} /><span className="text-sm text-white/70">{a.text}</span></li>)}</ul>
          ) : <EmptyState icon={CheckCircle2} title="Sin alertas" description="Todo en orden." className="border-0 bg-transparent py-8" />}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Monitor de Socios</h3>
          {partnersStat.active.length || partnersStat.pending.length ? (
            <ul className="space-y-2 text-sm">
              {partnersStat.active.slice(0, 5).map((p) => (
                <li key={p._id} className="flex items-center justify-between"><span className="text-white/80 truncate">{p.companyName}</span><StatusBadge tone="active" label="Activo" /></li>
              ))}
              {partnersStat.pending.length > 0 && <li className="text-xs text-[#f59e0b] pt-1">{partnersStat.pending.length} pago(s)/socio(s) pendiente(s)</li>}
            </ul>
          ) : <EmptyState icon={Users} title="Sin socios" className="border-0 bg-transparent py-8" />}
        </div>

        {/* JOIN: comisiones/cierres por vendedor */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Monitor de Agentes (cierres)</h3>
          {sales.topVendedores.length ? (
            <ul className="space-y-2 text-sm">
              {sales.topVendedores.map((v) => (
                <li key={v.name} className="flex items-center justify-between"><span className="text-white/80 truncate">{v.name}</span><span className="text-[#10b981] font-semibold">{v.count}</span></li>
              ))}
            </ul>
          ) : <EmptyState icon={TrendingUp} title="Sin cierres aún" className="border-0 bg-transparent py-8" />}
        </div>
      </section>

      {/* Actividad reciente (clic → detalle, sin cambiar de entorno) */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Actividad reciente</h3>
        {recent.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Sin actividad reciente" className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="divide-y divide-white/5">
            {recent.map((c) => (
              <li key={c._id || c.case_number}>
                <button onClick={() => setSelected(c)} className="w-full text-left py-3 flex items-center gap-3 hover:bg-white/[0.03] rounded-lg px-2 -mx-2">
                  <StatusBadge tone={PENDING_CASE(c) ? "atencion" : "normal"} label={c.estado || c.status || "—"} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white/90 font-medium truncate">{c.title || `Consulta ${c.legal_area || ""}`}</div>
                    <div className="text-[11px] text-white/40 truncate">{c.client_name} · {c.client_country || "—"} · {c.case_number || ""}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActivityDetailDrawer activity={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default ExecutiveDashboard;
