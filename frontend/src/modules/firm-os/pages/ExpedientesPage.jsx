import React, { useState, useMemo } from 'react';
import { FileText, Plus, Users, FolderKanban, Search, Filter } from 'lucide-react';
import { useFirmCoreData } from '../hooks/useFirmCoreData';
import { useExpedientes } from '../hooks/useExpedientes';
import { buildExpedienteListViewModel, buildExpedientesSummaryCard } from '../application/expedienteApplication';
import { LoadingState } from '../components/shared/LoadingState';
import { SectionCard } from '../components/shared/SectionCard';
import { KPICard } from '../components/shared/KPICard';

const ExpedienteCard = ({ expediente }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{expediente.client.name}</h3>
          {expediente.client.email && (
            <p className="text-sm text-white/50 mt-1">{expediente.client.email}</p>
          )}
        </div>
        <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${expediente.statusBadge.color}`}>
          {expediente.statusBadge.label}
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 pt-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Casos activos</span>
          <span className="font-semibold text-white">{expediente.stats.active}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Casos cerrados</span>
          <span className="font-semibold text-white">{expediente.stats.closed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/70">Total casos</span>
          <span className="font-semibold text-white">{expediente.stats.total}</span>
        </div>
      </div>

      {expediente.lawyers.length > 0 && (
        <div className="border-t border-white/10 pt-4 mb-4">
          <p className="text-xs uppercase text-white/50 mb-2">Abogados asignados</p>
          <div className="flex flex-wrap gap-1">
            {expediente.lawyers.map(l => (
              <span key={l.id} className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                {l.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      <button className="w-full mt-4 rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/30 transition-colors">
        Ver detalles
      </button>
    </div>
  );
};

export function ExpedientesPage() {
  const { loading, error, lawyers, cases, clients } = useFirmCoreData();
  const { expedientes, statistics } = useExpedientes(clients, cases, lawyers);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const vm = useMemo(() => {
    return buildExpedienteListViewModel(expedientes);
  }, [expedientes]);

  const summaryCard = useMemo(() => {
    return buildExpedientesSummaryCard(statistics);
  }, [statistics]);

  const filteredExpedientes = useMemo(() => {
    let filtered = expedientes;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.client.name.toLowerCase().includes(q) ||
        e.client.email?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [expedientes, statusFilter, searchQuery]);

  if (loading) {
    return <LoadingState message="Cargando expedientes..." />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-red-400 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Expedientes
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Gestión de expedientes por cliente • {statistics.totalCases} casos
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Expediente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard label={summaryCard.total.label} value={summaryCard.total.value} status="normal" />
        <KPICard label={summaryCard.active.label} value={summaryCard.active.value} status="normal" />
        <KPICard label={summaryCard.closed.label} value={summaryCard.closed.value} status="normal" />
        <KPICard label={summaryCard.cases.label} value={summaryCard.cases.value} status="normal" />
      </div>

      {/* Search and Filter */}
      <SectionCard title="Búsqueda y filtros" isCollapsible={false}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Buscar por cliente, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'closed', 'pending'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'Todos' :
                 status === 'active' ? 'Activos' :
                 status === 'closed' ? 'Cerrados' :
                 'Pendientes'}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Expedientes Grid */}
      {filteredExpedientes.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Expedientes ({filteredExpedientes.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExpedientes.map(e => (
              <ExpedienteCard key={e.id} expediente={vm.expedientes.find(ex => ex.id === e.id)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white/70 mb-2">No hay expedientes</h3>
          <p className="text-white/50">
            {searchQuery ? 'No se encontraron expedientes que coincidan con tu búsqueda' : 'Crea un nuevo expediente para comenzar'}
          </p>
        </div>
      )}
    </div>
  );
}

export default ExpedientesPage;
