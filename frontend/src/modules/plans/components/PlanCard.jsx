import React from "react";
import { Users, FolderKanban, HardDrive, Sparkles, Video, Receipt, Code2, Pencil, Copy, Power, PowerOff } from "lucide-react";
import { PlanStatusBadge } from "./PlanStatusBadge";
import { localPrice, formatMoney } from "../currency";
import { describeLimit } from "../access";

/**
 * Tarjeta de plan: precio base USD + precio local, límites y acciones
 * (editar, duplicar, activar/desactivar). currency = objeto del catálogo.
 */
export function PlanCard({ plan, currency, onAction, busy = false }) {
  const p = plan || {};
  const l = p.limits || {};
  const isActive = p.status === "ACTIVO";
  const local = localPrice(p, currency);

  const Btn = ({ action, icon: Icon, label, cls }) => (
    <button type="button" title={label} aria-label={label} disabled={busy}
      onClick={() => onAction?.(p._id, action)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${cls}`}
      data-testid={`plan-${action}-${p._id}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  const Feature = ({ icon: Icon, on, label }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] ${on ? "text-[#10b981]" : "text-white/30 line-through"}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 transition-all hover:border-white/25 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{p.name}</div>
          <div className="text-[11px] text-white/40">{p.orgs} organizaciones</div>
        </div>
        <PlanStatusBadge status={p.status} />
      </div>

      {/* Precios */}
      <div className="mt-4">
        <div className="text-2xl font-bold text-white">{formatMoney(local, currency?.currency_code || "USD")}</div>
        <div className="text-[11px] text-white/40">
          Base {formatMoney(p.priceUsd, "USD")} · {currency?.country || "—"} ({currency?.currency_code || "USD"})
        </div>
      </div>

      {/* Límites */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60">
        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {describeLimit(l.max_users)} usuarios</span>
        <span className="inline-flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" /> {describeLimit(l.max_cases)} casos</span>
        <span className="inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {describeLimit(l.max_storage)} GB</span>
        <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> {describeLimit(l.max_ai_requests)} IA</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <Feature icon={Video} on={l.video_enabled} label="Video" />
        <Feature icon={Receipt} on={l.billing_enabled} label="Facturación" />
        <Feature icon={Code2} on={l.api_enabled} label="API" />
        <span className="text-[11px] text-white/50">Soporte: <span className="text-white/80 capitalize">{l.support_level}</span></span>
      </div>

      {/* Acciones */}
      <div className="mt-auto pt-4 border-t border-white/10 flex flex-wrap gap-2">
        <Btn action="edit" icon={Pencil} label="Editar" cls="border-white/10 bg-white/5 text-white/70 hover:bg-white/10" />
        <Btn action="duplicate" icon={Copy} label="Duplicar" cls="border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#93c5fd] hover:bg-[#3b82f6]/20" />
        {isActive ? (
          <Btn action="deactivate" icon={PowerOff} label="Desactivar" cls="border-[#ef4444]/30 bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20" />
        ) : (
          <Btn action="activate" icon={Power} label="Activar" cls="border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20" />
        )}
      </div>
    </div>
  );
}

export default PlanCard;
