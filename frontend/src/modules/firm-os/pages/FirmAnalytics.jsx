import React, { useState } from "react";
import { TrendingUp, Users, FolderKanban, Target, Medal, Zap, CheckCircle2, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { usePreferences } from "../hooks/usePreferences";
import { buildAnalyticsViewModel } from "../application";
import { buildAnalyticsExportViewModel } from "../application/exportApplication";
import { buildAnalyticsPreferences } from "../application/preferencesApplication";
import { buildAnalyticsChartsViewModel } from "../application/chartsApplication";
import { MetricCard } from "../components/shared/MetricCard";
import { SectionCard } from "../components/shared/SectionCard";
import { LoadingState } from "../components/shared/LoadingState";
import { useSearch } from "../hooks/useSearch";
import { useFilters } from "../hooks/useFilters";
import { ExportButton } from "../components/export/ExportButton";
import { PreferenceButton } from "../components/preferences/PreferenceButton";
import { DashboardWidget } from "../components/charts/DashboardWidget";

export function FirmAnalytics() {
  const { user } = useAuth();
  const { loading, error, lawyers, cases, clients } = useFirmCoreData();
  const { preferences } = usePreferences();

  const { query, results: searchedLawyers, handleSearch, handleClear } = useSearch(lawyers, ["name", "specialty", "department"], "firm-analytics-search");

  const lawyerFilterConfig = {
    department: { getValue: (l) => l.department },
  };

  const { filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters, filteredData } = useFilters(searchedLawyers, lawyerFilterConfig, "firm-analytics-filters");

  const displayLawyers = filteredData.length > 0 ? filteredData : searchedLawyers;

  if (loading) return <LoadingState message="Cargando centro de productividad..." />;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center"><p className="text-red-400 font-semibold">{error}</p></div>;

  const vm = buildAnalyticsViewModel(displayLawyers, cases, clients);
  const exportVM = buildAnalyticsExportViewModel(displayLawyers, cases, user);
  const analyticsPrefsVM = buildAnalyticsPreferences(preferences);
  const chartsVM = buildAnalyticsChartsViewModel(displayLawyers, cases, clients);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{vm.header.title}</h1>
          <p className="text-white/60 mt-2">{vm.header.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <PreferenceButton preferencesPanel={<p className="text-xs text-white/60">Preferencias de analytics disponibles</p>} />
          <ExportButton exportViewModel={exportVM} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar abogado..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/30"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <span className="text-sm text-white/60 whitespace-nowrap">{displayLawyers.length} resultados</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vm.statsCards.map((card) => {
          const iconMap = { "Target": Target, "CheckCircle2": CheckCircle2, "Users": Users, "FolderKanban": FolderKanban };
          const Icon = iconMap[card.icon] || Target;
          return <MetricCard key={card.title} icon={Icon} title={card.title} value={card.value} color={card.color} />;
        })}
      </div>

      <SectionCard title={vm.rankingTable.title} icon={Medal}>
        {vm.rankingTable.rows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {vm.rankingTable.columns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs uppercase tracking-wider text-white/50">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vm.rankingTable.rows.map((row) => (
                  <tr key={row.ranking} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold ${row.rankingLabel}`}>
                          {row.ranking}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-white">{row.name}</td>
                    <td className="px-4 py-4 text-center text-blue-400">{row.openCases}</td>
                    <td className="px-4 py-4 text-center text-emerald-400">{row.closedCases}</td>
                    <td className="px-4 py-4 text-center text-purple-400">{row.documents}</td>
                    <td className="px-4 py-4 text-center text-amber-400">{row.aiUsage}</td>
                    <td className="px-4 py-4 text-center text-cyan-400">{row.clients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-white/60">
            <p>Sin datos disponibles. Los abogados sin casos no aparecen en el ranking.</p>
          </div>
        )}
      </SectionCard>

      {vm.summary.hasRankings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vm.topPerformersCards.map((card) => {
            const iconMap = { "Medal": Medal, "Zap": Zap };
            const Icon = iconMap[card.icon] || Medal;
            return (
              <div key={card.title} className={`rounded-xl border p-6 ${card.color}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5" style={{ color: card.color.includes("amber") ? "#fbbf24" : card.color.includes("purple") ? "#a78bfa" : "#22d3ee" }} />
                  <h3 className="font-semibold text-white">{card.title}</h3>
                </div>
                <p className="text-2xl font-bold text-white">{card.name}</p>
                <p className="text-sm text-white/70 mt-2">{card.metric}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white mt-12">Visualizaciones Analíticas</h2>
        <div className="space-y-6">
          {chartsVM.widgets.map(widget => (
            <DashboardWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </div>
    </div>
  );
}
