import React, { useState, useMemo } from 'react';
import { Clock, Plus } from 'lucide-react';
import { useScheduler } from '../hooks/useScheduler';
import { useWorkflows } from '../hooks/useWorkflows';
import { useFirmCoreData } from '../hooks/useFirmCoreData';
import { LoadingState } from '../components/shared/LoadingState';
import { SectionCard } from '../components/shared/SectionCard';
import ScheduleCard from '../components/scheduler/ScheduleCard';
import SchedulerStatistics from '../components/scheduler/SchedulerStatistics';
import SchedulerToolbar from '../components/scheduler/SchedulerToolbar';
import UpcomingExecutions from '../components/scheduler/UpcomingExecutions';

export function SchedulerPage() {
  const { loading: coreLoading } = useFirmCoreData();
  const { workflows } = useWorkflows();
  const scheduler = useScheduler();
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredSchedules = useMemo(() => {
    if (filterStatus === 'all') return scheduler.schedules;
    if (filterStatus === 'active') return scheduler.schedules.filter(s => s.enabled);
    if (filterStatus === 'paused') return scheduler.schedules.filter(s => !s.enabled);
    return scheduler.schedules;
  }, [scheduler.schedules, filterStatus]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  if (coreLoading) return <LoadingState message="Cargando Scheduler..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Clock size={32} />
            Scheduler Enterprise
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Ejecución automática de workflows • Programación flexible • Historial completo
          </p>
        </div>
      </div>

      <SchedulerStatistics statistics={scheduler.statistics} />

      <SchedulerToolbar
        onCreateNew={() => setShowCreateModal(true)}
        onRefresh={handleRefresh}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        isRefreshing={isRefreshing}
      />

      <SectionCard title={`Schedules Programados (${filteredSchedules.length})`}>
        <div className="grid grid-cols-1 gap-4">
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map(schedule => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onEdit={(id) => {
                  // Implementar edición
                }}
                onPause={(id) => {
                  scheduler.pause(id);
                }}
                onResume={(id) => {
                  scheduler.resume(id);
                }}
                onDuplicate={(id) => {
                  scheduler.duplicate(id);
                }}
                onDelete={(id) => {
                  if (confirm('¿Eliminar este schedule?')) {
                    scheduler.delete(id);
                  }
                }}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No hay schedules programados</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Crear primer schedule
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {scheduler.upcomingExecutions.length > 0 && (
        <SectionCard title={`Próximas ${Math.min(scheduler.upcomingExecutions.length, 10)} Ejecuciones`}>
          <UpcomingExecutions executions={scheduler.upcomingExecutions} limit={10} />
        </SectionCard>
      )}

      {scheduler.history.length > 0 && (
        <SectionCard title={`Historial de Ejecuciones (${scheduler.history.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Schedule</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Último Resultado</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Ejecuciones</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Tasa Éxito</th>
                </tr>
              </thead>

              <tbody>
                {scheduler.history.slice(0, 10).map((record) => (
                  <tr key={record.scheduleId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {record.scheduleName}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {new Date(record.timestamp).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      {record.executionCount}
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        record.successRate >= 90
                          ? 'bg-green-100 text-green-800'
                          : record.successRate >= 70
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.successRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default SchedulerPage;
