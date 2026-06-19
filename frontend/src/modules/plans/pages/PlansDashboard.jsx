import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Tag, Building2, DollarSign, CalendarRange, TrendingUp, Plus } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart, RevenueChart } from "@/shared/charts";
import { OperationsCenter } from "@/modules/admin/components/OperationsCenter";
import { PlanCard } from "../components/PlanCard";
import { PlanDirectory } from "../components/PlanDirectory";
import { PlanFormModal } from "../components/PlanFormModal";
import { CurrencySelector } from "../components/CurrencySelector";
import { findCurrency, formatMoney, convertFromUsd } from "../currency";
import { usePlans } from "@/hooks/os";
import { plansService } from "@/services/os";

const n = (v) => Number(v || 0).toLocaleString("es-CO");

/** Motor de Planes centralizado (multimoneda) — Punto Cero System OS. */
export function PlansDashboard() {
  const { data } = usePlans();
  const [plans, setPlans] = useState(data.PLANS);
  const [currencyCode, setCurrencyCode] = useState(data.DEFAULT_CURRENCY_CODE || "USD");
  const [busyId, setBusyId] = useState(null);
  const [modal, setModal] = useState(null); // { plan, mode }

  useEffect(() => { setPlans(data.PLANS); }, [data.PLANS]);

  const currencies = useMemo(() => data.CURRENCIES || [], [data.CURRENCIES]);
  const currency = useMemo(() => findCurrency(currencies, currencyCode) || currencies[0], [currencies, currencyCode]);

  const kpis = useMemo(() => {
    const list = plans || [];
    const monthlyUsd = list.reduce((s, p) => s + p.priceUsd * (p.orgs || 0), 0);
    return {
      activePlans: list.filter((p) => p.status === "ACTIVO").length,
      totalOrgs: list.reduce((s, p) => s + (p.orgs || 0), 0),
      monthlyLocal: convertFromUsd(monthlyUsd, currency),
      annualLocal: convertFromUsd(monthlyUsd * 12, currency),
      growth: data.KPIS?.growth ?? 0,
    };
  }, [plans, currency, data.KPIS]);

  const code = currency?.currency_code || "USD";

  const ops = useMemo(() => [
    { key: "active", label: "Planes activos", count: kpis.activePlans, icon: Tag, accent: "#10b981", to: "/admin/plans" },
    { key: "orgs", label: "Organizaciones con plan", count: kpis.totalOrgs, icon: Building2, accent: "#3b82f6", to: "/admin/plans" },
    { key: "inactive", label: "Planes inactivos", count: (plans || []).filter((p) => p.status === "INACTIVO").length, icon: Tag, accent: "#64748b", to: "/admin/plans" },
    { key: "enterprise", label: "Organizaciones Enterprise", count: (plans || []).find((p) => p.slug === "consolidacion-empresarial")?.orgs ?? 0, icon: DollarSign, accent: "#f97316", to: "/admin/plans" },
  ], [plans, kpis]);

  const revenueByPlan = useMemo(() => (plans || []).map((p) => ({ label: p.name.split(" ").slice(-1)[0], value: Math.round(convertFromUsd(p.priceUsd * (p.orgs || 0), currency)) })), [plans, currency]);
  const orgsByPlan = useMemo(() => (plans || []).map((p) => ({ label: p.name.split(" ").slice(-1)[0], value: p.orgs })), [plans]);

  const handleAction = useCallback(async (id, action) => {
    const plan = (plans || []).find((p) => p._id === id);
    if (action === "edit") return setModal({ plan, mode: "edit" });
    if (action === "duplicate") return setModal({ plan, mode: "duplicate" });
    setBusyId(id);
    try {
      const status = action === "activate" ? "ACTIVO" : "INACTIVO";
      await plansService.setStatus(id, status);
      setPlans((prev) => prev.map((p) => (p._id === id ? { ...p, status } : p)));
    } finally {
      setBusyId(null);
    }
  }, [plans]);

  const handleSave = useCallback(async (payload) => {
    if (payload._id) {
      await plansService.update(payload._id, payload);
      setPlans((prev) => prev.map((p) => (p._id === payload._id ? { ...p, ...payload } : p)));
    } else {
      const created = { ...payload, _id: `plan-${Date.now()}`, orgs: 0, slug: payload.name.trim().toLowerCase().replace(/\s+/g, "-") };
      await plansService.create(payload);
      setPlans((prev) => [...prev, created]);
    }
    setModal(null);
  }, []);

  const metricCards = [
    { title: "Planes activos", value: n(kpis.activePlans), icon: Tag, accent: "#10b981" },
    { title: "Organizaciones por plan", value: n(kpis.totalOrgs), icon: Building2, accent: "#3b82f6" },
    { title: "Ingreso mensual", value: formatMoney(kpis.monthlyLocal, code), icon: DollarSign, accent: "#8b5cf6" },
    { title: "Ingreso anual", value: formatMoney(kpis.annualLocal, code), icon: CalendarRange, accent: "#ec4899" },
    { title: "Crecimiento", value: `${kpis.growth}%`, icon: TrendingUp, accent: "#f97316" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#f97316]/30 bg-[#f97316]/[0.06] px-4 py-2.5 text-xs text-[#fdba74]">
        Motor de Planes · multimoneda · moneda base USD · Punto Cero System OS · datos de demostración (sin backend conectado).
      </div>

      {/* KPIs + selector de moneda */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Dashboard de planes</h2>
          <div className="flex items-center gap-3">
            <CurrencySelector currencies={currencies} value={currencyCode} onChange={setCurrencyCode} />
            <button onClick={() => setModal({ plan: null, mode: "create" })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold" data-testid="plan-create-btn">
              <Plus className="w-4 h-4" /> Crear plan
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((k) => <MetricCard key={k.title} {...k} />)}
        </div>
      </section>

      {/* Centro de Operaciones */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Centro de Operaciones · Planes</h2>
        <OperationsCenter items={ops} />
      </section>

      {/* Tarjetas de plan */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Planes oficiales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {(plans || []).map((p) => (
            <PlanCard key={p._id} plan={p} currency={currency} onAction={handleAction} busy={busyId === p._id} />
          ))}
        </div>
      </section>

      {/* Analítica */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Analítica de planes ({code})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={revenueByPlan} title={`Ingreso por plan (${code})`} />
          <CasesChart data={orgsByPlan} title="Organizaciones por plan" />
        </div>
      </section>

      {/* Directorio */}
      <section>
        <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Directorio de planes</h2>
        <PlanDirectory data={plans} currency={currency} onRowClick={(p) => setModal({ plan: p, mode: "edit" })} />
      </section>

      {modal && (
        <PlanFormModal plan={modal.plan} mode={modal.mode} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}

export default PlansDashboard;
