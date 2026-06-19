import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Layers, CheckCircle2, Wrench, ClipboardList, Building2, Users, DollarSign } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { RevenueChart, CasesChart, ConversionChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { VerticalCard } from "../components/VerticalCard";
import { VerticalDirectory } from "../components/VerticalDirectory";
import { useVerticals } from "@/hooks/os";
import { verticalsService } from "@/services/os";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");
const short = (name) => String(name || "").split(" ").slice(-1)[0];

// Acción → nuevo estado (consistente con verticalsService).
const ACTION_STATUS = { activate: "ACTIVA", deactivate: "DESHABILITADA", prepare: "DESARROLLO" };

/**
 * Centro de Gestión Multivertical — Punto Cero System OS.
 * Lista, mide y administra el ciclo de vida de las verticales. Punto Cero Legal
 * es la única productiva; el resto queda preparada dentro del motor.
 */
export function VerticalsDashboard() {
  const { data } = useVerticals();
  const [verticals, setVerticals] = useState(data.VERTICALS);
  const [busyId, setBusyId] = useState(null);

  // Sincroniza si el origen de datos (mock/backend) cambia.
  useEffect(() => { setVerticals(data.VERTICALS); }, [data.VERTICALS]);

  // KPIs / operaciones / analítica derivados en vivo de la lista.
  const kpis = useMemo(() => {
    const list = verticals || [];
    const sum = (f) => list.reduce((s, v) => s + (Number(f(v)) || 0), 0);
    return {
      totalVerticals: list.length,
      activeVerticals: list.filter((v) => v.status === "ACTIVA").length,
      totalOrgs: sum((v) => v.orgs),
      totalUsers: sum((v) => v.users),
      activePlans: sum((v) => v.activePlans),
      totalMrr: sum((v) => v.mrr),
    };
  }, [verticals]);

  const ops = useMemo(() => {
    const count = (st) => (verticals || []).filter((v) => v.status === st).length;
    return [
      { key: "activas", label: "Verticales activas", count: count("ACTIVA"), icon: CheckCircle2, accent: "#10b981", to: "/admin/verticals" },
      { key: "desarrollo", label: "En desarrollo", count: count("DESARROLLO"), icon: Wrench, accent: "#f59e0b", to: "/admin/verticals" },
      { key: "planeacion", label: "En planeación", count: count("PLANEACION"), icon: ClipboardList, accent: "#64748b", to: "/admin/verticals" },
      { key: "pausadas", label: "Pausadas / deshabilitadas", count: count("PAUSADA") + count("DESHABILITADA"), icon: Layers, accent: "#ef4444", to: "/admin/verticals", tone: "alert" },
    ];
  }, [verticals]);

  const revenueByVertical = useMemo(() => (verticals || []).map((v) => ({ label: short(v.name), value: Math.round(v.mrr / 1000) })), [verticals]);
  const orgsByVertical = useMemo(() => (verticals || []).map((v) => ({ label: short(v.name), value: v.orgs })), [verticals]);
  const growthByVertical = useMemo(() => (verticals || []).map((v) => ({ label: short(v.name), value: v.growth })), [verticals]);
  const statusDistribution = useMemo(() => {
    const c = (st) => (verticals || []).filter((v) => v.status === st).length;
    return [
      { label: "Activa", value: c("ACTIVA"), color: "#10b981" },
      { label: "Desarrollo", value: c("DESARROLLO"), color: "#f59e0b" },
      { label: "Planeación", value: c("PLANEACION"), color: "#64748b" },
      { label: "Pausada", value: c("PAUSADA"), color: "#f97316" },
      { label: "Deshabilitada", value: c("DESHABILITADA"), color: "#ef4444" },
    ];
  }, [verticals]);

  const handleAction = useCallback(async (id, action) => {
    const status = ACTION_STATUS[action];
    if (!status) return;
    setBusyId(id);
    try {
      await verticalsService.setStatus(id, status); // mock → no-op; backend → PATCH
      setVerticals((prev) => prev.map((v) => (v._id === id ? { ...v, status } : v)));
    } finally {
      setBusyId(null);
    }
  }, []);

  const metricCards = [
    { title: "Verticales totales", value: n(kpis.totalVerticals), icon: Layers, accent: "#3b82f6" },
    { title: "Verticales activas", value: n(kpis.activeVerticals), icon: CheckCircle2, accent: "#10b981" },
    { title: "Organizaciones", value: n(kpis.totalOrgs), icon: Building2, accent: "#6366f1" },
    { title: "Usuarios totales", value: n(kpis.totalUsers), icon: Users, accent: "#8b5cf6" },
    { title: "Planes activos", value: n(kpis.activePlans), icon: ClipboardList, accent: "#ec4899" },
    { title: "Ingresos (MRR)", value: money(kpis.totalMrr), icon: DollarSign, accent: "#f97316" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#f97316]/30 bg-[#f97316]/[0.06] px-4 py-2.5 text-xs text-[#fdba74]">
        Motor Multivertical · Punto Cero System OS · Punto Cero Legal es la única vertical productiva; el resto queda preparada · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Verticales</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Tarjetas de vertical con acciones de ciclo de vida */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Verticales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(verticals || []).map((v) => (
            <VerticalCard key={v._id} vertical={v} onAction={handleAction} busy={busyId === v._id} />
          ))}
        </div>
      </section>

      {/* Analítica ejecutiva */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica por vertical</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={revenueByVertical} title="Ingresos por vertical (miles COP)" />
          <CasesChart data={orgsByVertical} title="Organizaciones por vertical" />
          <ConversionChart data={growthByVertical} title="Crecimiento por vertical (%)" />
          <CasesChart data={statusDistribution} title="Distribución por estado" />
        </div>
      </section>

      {/* Directorio */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Directorio de verticales</h2>
        <VerticalDirectory data={verticals} />
      </section>
    </div>
  );
}

export default VerticalsDashboard;
