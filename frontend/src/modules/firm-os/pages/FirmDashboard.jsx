import React, { useState, useEffect } from "react";
import {
  Users, FolderKanban, TrendingUp, Calendar,
  AlertCircle, CheckCircle2, Clock, FileText,
  Zap, ArrowRight, BarChart3, Activity, Crown, ArrowUpCircle
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
import axios from "axios";
import { API } from "@/config/api";

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

  const [planInfo, setPlanInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [firmData, setFirmData] = useState(null);

  const { loading, error, lawyers, cases, clients } = useFirmCoreData();

  // Cargar información del plan y trial desde /firms/my-plan
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await axios.get(`${API}/firms/my-plan`);
        setPlanInfo(res.data);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error('No plan data', e);
      }
    };
    loadPlan();
  }, []);

  // Actualizar tiempo cada segundo para el contador
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos de la firma para obtener el nombre del propietario
  useEffect(() => {
    const loadFirmData = async () => {
      if (!user?.firm_id) return;
      try {
        const res = await axios.get(`${API}/firms/${user.firm_id}`);
        setFirmData(res.data);
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error('No firm data', e);
      }
    };
    loadFirmData();
  }, [user?.firm_id]);

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

  // Lógica del trial usando datos reales del backend
  const trial = planInfo?.trial;
  const trialMs = trial?.ends_at ? new Date(trial.ends_at).getTime() - currentTime.getTime() : null;
  const trialLeft = trialMs == null ? null : {
    expired: trialMs <= 0,
    d: Math.max(0, Math.floor(trialMs / 86400000)),
    h: Math.max(0, Math.floor((trialMs % 86400000) / 3600000)),
    m: Math.max(0, Math.floor((trialMs % 3600000) / 60000)),
    s: Math.max(0, Math.floor((trialMs % 60000) / 1000)),
  };
  const showTrial = planInfo?.subscription_status === "trial" && trialLeft && !trialLeft.expired;
  const pad = (n) => String(n).padStart(2, '0');

  const activePlan = planInfo?.has_plan ? planInfo : null;

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
      {/* Encabezado institucional con banner y logo */}
      <div 
        className="relative rounded-2xl overflow-hidden p-6 lg:p-8"
        style={{
          backgroundImage: firmConfig?.cover_image_url ? `url(${firmConfig.cover_image_url})` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Logo oficial o fallback institucional */}
            {firmConfig?.logo_url ? (
              <img 
                src={firmConfig.logo_url} 
                alt="Logo de la firma" 
                className="h-12 w-12 object-contain"
              />
            ) : (
              <img 
                src="/logo-pd-system.png" 
                alt="Punto Cero Legal" 
                className="h-12 w-12 object-contain"
              />
            )}
            <div>
              <h1 
                className="text-3xl font-bold"
                style={{ 
                  color: firmConfig?.primary_color || '#ffffff',
                  textShadow: `0 0 20px ${firmConfig?.primary_color || '#ffffff'}40`
                }}
              >
                {firmConfig?.commercial_name || 'Centro de Operaciones'}
              </h1>
              {firmConfig?.commercial_name && (
                <p className="text-sm text-white/70 mt-1">Centro de Operaciones</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PreferenceButton preferencesPanel={<p className="text-xs text-white/60">Preferencias de dashboard disponibles</p>} />
            <ExportButton exportViewModel={exportVM} />
          </div>
        </div>
      </div>

      <SectionCard title="1. Estado de la Firma">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-white/50 uppercase">Nombre Comercial</p>
                <p className="text-lg font-semibold text-white">
                  {firmConfig?.commercial_name || firmData?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase">Propietario</p>
                <p className="text-lg font-semibold text-white">
                  {firmData?.owner_name || user?.full_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase">Estado</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${planInfo?.subscription_status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <p className={`font-semibold ${planInfo?.subscription_status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {planInfo?.subscription_status === 'active' ? 'Suscripción Activa' : (showTrial ? 'Trial Activo' : (trialLeft?.expired ? 'Trial Expirado' : 'Trial'))}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <CapacityBar used={vm.capacityBar.used} total={vm.capacityBar.total} label={vm.capacityBar.label} color={vm.capacityBar.color} />
            {planInfo?.subscription_status !== 'active' && (
              <button
                onClick={() => navigate('/checkout')}
                className="mt-6 w-full rounded-lg px-4 py-2 text-sm font-bold text-white transition-all"
                style={{
                  background: `linear-gradient(135deg, ${firmConfig?.primary_color || '#f97316'}, ${firmConfig?.secondary_color || '#fb923c'})`,
                }}
              >
                {trialLeft?.expired ? 'Elegir un plan' : 'Actualizar Plan'}
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title={vm.teamSection.title}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {vm.teamSection.metrics.map((metric) => (
            <KPICard key={metric.key} icon={[Users, CheckCircle2, Calendar, TrendingUp, Clock][vm.teamSection.metrics.indexOf(metric)]} label={metric.label} value={metric.value} color={metric.color} />
          ))}
        </div>
        <button className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
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

      {/* Trial Countdown Section */}
      {showTrial && (
        <SectionCard title="Prueba Gratuita">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#f97316]" />
              <h3 className="text-lg font-bold text-white">Tiempo restante de tu prueba gratuita</h3>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-md" data-testid="trial-countdown">
              {[
                { v: trialLeft.d, label: 'Días' },
                { v: trialLeft.h, label: 'Horas' },
                { v: trialLeft.m, label: 'Min' },
                { v: trialLeft.s, label: 'Seg' },
              ].map((box) => (
                <div key={box.label} className="rounded-2xl bg-white/5 border border-white/10 py-3 text-center">
                  <div className="text-3xl font-bold tabular-nums text-[#f97316]">{pad(box.v)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">{box.label}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* Trial Expired Notice */}
      {trialLeft?.expired && planInfo?.subscription_status !== 'active' && (
        <SectionCard title="Prueba Finalizada">
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#f97316]/10 to-[#3b82f6]/10 rounded-3xl border border-white/10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-[#f97316]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">La prueba gratuita ha finalizado</h3>
                  <p className="text-sm text-white/60 mt-1 max-w-xl">
                    Para continuar utilizando Punto Cero Legal debes activar uno de nuestros planes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold px-6 py-3 rounded-lg hover:from-[#fb923c] hover:to-[#f97316] transition-all flex items-center gap-2"
                data-testid="choose-plan-btn"
              >
                <Crown className="w-4 h-4" /> Elegir un plan
              </button>
            </div>
          </div>
        </SectionCard>
      )}

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
