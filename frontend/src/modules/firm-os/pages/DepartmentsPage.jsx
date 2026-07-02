import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Briefcase, Plus, Users, FolderKanban, User, AlertCircle, TrendingUp } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { useFirmCoreData } from "../hooks/useFirmCoreData";
import { useOrganization } from "../hooks/useOrganization";
import { EntityCard } from "../components/shared/EntityCard";
import { LoadingState } from "../components/shared/LoadingState";
import { EmptyState } from "../components/shared/EmptyState";
import { useSearch } from "../hooks/useSearch";
import { useFilters } from "../hooks/useFilters";
import { usePreferences } from "../hooks/usePreferences";
import { buildDepartmentsExportViewModel } from "../application/exportApplication";
import { buildDepartmentPreferences } from "../application/preferencesApplication";
import { SearchToolbar } from "../components/search/SearchToolbar";
import { SearchEmptyState } from "../components/search/SearchEmptyState";
import { ExportButton } from "../components/export/ExportButton";
import { PreferenceButton } from "../components/preferences/PreferenceButton";

const DepartmentCard = ({ department }) => {
  const lawyers = department.lawyers_count || department.lawyers || 0;
  const cases = department.cases_count || department.cases || 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">{department.name}</h3>
        </div>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          department.status === 'activo' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          {department.status === 'activo' ? 'Activo' : department.status || 'Activo'}
        </div>
      </div>

      <div className="space-y-3 border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <Users className="h-4 w-4" />
            <span className="text-sm">Abogados</span>
          </div>
          <span className="font-semibold text-white">{lawyers}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70">
            <FolderKanban className="h-4 w-4" />
            <span className="text-sm">Casos</span>
          </div>
          <span className="font-semibold text-white">{cases}</span>
        </div>
        {department.responsible && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/70">
              <User className="h-4 w-4" />
              <span className="text-sm">Responsable</span>
            </div>
            <span className="text-sm text-white">{department.responsible}</span>
          </div>
        )}
      </div>

      {/* Productividad */}
      <div>
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">Carga</p>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${Math.min(100, (cases / Math.max(lawyers, 1)) * 10)}%` }}
          ></div>
        </div>
      </div>

      <button className="mt-4 w-full rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
        Ver detalles
      </button>
    </div>
  );
};

export function DepartmentsPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { loading: coreLoading, lawyers, cases } = useFirmCoreData();
  const { departmentsWithMetrics } = useOrganization(lawyers, cases);

  // Try to load from backend first, fallback to derived data
  const [backendDepartments, setBackendDepartments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBackendDepartments = async () => {
      try {
        const firmId = user?.firm_id;
        if (!firmId) return;

        const res = await axios.get(`${API}/firms/${firmId}/departments`);
        setBackendDepartments(res.data.data || []);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.warn("Backend departments not available, using derived data:", err);
        }
      }
    };

    loadBackendDepartments();
  }, [user?.firm_id]);

  // Use backend data if available, otherwise derived
  const departments = useMemo(() => {
    return backendDepartments !== null ? backendDepartments : departmentsWithMetrics;
  }, [backendDepartments, departmentsWithMetrics]);

  const { query, results: searchResults, handleSearch, handleClear } = useSearch(departments, ["name"], "firm-departments-search");

  const filterConfig = {
    status: { getValue: (d) => (d.status === "activo" ? "Activo" : "Inactivo") },
  };

  const { filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters, filteredData } = useFilters(searchResults, filterConfig, "firm-departments-filters");

  const displayDepartments = filteredData.length > 0 ? filteredData : searchResults;
  const exportVM = buildDepartmentsExportViewModel(displayDepartments, user);
  const deptPrefsVM = buildDepartmentPreferences(preferences);

  if (coreLoading) {
    return <LoadingState message="Cargando departamentos..." />;
  }

  const totalLawyers = departments.reduce((sum, d) => sum + (d.lawyer_count || d.lawyers_count || d.lawyers || 0), 0);
  const totalCases = departments.reduce((sum, d) => sum + (d.active_cases || d.cases_count || d.cases || 0), 0);
  const activeDepartments = departments.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Departamentos</h1>
          <p className="mt-2 text-white/60">Administración de áreas jurídicas especializadas</p>
        </div>
        <div className="flex items-center gap-3">
          <PreferenceButton preferencesPanel={<p className="text-xs text-white/60">Preferencias de departamentos disponibles</p>} />
          <ExportButton exportViewModel={exportVM} />
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nuevo Departamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      {departments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-white/50">Departamentos Activos</p>
            <p className="mt-2 text-3xl font-bold text-white">{activeDepartments}</p>
            <p className="mt-1 text-xs text-white/40">de {departments.length} totales</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-white/50">Abogados</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalLawyers}</p>
            <p className="mt-1 text-xs text-white/40">distribuidos</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-wider text-white/50">Casos Totales</p>
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
        filterOptions={{ status: ["Activo", "Inactivo"] }}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleClearAllFilters}
        resultCount={displayDepartments.length}
      />

      {/* Grid de departamentos */}
      {displayDepartments.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayDepartments.map((dept, idx) => (
            <DepartmentCard key={idx} department={dept} />
          ))}
        </div>
      ) : query || Object.keys(filters).length > 0 ? (
        <SearchEmptyState query={query} filters={filters} />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <Briefcase className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 font-semibold">Sin información disponible</p>
          <p className="text-white/40 text-sm mt-2">Los datos de departamentos se sincronizarán cuando estén disponibles</p>
          <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            Crear departamento
          </button>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
        <div className="flex gap-3">
          <TrendingUp className="h-5 w-5 flex-shrink-0 text-blue-400 mt-0.5" />
          <div>
            <p className="font-medium text-blue-300">Gestión de departamentos especializados</p>
            <p className="mt-1 text-sm text-blue-200/70">
              Administra áreas jurídicas especializadas con seguimiento de abogados, casos y productividad por departamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentsPage;
