import React from "react";
import {
  Rocket, Clock, UserCheck, CheckCircle2, AlertTriangle, Smile,
  PackageCheck, PlayCircle, Lock,
} from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart, ConversionChart, RevenueChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { ImplementationBoard } from "../components/ImplementationBoard";
import { VerticalChecklist } from "../components/VerticalChecklist";
import { GoLivePanel } from "../components/GoLivePanel";
import { useImplementations } from "@/hooks/os";

const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function ImplementationsDashboard() {
  const { data } = useImplementations();
  const {
    PROJECTS, KPIS, OPERATIONS, GO_LIVES,
    BY_VERTICAL, AVG_TIME_BY_STAGE, GO_LIVE_BY_MONTH, CONVERSION_SOLD_TO_PRODUCTIVE,
  } = data;
  // Ejemplo de avance por vertical (toma el proyecto más avanzado de cada una).
  const checklistByVertical = [
    { vertical: "Medicina", accent: "#10b981" },
    { vertical: "Odontología", accent: "#3b82f6" },
    { vertical: "Jurídico", accent: "#f97316" },
  ].map((c) => {
    const projects = PROJECTS.filter((p) => p.vertical === c.vertical);
    const done = projects.reduce((m, p) => Math.max(m, p.checklistDone || 0), 0);
    return { ...c, done };
  });

  const kpis = [
    { title: "Proyectos activos", value: n(KPIS.activeProjects), icon: Rocket, accent: "#f97316" },
    { title: "Tiempo prom. implementación", value: `${n(KPIS.avgImplementationDays)} días`, icon: Clock, accent: "#3b82f6" },
    { title: "Clientes productivos", value: n(KPIS.productiveClients), icon: UserCheck, accent: "#10b981" },
    { title: "Go Live realizados", value: n(KPIS.goLivesDone), icon: CheckCircle2, accent: "#ec4899" },
    { title: "Riesgos abiertos", value: n(KPIS.openRisks), icon: AlertTriangle, accent: "#ef4444" },
    { title: "Satisfacción implementación", value: `${n(KPIS.satisfaction)}%`, icon: Smile, accent: "#8b5cf6" },
  ];

  const ops = [
    { key: "sold", label: "Proyectos vendidos", count: OPERATIONS.sold, icon: PackageCheck, accent: "#3b82f6", to: "/admin/partners" },
    { key: "active", label: "Implementaciones activas", count: OPERATIONS.active, icon: PlayCircle, accent: "#f97316", to: "/admin/implementations" },
    { key: "golive", label: "Go Live pendientes", count: OPERATIONS.goLivePending, icon: Rocket, accent: "#ec4899", to: "/admin/implementations" },
    { key: "risks", label: "Riesgos críticos", count: OPERATIONS.criticalRisks, icon: AlertTriangle, accent: "#ef4444", to: "/admin/implementations", tone: "alert" },
    { key: "blocked", label: "Clientes bloqueados", count: OPERATIONS.blockedClients, icon: Lock, accent: "#f59e0b", to: "/admin/implementations", tone: "alert" },
    { key: "completed", label: "Implementaciones completadas", count: OPERATIONS.completed, icon: CheckCircle2, accent: "#10b981", to: "/admin/implementations" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] px-4 py-2.5 text-xs text-[#f59e0b]">
        Módulo Implementaciones · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Implementación</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Pipeline de Implementación (Kanban) */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Pipeline de Implementación</h2>
        <ImplementationBoard projects={PROJECTS} />
      </section>

      {/* Checklists por vertical + Go Live Center */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {checklistByVertical.map((c) => (
          <VerticalChecklist key={c.vertical} vertical={c.vertical} done={c.done} accent={c.accent} />
        ))}
        <GoLivePanel items={GO_LIVES} />
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica de implementación</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasesChart data={BY_VERTICAL} title="Implementaciones por vertical" />
          <CasesChart data={AVG_TIME_BY_STAGE} title="Tiempo promedio por etapa (días)" />
          <RevenueChart data={GO_LIVE_BY_MONTH} title="Go Live por mes" accent="#ec4899" />
          <ConversionChart data={CONVERSION_SOLD_TO_PRODUCTIVE} title="Conversión vendido → productivo (%)" />
        </div>
      </section>
    </div>
  );
}

export default ImplementationsDashboard;
