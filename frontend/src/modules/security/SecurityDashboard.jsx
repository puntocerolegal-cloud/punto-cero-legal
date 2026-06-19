import React, { useMemo } from "react";
import { Building2, User, ShieldCheck, Activity, ShieldAlert } from "lucide-react";
import { MetricCard, StatusBadge, Timeline, EmptyState } from "@/shared/components";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/context/TenantContext";
import { toOsRole } from "@/security/roles";
import { auditService } from "@/security/audit/auditService";
import { healthService } from "@/services/system/health.service";

/**
 * Security Dashboard — Punto Cero OS (solo UI).
 * Tenant activo, usuario y rol actuales, últimos eventos de auditoría y alertas.
 */
export function SecurityDashboard() {
  const { user } = useAuth();
  const { tenant, tenantName, vertical, plan } = useTenant();
  const osRole = toOsRole(user?.role);

  const events = useMemo(() => auditService.getRecent(10), []);
  const tenantHealth = healthService.checkTenant(tenant);

  const timelineItems = events.map((e) => ({
    date: e.at,
    user: e.user,
    action: e.action,
    comment: e.detail,
    status: "normal",
  }));

  // Alertas de acceso (derivadas; demo).
  const alerts = [
    !tenantHealth.ok && { tone: "riesgo", text: "No hay un tenant válido activo." },
    osRole === "CLIENT" && { tone: "atencion", text: "Sesión con rol CLIENT: acceso limitado a módulos del OS." },
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/[0.06] px-4 py-2.5 text-xs text-[#93c5fd]">
        Centro de Seguridad · estado de tenant, identidad y auditoría · datos de demostración.
      </div>

      {/* Estado de identidad y tenant */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Tenant activo" value={tenantName || "—"} icon={Building2} accent="#3b82f6" subtitle={vertical ? `${vertical} · ${plan || ""}` : ""} />
        <MetricCard title="Usuario actual" value={user?.full_name || user?.email || "—"} icon={User} accent="#10b981" />
        <MetricCard title="Rol (OS)" value={osRole} icon={ShieldCheck} accent="#f97316" subtitle={user?.role ? `app: ${user.role}` : ""} />
        <MetricCard title="Eventos registrados" value={events.length} icon={Activity} accent="#8b5cf6" />
      </section>

      {/* Estado del tenant */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Aislamiento de tenant</h3>
        <div className="flex items-center gap-3">
          <StatusBadge tone={tenantHealth.ok ? "normal" : "riesgo"} label={tenantHealth.ok ? "Aislado" : "Sin tenant"} />
          <span className="text-sm text-white/60">{tenantHealth.detail}</span>
        </div>
      </section>

      {/* Alertas de acceso */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-3">Alertas de acceso</h3>
        {alerts.length ? (
          <ul className="space-y-3">
            {alerts.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <StatusBadge tone={a.tone} />
                <span className="text-sm text-white/70">{a.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={ShieldAlert} title="Sin alertas de acceso" className="border-0 bg-transparent py-8" />
        )}
      </section>

      {/* Auditoría */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm uppercase tracking-wider text-white/50 font-semibold mb-4">Últimos eventos</h3>
        {timelineItems.length ? (
          <Timeline items={timelineItems} />
        ) : (
          <EmptyState icon={Activity} title="Sin eventos de auditoría" description="Los eventos de seguridad (login, cambio de tenant, etc.) aparecerán aquí." className="border-0 bg-transparent py-8" />
        )}
      </section>
    </div>
  );
}

export default SecurityDashboard;
