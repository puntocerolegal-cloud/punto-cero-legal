import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Building2, Plus, MapPin, Users, FolderKanban, User, AlertCircle, Map } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { useOrganization } from "../hooks/useOrganization";
import { LoadingState } from "../components/shared/LoadingState";
import { useSearch } from "../hooks/useSearch";
import { useFilters } from "../hooks/useFilters";
import { usePreferences } from "../hooks/usePreferences";
import { buildOfficesExportViewModel } from "../application/exportApplication";
import { buildOfficePreferences } from "../application/preferencesApplication";
import { SearchToolbar } from "../components/search/SearchToolbar";
import { SearchEmptyState } from "../components/search/SearchEmptyState";
import { ExportButton } from "../components/export/ExportButton";
import { PreferenceButton } from "../components/preferences/PreferenceButton";

const OfficeCard = ({ office }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hover:border-white/20 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{office.name}</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {office.city && (
            <div className="flex items-center gap-2 text-white/70">
              <MapPin className="h-4 w-4" />
              {office.city}{office.country ? `, ${office.country}` : ''}
            </div>
          )}
          {office.responsible && (
            <div className="flex items-center gap-2 text-white/70">
              <User className="h-4 w-4" />
              {office.responsible}
            </div>
          )}
        </div>
      </div>
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        office.status === 'activa' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
      }`}>
        {office.status === 'activa' ? 'Activa' : office.status || 'Activa'}
      </div>
    </div>

    {/* Stats */}
    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-white/50">Abogados</p>
        <p className="mt-1 flex items-center gap-1">
          <Users className="h-4 w-4 text-blue-400" />
          <span className="text-lg font-semibold text-white">{office.lawyers_count || office.lawyers || 0}</span>
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-white/50">Casos</p>
        <p className="mt-1 flex items-center gap-1">
          <FolderKanban className="h-4 w-4 text-purple-400" />
          <span className="text-lg font-semibold text-white">{office.cases_count || office.cases || 0}</span>
        </p>
      </div>
    </div>

    {/* Actions */}
    <div className="mt-6 flex gap-2 border-t border-white/10 pt-4">
      <button className="flex-1 rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/30 transition-colors">
        Ver detalles
      </button>
      <button className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors">
        Editar
      </button>
    </div>
  </div>
);

export function OfficesPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { loading: coreLoading, lawyers, cases } = useFirmCoreData();
  const { officesWithMetrics } = useOrganization(lawyers, cases);

  // Try to load from backend first, fallback to derived data
  const [backendOffices, setBackendOffices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBackendOffices = async () => {
      try {
        const firmId = user?.firm_id;
        if (!firmId) return;

        const res = await axios.get(`${API}/firms/${firmId}/offices`);
        setBackendOffices(res.data.data || []);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.warn("Backend offices not available, using derived data:", err);
        }
      }
    };

    loadBackendOffices();
  }, [user?.firm_id]);

  // Use backend data if available, otherwise derived
  const offices = useMemo(() => {
    return backendOffices !== null ? backendOffices : officesWithMetrics;
  }, [backendOffices, officesWithMetrics]);

  const { query, results: searchResults, handleSearch, handleClear } = useSearch(offices, ["name", "city"], "firm-offices-search");

  const filterConfig = {
    status: { getValue: (o) => (o.status === "activa" ? "Activa" : "Inactiva") },
  };

  const { filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters, filteredData } = useFilters(searchResults, filterConfig, "firm-offices-filters");

  const displayOffices = filteredData.length > 0 ? filteredData : searchResults;
  const exportVM = buildOfficesExportViewModel(displayOffices, user);
  const officePrefsVM = buildOfficePreferences(preferences);

  if (coreLoading) {
    return <LoadingState message="Cargando oficinas..." />;
  }

  const totalLawyers = offices.reduce((sum, o) => sum + (o.lawyer_count || o.lawyers_count || o.lawyers || 0), 0);
  const totalCases = offices.reduce((sum, o) => sum + (o.active_cases || o.cases_count || o.cases || 0), 0);
  const activeOffices = offices.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Administración de Oficinas</h1>
          <p className="mt-2 text-white/60">Gestión de sedes de la firma con cobertura geográfica</p>
        </div>
        <div className="flex items-center gap-3">
          <PreferenceButton preferencesPanel={<p className="text-xs text-white/60">Preferencias de oficinas disponibles</p>} />
          <ExportButton exportViewModel={exportVM} />
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            Nueva Oficina
          </button>
        </div>
      </div>

      {/* KPIs */}
      {offices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-white/50">Oficinas Activas</p>
            <p className="mt-2 text-3xl font-bold text-white">{activeOffices}</p>
            <p className="mt-1 text-xs text-white/40">de {offices.length} totales</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-white/50">Abogados</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalLawyers}</p>
            <p className="mt-1 text-xs text-white/40">distribuidos</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-white/50">Casos</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalCases}</p>
            <p className="mt-1 text-xs text-white/40">bajo administración</p>
          </div>
        </div>
      ) : null}

      {/* Search toolbar */}
      <SearchToolbar
        searchQuery={query}
        onSearchChange={handleSearch}
        onSearchClear={handleClear}
        filters={filters}
        filterOptions={{ status: ["Activa", "Inactiva"] }}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        resultCount={displayOffices.length}
      />

      {/* Grid de oficinas */}
      {displayOffices.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayOffices.map((office, idx) => (
            <OfficeCard key={idx} office={office} />
          ))}
        </div>
      ) : query || Object.keys(filters).length > 0 ? (
        <SearchEmptyState query={query} filters={filters} />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Building2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 font-semibold">Sin información disponible</p>
          <p className="text-white/40 text-sm mt-2">Los datos de oficinas se sincronizarán cuando estén disponibles</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            Registrar oficina
          </button>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
        <div className="flex gap-3">
          <Map className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" />
          <div>
            <p className="font-medium text-blue-300">Arquitectura para múltiples sedes</p>
            <p className="mt-1 text-sm text-blue-200/70">
              Sistema preparado para administrar múltiples oficinas con gestión independiente de abogados, casos y operaciones por sede. Mapa interactivo próximamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OfficesPage;
