import React, { useState, useMemo } from "react";
import { Bell, Monitor, Mail, MessageCircle } from "lucide-react";
import { MetricCard } from "@/shared/components";
import { CasesChart } from "@/shared/charts";
import { useNotifications } from "@/hooks/os";

const CHANNEL_META = {
  platform: { icon: Monitor, label: "Plataforma", color: "#3b82f6" },
  email: { icon: Mail, label: "Email", color: "#f97316" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "#10b981" },
};

/** Centro de Notificaciones Inteligentes — Punto Cero System OS. */
export function NotificationsDashboard() {
  const { data } = useNotifications();
  const [channel, setChannel] = useState("");

  const list = useMemo(
    () => (data.NOTIFICATIONS || []).filter((nt) => !channel || nt.channel === channel),
    [data.NOTIFICATIONS, channel]
  );

  const kpis = [
    { title: "Total notificaciones", value: `${data.KPIS.total}`, icon: Bell, accent: "#8b5cf6" },
    { title: "Plataforma", value: `${data.KPIS.platform}`, icon: Monitor, accent: "#3b82f6" },
    { title: "Email", value: `${data.KPIS.email}`, icon: Mail, accent: "#f97316" },
    { title: "WhatsApp (preparado)", value: `${data.KPIS.whatsapp}`, icon: MessageCircle, accent: "#10b981" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#8b5cf6]/30 bg-[#8b5cf6]/[0.06] px-4 py-2.5 text-xs text-[#c4b5fd]">
        Notificaciones inteligentes generadas por el núcleo comercial · canales: plataforma · email · WhatsApp (futuro) · datos de demostración.
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      <section className="flex items-center gap-2">
        <span className="text-xs text-white/40">Canal:</span>
        {["", "platform", "email", "whatsapp"].map((c) => (
          <button key={c || "all"} onClick={() => setChannel(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${channel === c ? "bg-[#3b82f6]/30 text-white" : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"}`}>
            {c ? CHANNEL_META[c].label : "Todos"}
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md divide-y divide-white/5">
          {list.map((nt) => {
            const meta = CHANNEL_META[nt.channel] || CHANNEL_META.platform;
            const Icon = meta.icon;
            return (
              <div key={nt.id} className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}40` }}>
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{nt.title}</div>
                    <div className="text-[10px] text-white/40 whitespace-nowrap">{nt.createdAt}</div>
                  </div>
                  <div className="text-xs text-white/60 mt-0.5">{nt.message}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: meta.color }}>{meta.label}</div>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div className="p-8 text-center text-sm text-white/40">Sin notificaciones en este canal</div>}
        </div>
        <CasesChart data={data.BY_CHANNEL} title="Notificaciones por canal" />
      </section>
    </div>
  );
}

export default NotificationsDashboard;
