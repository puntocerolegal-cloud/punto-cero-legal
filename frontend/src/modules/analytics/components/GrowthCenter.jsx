import React from "react";
import { Building2, Handshake, Rocket, CreditCard } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { RevenueChart } from "@/shared/charts";

const n = (v) => Number(v || 0).toLocaleString("es-CO");

/**
 * Centro de Crecimiento — nuevas organizaciones/partners/implementaciones/
 * suscripciones + tendencia. Reutiliza MetricCard y RevenueChart.
 * props.data: { newOrgs, newPartners, newImplementations, newSubscriptions, trend[] }
 */
export function GrowthCenter({ data }) {
  const d = data || {};
  const cards = [
    { title: "Nuevas organizaciones", value: n(d.newOrgs), icon: Building2, accent: "#3b82f6" },
    { title: "Nuevos partners", value: n(d.newPartners), icon: Handshake, accent: "#ec4899" },
    { title: "Nuevas implementaciones", value: n(d.newImplementations), icon: Rocket, accent: "#f97316" },
    { title: "Nuevas suscripciones", value: n(d.newSubscriptions), icon: CreditCard, accent: "#10b981" },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1 grid grid-cols-2 gap-4">
        {cards.map((c) => <MetricCard key={c.title} {...c} />)}
      </div>
      <div className="lg:col-span-2">
        <RevenueChart data={d.trend || []} title="Tendencia de crecimiento (nuevas altas/mes)" accent="#10b981" />
      </div>
    </div>
  );
}

export default GrowthCenter;
