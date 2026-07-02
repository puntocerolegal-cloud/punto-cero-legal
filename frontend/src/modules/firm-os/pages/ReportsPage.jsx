import React, { useState } from "react";
import { TrendingUp, Download, Filter, Calendar, User, Building2 } from "lucide-react";

const ReportCard = ({ title, description, frequency, lastGenerated, icon: Icon }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm hover:border-white/20 transition-all cursor-pointer">
    <div className="flex items-start justify-between mb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
        <Icon className="h-5 w-5 text-blue-400" />
      </div>
      <button className="rounded-lg p-2 hover:bg-white/10">
        <Download className="h-4 w-4 text-white/60" />
      </button>
    </div>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="mt-1 text-sm text-white/60">{description}</p>
    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
      <span className="text-xs text-white/40">
        <strong>Frecuencia:</strong> {frequency}
      </span>
      <span className="text-xs text-white/40">
        Generado {lastGenerated}
      </span>
    </div>
  </div>
);

export function ReportsPage() {
  const [dateRange, setDateRange] = useState('month');
  const [filterLawyer, setFilterLawyer] = useState('all');
  const [filterOffice, setFilterOffice] = useState('all');

  const reports = [
    {
      id: 1,
      title: 'Productividad por Abogado',
      description: 'Análisis de casos, documentos y uso de IA por abogado',
      frequency: 'Semanal',
      lastGenerated: 'hace 2 días',
      icon: User,
    },
    {
      id: 2,
      title: 'Financiero',
      description: 'Ingresos, comisiones y facturación de la firma',
      frequency: 'Mensual',
      lastGenerated: 'hace 5 días',
      icon: TrendingUp,
    },
    {
      id: 3,
      title: 'Casos',
      description: 'Pipeline de casos, tiempos de resolución y estado',
      frequency: 'Quincenal',
      lastGenerated: 'hace 3 días',
      icon: User,
    },
    {
      id: 4,
      title: 'Por Oficina',
      description: 'Métricas desagregadas por sede de la firma',
      frequency: 'Mensual',
      lastGenerated: 'hace 8 días',
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Reportes</h1>
        <p className="mt-2 text-white/60">Generación y exportación de reportes ejecutivos</p>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-white/60" />
          <h3 className="font-semibold text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Rango de fechas */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Filtro por abogado */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50">Abogado</label>
            <select
              value={filterLawyer}
              onChange={(e) => setFilterLawyer(e.target.value)}
              className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Todos</option>
              <option value="lawyer1">Carlos Rodríguez</option>
              <option value="lawyer2">María López</option>
              <option value="lawyer3">Juan Martínez</option>
            </select>
          </div>

          {/* Filtro por oficina */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/50">Oficina</label>
            <select
              value={filterOffice}
              onChange={(e) => setFilterOffice(e.target.value)}
              className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Todas</option>
              <option value="bogota">Bogotá</option>
              <option value="medellin">Medellín</option>
              <option value="cali">Cali</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de reportes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {reports.map(report => (
          <ReportCard
            key={report.id}
            title={report.title}
            description={report.description}
            frequency={report.frequency}
            lastGenerated={report.lastGenerated}
            icon={report.icon}
          />
        ))}
      </div>

      {/* Opciones de exportación */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
        <h3 className="mb-4 font-semibold text-white">Opciones de Exportación</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 hover:bg-white/5 text-sm font-medium text-white/70 hover:text-white transition-all">
            <Download className="h-4 w-4" />
            Exportar a PDF
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 hover:bg-white/5 text-sm font-medium text-white/70 hover:text-white transition-all">
            <Download className="h-4 w-4" />
            Exportar a Excel
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 hover:bg-white/5 text-sm font-medium text-white/70 hover:text-white transition-all">
            <Download className="h-4 w-4" />
            Exportar a CSV
          </button>
        </div>
        <p className="mt-4 text-xs text-white/40">
          💡 Las opciones de exportación están preparadas arquitecturalmente. La funcionalidad se habilitará en próximas versiones.
        </p>
      </div>
    </div>
  );
}

export default ReportsPage;
