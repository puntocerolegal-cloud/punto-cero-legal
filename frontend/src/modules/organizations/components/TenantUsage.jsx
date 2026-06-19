import React from "react";
import { HardDrive, Users, FileText, Activity } from "lucide-react";

/**
 * Uso del tenant — almacenamiento, usuarios activos, documentos, consumo mensual.
 * Barras visuales.
 * props.tenant: { storageUsedGb, storageTotalGb, activeUsers, documents, monthlyConsumption }
 * props.totalUsers: usuarios totales de la organización (para el ratio de activos).
 */
function UsageBar({ icon: Icon, label, used, total, unit = "", accent = "#f97316", display }) {
  const pct = total ? Math.max(0, Math.min(100, Math.round((used / total) * 100))) : used;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="inline-flex items-center gap-2 text-white/60"><Icon className="w-3.5 h-3.5" /> {label}</span>
        <span className="font-semibold text-white">{display}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 85 ? "#ef4444" : accent }} />
      </div>
    </div>
  );
}

export function TenantUsage({ tenant, totalUsers }) {
  const t = tenant || {};
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Uso del tenant</h3>
      <div className="space-y-4">
        <UsageBar
          icon={HardDrive} label="Almacenamiento" accent="#3b82f6"
          used={t.storageUsedGb} total={t.storageTotalGb}
          display={`${t.storageUsedGb ?? 0} / ${t.storageTotalGb ?? 0} GB`}
        />
        <UsageBar
          icon={Users} label="Usuarios activos" accent="#10b981"
          used={t.activeUsers} total={totalUsers || t.activeUsers}
          display={`${t.activeUsers ?? 0} / ${totalUsers ?? t.activeUsers ?? 0}`}
        />
        <UsageBar
          icon={FileText} label="Documentos" accent="#8b5cf6"
          used={Math.min(100, ((t.documents ?? 0) / 12000) * 100)} total={100}
          display={`${(t.documents ?? 0).toLocaleString("es-CO")}`}
        />
        <UsageBar
          icon={Activity} label="Consumo mensual" accent="#f97316"
          used={t.monthlyConsumption} total={100}
          display={`${t.monthlyConsumption ?? 0}%`}
        />
      </div>
    </div>
  );
}

export default TenantUsage;
