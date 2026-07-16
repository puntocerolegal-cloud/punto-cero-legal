import React from "react";
import { EnterpriseSubscriptionPanel } from "../components/EnterpriseSubscriptionPanel";
import { useFirmBranding } from "../context/FirmBrandingContext";
import {
  Users, FolderKanban, TrendingUp, Calendar,
  AlertCircle, CheckCircle2, Clock, FileText,
  Zap, ArrowRight, BarChart3, Activity
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useFirmOnboarding } from "@/hooks/useFirmOnboarding";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { usePreferences } from "../hooks/usePreferences";
import { useAutomation } from "../hooks/useAutomation";
import { useNotifications } from "../hooks/useNotifications";
import { buildDashboardViewModel } from "../application";
import { buildDashboardExportViewModel } from "../application/exportApplication";
import { buildDashboardPreferences } from "../application/preferencesApplication";
import { buildDashboardChartsViewModel } from "../application/chartsApplication";
import { buildAutomationHealthCard } from "../application/notificationApplication";
import { SectionCard } from "../components/shared/SectionCard";
import { KPICard } from "../components/shared/KPICard";
import { LoadingState } from "../components/shared/LoadingState";
import { ExportButton } from "../components/export/ExportButton";
import { PreferenceButton } from "../components/preferences/PreferenceButton";
import { DashboardWidget } from "../components/charts/DashboardWidget";
import AutomationHealthCard from "../components/automation/AutomationHealthCard";
import AutomationTimeline from "../components/automation/AutomationTimeline";
import { useNavigate } from "react-router-dom";

const CapacityBar = ({ used, total, label, color = "#3b82f6" }) => {
  const percentage = Math.round((used / total) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-sm font-semibold text-white">{used}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full transition-all" style={{ width: `${percentage}%`, background: color }}></div>
      </div>
      <p className="mt-1 text-xs text-white/50">{percentage}% utilizado</p>
    </div>
  );
};

