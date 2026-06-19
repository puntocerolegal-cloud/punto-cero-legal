import React from "react";
import { Bot, CheckCircle2, TrendingUp, Smile } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart } from "@/shared/charts";
import { CommercialAssistant } from "@/components/commerce/CommercialAssistant";
import { useCommercialAI } from "@/hooks/os";

/** IA Comercial nativa — Punto Cero System OS. Sin vendedores ni formularios. */
export function CommercialAIDashboard() {
  const { data } = useCommercialAI();

  const kpis = [
    { title: "Consultas resueltas", value: `${data.KPIS.resolved}`, icon: CheckCircle2, accent: "#10b981" },
    { title: "Conversiones asistidas", value: `${data.KPIS.conversions}`, icon: TrendingUp, accent: "#f97316" },
    { title: "Temas cubiertos", value: `${data.KPIS.topics}`, icon: Bot, accent: "#3b82f6" },
    { title: "Satisfacción", value: `${data.KPIS.satisfaction}%`, icon: Smile, accent: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#f97316]/30 bg-[#f97316]/[0.06] px-4 py-2.5 text-xs text-[#fdba74]">
        IA Comercial nativa · responde planes, límites, trial, demo, pagos y referidos · sin contacto humano ni formularios de venta.
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Asistente</h2>
          <CommercialAssistant />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-white/50 font-semibold">Preguntas frecuentes</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/5">
            {data.FAQ.map((f, i) => (
              <details key={i} className="group p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white/90 list-none flex items-center justify-between">
                  {f.q}<span className="text-white/40 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="mt-2 text-xs text-white/60 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <CasesChart data={data.TOPICS} title="Consultas por tema" />
        </div>
      </section>
    </div>
  );
}

export default CommercialAIDashboard;
