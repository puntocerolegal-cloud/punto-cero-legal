// Application layer for analytics - orchestrates domain + data
import { composeFirmAnalyticsData } from "../domain";

export function buildAnalyticsViewModel(lawyers = [], cases = [], clients = []) {
  const analyticsData = composeFirmAnalyticsData(lawyers, cases, clients);
  const { metrics, rankings, topPerformers } = analyticsData;

  return {
    // Header
    header: {
      title: "Centro de Productividad",
      subtitle: "Ranking y métricas de desempeño del equipo jurídico",
    },

    // Stats cards
    statsCards: [
      {
        icon: "Target",
        title: "Casos Activos",
        value: metrics.activeCases,
        color: "border-blue-700",
      },
      {
        icon: "CheckCircle2",
        title: "Casos Cerrados",
        value: metrics.closedCases,
        color: "border-emerald-700",
      },
      {
        icon: "Users",
        title: "Abogados Activos",
        value: metrics.activeLawyers,
        color: "border-purple-700",
      },
      {
        icon: "FolderKanban",
        title: "Total de Casos",
        value: metrics.totalCases,
        color: "border-amber-700",
      },
    ],

    // Ranking table
    rankingTable: {
      title: "Ranking de Productividad",
      columns: [
        "Ranking",
        "Abogado",
        "Casos Abiertos",
        "Cerrados",
        "Documentos",
        "IA (usos)",
        "Clientes",
      ],
      rows: rankings.map((lawyer, idx) => ({
        ranking: idx + 1,
        rankingLabel:
          idx === 0 ? "bg-amber-500/30 text-amber-300" :
          idx === 1 ? "bg-slate-500/30 text-slate-300" :
          idx === 2 ? "bg-orange-500/30 text-orange-300" :
          "bg-white/10 text-white",
        name: lawyer.name || "Sin nombre",
        openCases: lawyer.openCases,
        closedCases: lawyer.closedCases,
        documents: lawyer.documentsCreated,
        aiUsage: lawyer.aiUsage,
        clients: lawyer.assignedClients || 0,
      })),
    },

    // Top performers
    topPerformersCards: [
      {
        icon: "Medal",
        title: "Mayor Carga",
        name: topPerformers.byLoad?.name || "N/A",
        metric: `${topPerformers.byLoad?.totalCases || 0} casos totales`,
        color: "border-amber-500/30 bg-amber-500/10",
      },
      {
        icon: "Zap",
        title: "Mayor Documentación",
        name: topPerformers.byDocuments?.name || "N/A",
        metric: `${topPerformers.byDocuments?.documents_created || 0} documentos`,
        color: "border-purple-500/30 bg-purple-500/10",
      },
      {
        icon: "Zap",
        title: "Mayor Uso IA",
        name: topPerformers.byAI?.name || "N/A",
        metric: `${topPerformers.byAI?.ai_usage || 0} usos`,
        color: "border-cyan-500/30 bg-cyan-500/10",
      },
    ],

    // Summary
    summary: {
      hasRankings: rankings.length > 0,
      totalRanked: rankings.length,
      totalMetrics: metrics.totalCases,
    },
  };
}
