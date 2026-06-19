import React from "react";
import { Building2, DollarSign, TrendingUp, Receipt, Rocket, Target } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { KPIS } from "../mockData";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

/**
 * Panel superior de KPIs ejecutivos globales — reutiliza MetricCard.
 */
export function KpiOverview({ data = KPIS }) {
  const kpis = [
    { title: "Organizaciones activas", value: n(data.activeOrgs), icon: Building2, accent: "#3b82f6" },
    { title: "MRR total", value: money(data.mrr), icon: DollarSign, accent: "#10b981", subtitle: "mensual" },
    { title: "ARR total", value: money(data.arr), icon: TrendingUp, accent: "#8b5cf6", subtitle: "anual" },
    { title: "Facturación acumulada", value: money(data.totalBilled), icon: Receipt, accent: "#f97316" },
    { title: "Implementaciones activas", value: n(data.activeImplementations), icon: Rocket, accent: "#ec4899" },
    { title: "Conversión global", value: `${data.globalConversion}%`, icon: Target, accent: "#f59e0b" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
    </div>
  );
}

export default KpiOverview;
