import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Mail, Calendar, FileText, Zap, Activity, MessageCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { useSearch } from "../hooks/useSearch";
import { useFilters } from "../hooks/useFilters";
import { usePreferences } from "../hooks/usePreferences";
import { useBulkSelection } from "../hooks/useBulkSelection";
import { buildTeamViewModel } from "../application";
import { buildLawyerSearchViewModel } from "../application/searchApplication";
import { buildLawyersExportViewModel } from "../application/exportApplication";
import { buildLawyerPreferences } from "../application/preferencesApplication";
import { buildLawyersBulkViewModel } from "../application/bulkOperationsApplication";
import { LoadingState } from "../components/shared/LoadingState";
import { SearchToolbar } from "../components/search/SearchToolbar";
import { SearchEmptyState } from "../components/search/SearchEmptyState";
import { InviteLawyerModal } from "../components/InviteLawyerModal";
import { ExportButton } from "../components/export/ExportButton";
import { PreferenceButton } from "../components/preferences/PreferenceButton";
import { ColumnSelector } from "../components/preferences/ColumnSelector";
import { BulkToolbar } from "../components/bulk/BulkToolbar";
import { BulkCheckbox } from "../components/bulk/BulkCheckbox";
import { BulkConfirmationModal } from "../components/bulk/BulkConfirmationModal";