const AlertItem = ({ icon: Icon, title, description, type = "warning" }) => {
  const colors = {
    warning: "bg-amber-500/20 border-amber-500/30 text-amber-300",
    danger: "bg-red-500/20 border-red-500/30 text-red-300",
    info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[type]}`}>
      <div className="flex gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-90 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
};

const iconMap = {
  "ArrowRight": ArrowRight,
  "Calendar": Calendar,
  "FileText": FileText,
};

export function FirmDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { access } = useSubscription();
  useFirmOnboarding();

  // Nombre real de la firma (nunca el ID interno). Fuente: contexto White Label.
  const { name: firmName } = useFirmBranding();

  const { loading, error, lawyers, cases, clients } = useFirmCoreData();
  const { preferences } = usePreferences();
  const { automationVM, history } = useAutomation(lawyers, cases, clients);
  const { notifications, timelineVM, recommendationsCenter } = useNotifications(
    automationVM?.alerts || [],
    automationVM?.recommendations || [],
    history
  );

  if (loading) return <LoadingState message="Cargando Centro de Operaciones..." />;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6"><p className="text-red-400">{error}</p></div>;

  const vm = buildDashboardViewModel(lawyers, cases, clients, access?.plan?.name);

  const kpis = [
    { label: 'Abogados Activos', value: vm.teamSection.metrics[0]?.value || 0, status: 'Normal' },
    { label: 'Casos Abiertos', value: vm.casesSection.metrics[0]?.value || 0, status: 'Normal' },
    { label: 'Clientes', value: vm.casesSection.metrics[3]?.value || 0, status: 'Normal' },
  ];
  const exportVM = buildDashboardExportViewModel(kpis, vm.alertsSection?.alerts || [], user);
  const chartsVM = buildDashboardChartsViewModel(lawyers, cases, clients, vm.alertsSection?.alerts || []);
  const dashboardPrefsVM = buildDashboardPreferences(preferences);
  const healthCard = buildAutomationHealthCard(automationVM);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Centro de Operaciones</h1>
        <div className="flex items-center gap-2">
          <PreferenceButton preferencesPanel={<p className="text-xs text-white/60">Preferencias de dashboard disponibles</p>} />
          <ExportButton exportViewModel={exportVM} />
        </div>
      </div>

      <SectionCard title="1. Estado de la Firma">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/50 uppercase">Nombre</p>
                <p className="text-lg font-semibold text-white">{firmName}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase">Plan</p>
                <p className="text-lg font-semibold text-white">{access?.plan?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase">Estado</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${access?.status === 'ACTIVO' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <p className={`font-semibold ${access?.status === 'ACTIVO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {access?.status === 'ACTIVO' ? 'Activa' : 'Trial'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <CapacityBar used={vm.capacityBar.used} total={vm.capacityBar.total} label={vm.capacityBar.label} color={vm.capacityBar.color} />
            <button onClick={() => navigate('/firm-os/settings')} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Actualizar Plan
            </button>
          </div>
        </div>
      </SectionCard>

      <EnterpriseSubscriptionPanel />

      <SectionCard title={vm.teamSection.title}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {vm.teamSection.metrics.map((metric) => (
            <KPICard key={metric.key} icon={[Users, CheckCircle2, Calendar, TrendingUp, Clock][vm.teamSection.metrics.indexOf(metric)]} label={metric.label} value={metric.value} color={metric.color} />
          ))}
        </div>
        <button onClick={() => navigate('/firm-os/team')} className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          Administrar Equipo
        </button>
      </SectionCard>

      <SectionCard title={vm.casesSection.title}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {vm.casesSection.metrics.map((metric) => (
            <KPICard key={metric.key} icon={[FolderKanban, AlertCircle, CheckCircle2, Users, FileText, Zap][vm.casesSection.metrics.indexOf(metric)]} label={metric.label} value={metric.value} color={metric.color} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={vm.activitySection.title}>
        <div className="space-y-3">
          {vm.activitySection.items.map((item, idx) => {
            const Icon = iconMap[item.icon] || ArrowRight;
            const colorMap = { blue: "text-blue-400", amber: "text-amber-400", purple: "text-purple-400" };
            return (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${colorMap[item.color]}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-white/60">{item.sublabel}</p>
                  </div>
                </div>
                <span className={`text-2xl font-bold ${colorMap[item.color]}`}>{item.value}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title={vm.alertsSection.title}>
        <div className="space-y-3">
          {vm.alertsSection.alerts.map((alert, idx) => {
            const iconMap2 = {
              "cases-no-lawyer": FolderKanban,
              "overloaded-lawyers": TrendingUp,
              "upcoming-hearings": Calendar,
              "plan-capacity": Zap,
              "clients-no-follow": TrendingUp,
              "pending-docs": FileText,
              "all-clear": CheckCircle2,
            };
            const Icon = iconMap2[alert.id] || AlertCircle;
            return (
              <AlertItem
                key={idx}
                icon={Icon}
                title={alert.title}
                description={alert.description}
                type={alert.type === "critical" ? "danger" : alert.type}
              />
            );
          })}
        </div>
      </SectionCard>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white mt-12">Centro Inteligente</h2>
          <button
            onClick={() => navigate('/firm-os/mission-control')}
            className="mt-12 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-300 hover:from-green-500/30 hover:to-blue-500/30 transition-all text-sm font-medium"
          >
            <Activity size={16} />
            Mission Control
            <ArrowRight size={14} className="ml-1" />
          </button>
        </div>

        <AutomationHealthCard health={healthCard} status={healthCard.status} />

        {recommendationsCenter?.topRecommendations?.length > 0 && (
          <SectionCard title="Recomendaciones Prioritarias">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendationsCenter.topRecommendations.map((rec, idx) => (
                <div key={idx} className="p-4 border border-amber-200 rounded-lg bg-amber-50">
                  <p className="font-semibold text-sm text-amber-900">{rec.title}</p>
                  <p className="text-xs text-amber-700 mt-1">{rec.description}</p>
                  <span className="mt-2 inline-block text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded">
                    Prioridad: {rec.priority}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {timelineVM?.events?.length > 0 && (
          <SectionCard title="Timeline de Automatización">
            <AutomationTimeline events={timelineVM.events.slice(0, 5)} limit={5} />
          </SectionCard>
        )}
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white mt-12">Inteligencia de Negocios</h2>
        <div className="space-y-6">
          {chartsVM.widgets.map(widget => (
            <DashboardWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FirmDashboard;
