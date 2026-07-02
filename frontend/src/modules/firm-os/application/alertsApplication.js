// Application layer for alerts - orchestrates domain + data
import { composeAlertsData } from "../domain";

export function buildAlertsViewModel(lawyers = [], cases = [], clients = [], planName = null) {
  const alertsData = composeAlertsData(lawyers, cases, clients, planName);
  const { alerts, counts } = alertsData;

  return {
    // Header
    header: {
      title: "Centro de Alertas Ejecutivas",
      subtitle: "Alertas en tiempo real sobre el estado de la firma",
    },

    // Summary cards
    summaryCards: [
      {
        label: "Total Alertas",
        value: counts.total,
        color: "border-white/10 bg-white/5",
        textColor: "text-white",
      },
      {
        label: "Críticas",
        value: counts.critical,
        color: "border-red-500/30 bg-red-500/10",
        textColor: "text-red-400",
      },
      {
        label: "Advertencias",
        value: counts.warning,
        color: "border-amber-500/30 bg-amber-500/10",
        textColor: "text-amber-400",
      },
      {
        label: "Resueltas",
        value: counts.success,
        color: "border-emerald-500/30 bg-emerald-500/10",
        textColor: "text-emerald-400",
      },
    ],

    // Alert items
    alertItems: alerts.map(alert => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      type: alert.type,
      typeStyle: {
        critical: "danger",
        warning: "warning",
        info: "info",
        success: "success",
      }[alert.type] || "info",
    })),

    // Statistics
    statistics: {
      total: counts.total,
      critical: counts.critical,
      warning: counts.warning,
      info: counts.info,
      success: counts.success,
      hasCritical: counts.critical > 0,
      hasWarnings: counts.warning > 0,
    },
  };
}
