import React from "react";
import { DollarSign, TrendingUp, Receipt, Wallet, BarChart3 } from "lucide-react";
import { MetricCard } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

/**
 * Analítica de ingresos — MRR, ARR, facturación mensual/acumulada, ticket promedio.
 * Reutiliza MetricCard.
 * props.data: { mrr, arr, monthlyBilling, accumulated, avgTicket }
 */
export function RevenueAnalytics({ data }) {
  const d = data || {};
  const cards = [
    { title: "MRR", value: money(d.mrr), icon: DollarSign, accent: "#10b981", subtitle: "ingreso mensual" },
    { title: "ARR", value: money(d.arr), icon: TrendingUp, accent: "#8b5cf6", subtitle: "ingreso anual" },
    { title: "Facturación mensual", value: money(d.monthlyBilling), icon: Receipt, accent: "#f97316" },
    { title: "Facturación acumulada", value: money(d.accumulated), icon: BarChart3, accent: "#3b82f6" },
    { title: "Ticket promedio", value: money(d.avgTicket), icon: Wallet, accent: "#ec4899" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => <MetricCard key={c.title} {...c} />)}
    </div>
  );
}

export default RevenueAnalytics;