const LawyerCard = ({ lawyer, onViewAgenda, onAssignCase, onSendMessage, onViewDocuments, onViewHistory, isSelected = false, onToggleSelection = null }) => {
  const getStatusColor = (status) => {
    if (status === "activo") return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    if (status === "inactivo") return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const getAvailabilityColor = (available) => {
    return available ? "text-emerald-400" : "text-amber-400";
  };

  return (
    <div className={`rounded-xl border backdrop-blur-sm hover:border-white/20 transition-all p-6 ${
      isSelected
        ? 'border-blue-500/50 bg-blue-500/10'
        : 'border-white/10 bg-white/[0.02]'
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex gap-4 flex-1">
          {onToggleSelection && (
            <div className="mt-1">
              <BulkCheckbox isSelected={isSelected} onChange={() => onToggleSelection(lawyer.id)} />
            </div>
          )}
          <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {lawyer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'L'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{lawyer.name || 'Sin nombre'}</h3>
            <p className="text-sm text-white/50 mt-1">{lawyer.specialty || 'Especialidad no especificada'}</p>
            <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {lawyer.email || 'Sin correo'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex ${getStatusColor(lawyer.status || 'inactivo')}`}>
          {lawyer.status === "activo" ? "Activo" : "Inactivo"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mb-4">
        <div><p className="text-xs text-white/50 uppercase mb-1">Oficina</p><p className="text-sm text-white">{lawyer.office || "Sin oficina"}</p></div>
        <div><p className="text-xs text-white/50 uppercase mb-1">Departamento</p><p className="text-sm text-white">{lawyer.department || "Sin departamento"}</p></div>
      </div>

      <div className="grid grid-cols-4 gap-3 border-t border-white/10 pt-4 mb-4">
        <div className="text-center"><p className="text-xs text-white/50 uppercase mb-1">Disponible</p><p className={`text-sm font-semibold ${getAvailabilityColor(lawyer.available !== false)}`}>{lawyer.available !== false ? "Sí" : "No"}</p></div>
        <div className="text-center"><p className="text-xs text-white/50 uppercase mb-1">Casos Activos</p><p className="text-sm font-semibold text-white">{lawyer.total_cases || 0}</p></div>
        <div className="text-center"><p className="text-xs text-white/50 uppercase mb-1">Cerrados</p><p className="text-sm font-semibold text-white">{lawyer.closed_cases || 0}</p></div>
        <div className="text-center"><p className="text-xs text-white/50 uppercase mb-1">Clientes</p><p className="text-sm font-semibold text-white">{lawyer.assigned_clients || 0}</p></div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 mb-4">
        <div><p className="text-xs text-white/50 uppercase mb-1">Documentos</p><p className="text-sm font-semibold text-white">{lawyer.documents_created || 0}</p></div>
        <div><p className="text-xs text-white/50 uppercase mb-1">IA (usos)</p><p className="text-sm font-semibold text-white">{lawyer.ai_usage || 0}</p></div>
        <div><p className="text-xs text-white/50 uppercase mb-1">Última actividad</p><p className="text-sm font-semibold text-white/70">{lawyer.last_activity ? "Hoy" : "Sin actividad"}</p></div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
        <button onClick={() => onViewAgenda(lawyer)} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/30 transition-all">
          <Calendar className="w-3.5 h-3.5" />
          Agenda
        </button>
        <button onClick={() => onAssignCase(lawyer)} className="flex items-center justify-center gap-2 rounded-lg bg-purple-600/20 px-3 py-2 text-xs font-medium text-purple-300 hover:bg-purple-600/30 transition-all">
          <AlertCircle className="w-3.5 h-3.5" />
          Asignar caso
        </button>
        <button onClick={() => onSendMessage(lawyer)} className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600/20 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-600/30 transition-all">
          <MessageCircle className="w-3.5 h-3.5" />
          Mensaje
        </button>
        <button onClick={() => onViewDocuments(lawyer)} className="flex items-center justify-center gap-2 rounded-lg bg-amber-600/20 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-600/30 transition-all">
          <FileText className="w-3.5 h-3.5" />
          Documentos
        </button>
        <button onClick={() => onViewHistory(lawyer)} className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-slate-600/20 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-600/30 transition-all">
          <Clock className="w-3.5 h-3.5" />
          Historial
        </button>
      </div>
    </div>
  );
};

export function FirmLawyers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, error, lawyers, refresh: refreshLawyers } = useFirmCoreData();
  const { preferences } = usePreferences();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const { query, results: searchResults, handleSearch, handleClear } = useSearch(lawyers, ["name", "specialty", "email", "office"], "firm-lawyers-search");

  const filterConfig = {
    status: { getValue: (l) => (l.status === "activo" ? "Activo" : "Inactivo") },
    specialty: { getValue: (l) => l.specialty },
    department: { getValue: (l) => l.department },
  };

  const { filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters, filteredData } = useFilters(searchResults, filterConfig, "firm-lawyers-filters");
  const { selectedIds, toggleSelection, selectAll, clearSelection, invertSelection } = useBulkSelection(lawyers, 'id');

  if (loading) return <LoadingState message="Cargando abogados..." />;
  if (error) return <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center"><p className="text-red-400 font-semibold">{error}</p></div>;

  const vm = buildTeamViewModel(lawyers);
  const searchVM = buildLawyerSearchViewModel(lawyers, query, filters);
  const displayLawyers = filteredData.length > 0 ? filteredData : searchResults;
  const exportVM = buildLawyersExportViewModel(displayLawyers, user);
  const lawyerPrefsVM = buildLawyerPreferences(preferences);
  const bulkVM = buildLawyersBulkViewModel(displayLawyers, selectedIds);

  // F-001: los botones navegan al módulo correspondiente llevando el contexto
  // del abogado (id + nombre) por query string para que el destino pre-filtre.
  const goToModule = (path, lawyer) => {
    const params = new URLSearchParams();
    if (lawyer?.id) params.set("lawyer", String(lawyer.id));
    if (lawyer?.name) params.set("name", lawyer.name);
    const qs = params.toString();
    navigate(`/firm-os/${path}${qs ? `?${qs}` : ""}`);
  };

  const handleViewAgenda = (lawyer) => goToModule("agenda", lawyer);
  const handleAssignCase = (lawyer) => goToModule("assignments", lawyer);
  const handleSendMessage = (lawyer) => goToModule("communication", lawyer);
  const handleViewDocuments = (lawyer) => goToModule("documents", lawyer);
  const handleViewHistory = (lawyer) => goToModule("cases", lawyer);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{vm.header.title}</h1>
          <p className="text-white/60 mt-2">{vm.header.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <PreferenceButton preferencesPanel={
            <ColumnSelector
              availableColumns={lawyerPrefsVM.availableColumns}
              visibleColumns={lawyerPrefsVM.visibleColumns}
              onToggleColumn={(colId) => {
                const updated = lawyerPrefsVM.visibleColumns.includes(colId)
                  ? lawyerPrefsVM.visibleColumns.filter(c => c !== colId)
                  : [...lawyerPrefsVM.visibleColumns, colId];
              }}
            />
          } />
          <ExportButton exportViewModel={exportVM} />
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white font-semibold">
            <Plus className="w-5 h-5" />
            Invitar Abogado
          </button>
        </div>
      </div>

      <SearchToolbar
        searchQuery={query}
        onSearchChange={handleSearch}
        onSearchClear={handleClear}
        filters={filters}
        filterOptions={searchVM.filterOptions}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        resultCount={displayLawyers.length}
      />

      <BulkToolbar
        selectedCount={selectedIds.length}
        totalCount={displayLawyers.length}
        actions={bulkVM.actions}
        onSelectAll={selectAll}
        onClearAll={clearSelection}
        onInvert={invertSelection}
        onAction={(actionId) => {
          if (bulkVM.actions.find(a => a.id === actionId)?.confirmRequired) {
            setConfirmAction(actionId);
          }
        }}
      />

      {displayLawyers.length === 0 ? (
        <SearchEmptyState query={query} filters={filters} />
      ) : (
        <>
          {displayLawyers.filter((l) => l.status === "activo").length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Activos ({displayLawyers.filter((l) => l.status === "activo").length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayLawyers.filter((l) => l.status === "activo").map((lawyer, idx) => (
                  <LawyerCard
                    key={idx}
                    lawyer={lawyer}
                    onViewAgenda={handleViewAgenda}
                    onAssignCase={handleAssignCase}
                    onSendMessage={handleSendMessage}
                    onViewDocuments={handleViewDocuments}
                    onViewHistory={handleViewHistory}
                    isSelected={selectedIds.includes(lawyer.id)}
                    onToggleSelection={toggleSelection}
                  />
                ))}
              </div>
            </div>
          )}

          {displayLawyers.filter((l) => l.status !== "activo").length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">Inactivos ({displayLawyers.filter((l) => l.status !== "activo").length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayLawyers.filter((l) => l.status !== "activo").map((lawyer, idx) => (
                  <LawyerCard
                    key={idx}
                    lawyer={lawyer}
                    onViewAgenda={handleViewAgenda}
                    onAssignCase={handleAssignCase}
                    onSendMessage={handleSendMessage}
                    onViewDocuments={handleViewDocuments}
                    onViewHistory={handleViewHistory}
                    isSelected={selectedIds.includes(lawyer.id)}
                    onToggleSelection={toggleSelection}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {vm.summary.allEmpty && lawyers.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-white/60 mb-4">No hay abogados en la firma</p>
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white font-semibold">
            <Plus className="w-5 h-5" />
            Agregar primer abogado
          </button>
        </div>
      )}

      <BulkConfirmationModal
        isOpen={confirmAction === 'remove'}
        title="Eliminar de la lista"
        message="Los abogados seleccionados serán eliminados visualmente de la lista"
        selectedCount={selectedIds.length}
        onConfirm={() => {
          clearSelection();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
        variant="danger"
      />

      <InviteLawyerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refreshLawyers()}
      />
    </div>
  );
}
