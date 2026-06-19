import React from "react";
import { Users, DollarSign, TrendingUp, TrendingDown, RefreshCw, Receipt } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { KPIS } from "../mockData";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

/**
 * KPIs ejecutivos SaaS — reutiliza MetricCard.
 */
export function MRRMetrics({ data = KPIS }) {
  const kpis = [
    { title: "Clientes activos", value: n(data.activeClients), icon: Users, accent: "#3b82f6" },
    { title: "MRR", value: money(data.mrr), icon: DollarSign, accent: "#10b981", subtitle: "ingreso mensual" },
    { title: "ARR", value: money(data.arr), icon: TrendingUp, accent: "#8b5cf6", subtitle: "ingreso anual" },
    { title: "Churn", value: `${data.churn}%`, icon: TrendingDown, accent: "#ef4444" },
    { title: "Renovaciones", value: n(data.renewals), icon: RefreshCw, accent: "#f97316", subtitle: "próximas" },
    { title: "Facturación mensual", value: money(data.monthlyBilling), icon: Receipt, accent: "#ec4899" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
    </div>
  );
}

export default MRRMetrics;
