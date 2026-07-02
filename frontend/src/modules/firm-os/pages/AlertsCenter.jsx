import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { buildAlertsViewModel } from "../application";
import { LoadingState } from "../components/shared/LoadingState";

const AlertCard = ({ icon: Icon, title, description, type }) => {
  const typeStyles = {
    critical: "border-red-500/30 bg-red-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    info: "border-blue-500/30 bg-blue-500/10",
    success: "border-emerald-500/30 bg-emerald-500/10",
  };

  const iconColor = {
    critical: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
    success: "text-emerald-400",
  };

  return (
    <div className={`rounded-lg border p-4 ${typeStyles[type]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColor[type]}`} />
        <div className="flex-1">
          <p className="font-semibold text-white text-sm">{title}</p>
          <p className={`text-xs mt-1 ${
            type === 'critical' ? 'text-red-300' :
            type === 'warning' ? 'text-amber-300' :
            type === 'info' ? 'text-blue-300' :
            'text-emerald-300'
          }`}>{description}</p>
        </div>
      </div>
    </div>
  );
};

export function AlertsCenter() {
  const { access } = useSubscription();
  const { loading, error, lawyers, cases, clients } = useFirmCoreData();

  if (loading) return <LoadingState message="Cargando centro de alertas..." />;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center"><p className="text-red-400 font-semibold">{error}</p></div>;

  const vm = buildAlertsViewModel(lawyers, cases, clients, access?.plan?.name);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{vm.header.title}</h1>
        <p className="text-white/60 mt-2">{vm.header.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {vm.summaryCards.map((card) => (
          <div key={card.label} className={`rounded-lg border p-4 ${card.color}`}>
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vm.alertItems.map((alert) => {
          const iconMap = {
            "cases-no-lawyer": AlertCircle,
            "overloaded-lawyers": AlertCircle,
            "upcoming-hearings": AlertCircle,
            "plan-capacity": AlertCircle,
            "clients-no-follow": AlertCircle,
            "pending-docs": AlertCircle,
            "all-clear": CheckCircle2,
          };
          const Icon = iconMap[alert.id] || AlertCircle;
          return (
            <AlertCard
              key={alert.id}
              icon={Icon}
              title={alert.title}
              description={alert.description}
              type={alert.typeStyle}
            />
          );
        })}
      </div>
    </div>
  );
}

export default AlertsCenter;
