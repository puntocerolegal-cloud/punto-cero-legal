import React, { useState } from "react";
import { FolderKanban, Users, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { usePreferences } from "../hooks/usePreferences";
import { buildAssignmentsViewModel } from "../application";
import { buildAssignmentsExportViewModel } from "../application/exportApplication";
import { buildAssignmentsPreferences } from "../application/preferencesApplication";
import { LoadingState } from "../components/shared/LoadingState";
import { useSearch } from "../hooks/useSearch";
import { useFilters } from "../hooks/useFilters";
import { SearchToolbar } from "../components/search/SearchToolbar";
import { SearchEmptyState } from "../components/search/SearchEmptyState";
import { ExportButton } from "../components/export/ExportButton";
import { PreferenceButton } from "../components/preferences/PreferenceButton";
import { LayoutSwitcher } from "../components/preferences/LayoutSwitcher";

const CaseItem = ({ caseData, isSelected, onSelect }) => {
  const statusConfig = {
    'nuevo': { color: 'border-blue-500/50 bg-blue-500/10', dot: 'bg-blue-400' },
    'pendiente': { color: 'border-amber-500/50 bg-amber-500/10', dot: 'bg-amber-400' },
    'asignado': { color: 'border-purple-500/50 bg-purple-500/10', dot: 'bg-purple-400' },
  };
  const config = statusConfig[caseData.status || 'nuevo'] || statusConfig.nuevo;

  return (
    <div onClick={() => onSelect(caseData)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-white/40 bg-white/10' : config.color + ' hover:border-white/30'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${config.dot}`}></div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{caseData.caseNumber}</p>
          <p className="text-xs text-white/60 mt-1 truncate">{caseData.clientName}</p>
          <p className="text-xs text-white/40 mt-0.5">{caseData.caseType}</p>
        </div>
      </div>
    </div>
  );
};

const LawyerMatch = ({ lawyer, onAssign }) => {
  const getScoreColor = (s) => {
    if (s >= 90) return 'text-emerald-400';
    if (s >= 70) return 'text-amber-400';
    return 'text-white/60';
  };

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {lawyer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'L'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm">{lawyer.name}</p>
              <p className="text-xs text-white/60">{lawyer.specialty}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><p className="text-white/50">Casos activos</p><p className="text-white font-semibold">{lawyer.metrics.activeCases}</p></div>
            <div><p className="text-white/50">Oficina</p><p className="text-white font-semibold">{lawyer.metrics.office}</p></div>
            <div><p className="text-white/50">Disponibilidad</p><p className={lawyer.metrics.available === 'Disponible' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{lawyer.metrics.available}</p></div>
            <div><p className="text-white/50">Departamento</p><p className="text-white font-semibold">{lawyer.metrics.department}</p></div>
          </div>
          <div className="mt-2 p-2 rounded bg-white/5 text-xs text-white/70">
            <strong>Razón:</strong> {lawyer.reason}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-2xl font-bold ${getScoreColor(lawyer.score)}`}>{lawyer.score}%</p>
          <button onClick={() => onAssign(lawyer)} className="mt-2 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
};

export function AssignmentsPage() {
  const { user } = useAuth();
  const { loading, error, lawyers, cases } = useFirmCoreData();
  const { preferences } = usePreferences();
  const [selectedCase, setSelectedCase] = useState(null);

  const { query: caseQuery, results: searchedCases, handleSearch: handleCaseSearch, handleClear: handleCaseClear } = useSearch(cases, ["caseNumber", "clientName", "caseType"], "firm-assignments-cases-search");

  const caseFilterConfig = {
    status: { getValue: (c) => c.status || "nuevo" },
  };

  const { filters: caseFilters, handleFilterChange: handleCaseFilterChange, handleRemoveFilter: handleCaseRemoveFilter, handleClearAllFilters: handleCaseClearAllFilters, filteredData: filteredCases } = useFilters(searchedCases, caseFilterConfig, "firm-assignments-cases-filters");

  const { query: lawyerQuery, results: searchedLawyers, handleSearch: handleLawyerSearch, handleClear: handleLawyerClear } = useSearch(lawyers, ["name", "specialty"], "firm-assignments-lawyers-search");

  const lawyerFilterConfig = {
    department: { getValue: (l) => l.department },
  };

  const { filters: lawyerFilters, handleFilterChange: handleLawyerFilterChange, handleRemoveFilter: handleLawyerRemoveFilter, handleClearAllFilters: handleLawyerClearAllFilters, filteredData: filteredLawyers } = useFilters(searchedLawyers, lawyerFilterConfig, "firm-assignments-lawyers-filters");

  const displayCases = filteredCases.length > 0 ? filteredCases : searchedCases;
  const displayLawyers = filteredLawyers.length > 0 ? filteredLawyers : searchedLawyers;

  if (loading) return <LoadingState message="Cargando centro de asignación..." />;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6"><p className="text-red-400">{error}</p></div>;

  const vm = buildAssignmentsViewModel(lawyers, cases);
  const exportVM = buildAssignmentsExportViewModel(cases, user);
  const assignmentsPrefsVM = buildAssignmentsPreferences(preferences);
  const suggestedLawyers = selectedCase ? vm.getRecommendations(selectedCase) : [];

  const handleSelectCase = (caseData) => {
    setSelectedCase(caseData);
  };

  const handleAssignCase = (lawyer) => {
    alert(`Caso asignado a ${lawyer.name} - Conectar con API de asignación`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{vm.header.title}</h1>
          <p className="text-white/60 mt-2">{vm.header.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <PreferenceButton preferencesPanel={
            <LayoutSwitcher
              layoutOptions={assignmentsPrefsVM.layoutOptions}
              currentLayout={assignmentsPrefsVM.layoutMode}
              onChangeLayout={(mode) => {}}
            />
          } />
          <ExportButton exportViewModel={exportVM} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {vm.summaryStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs text-white/50 uppercase mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            {vm.casesPanel.title} ({displayCases.length})
          </h2>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Buscar casos..."
              value={caseQuery}
              onChange={(e) => handleCaseSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {displayCases.length === 0 ? (
              caseQuery || Object.keys(caseFilters).length > 0 ? (
                <div className="text-center py-8 text-white/60">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No hay casos que coincidan con la búsqueda</p>
                </div>
              ) : (
                <div className="text-center py-8 text-white/60">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{vm.casesPanel.emptyMessage}</p>
                </div>
              )
            ) : (
              displayCases.map((caseItem) => (
                <CaseItem
                  key={caseItem.id}
                  caseData={caseItem}
                  isSelected={selectedCase?.id === caseItem.id}
                  onSelect={handleSelectCase}
                />
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {vm.lawyersPanel.title}
          </h2>
          {selectedCase ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {suggestedLawyers.length > 0 ? (
                suggestedLawyers.map((lawyer) => (
                  <LawyerMatch key={lawyer.id} lawyer={lawyer} onAssign={handleAssignCase} />
                ))
              ) : (
                <div className="text-center py-8 text-white/60">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No hay abogados disponibles para este caso</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-white/60">
              <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{vm.lawyersPanel.emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentsPage;
