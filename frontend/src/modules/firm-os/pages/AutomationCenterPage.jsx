import React, { useState, useMemo } from 'react';
import { Zap, RefreshCw } from 'lucide-react';
import { useFirmCoreData } from '../hooks/useFirmCoreData';
import { useAutomation } from '../hooks/useAutomation';
import { useNotifications } from '../hooks/useNotifications';
import { LoadingState } from '../components/shared/LoadingState';
import { SectionCard } from '../components/shared/SectionCard';
import NotificationCenter from '../components/automation/NotificationCenter';
import AutomationTimeline from '../components/automation/AutomationTimeline';
import AutomationHealthCard from '../components/automation/AutomationHealthCard';
import { buildAutomationHealthCard } from '../application/notificationApplication';

export function AutomationCenterPage() {
  const { loading, error, lawyers, cases, clients } = useFirmCoreData();
  const { automationVM, history, refresh } = useAutomation(lawyers, cases, clients);
  const { 
    notifications, 
    markAsRead, 
    dismiss, 
    clearAll,
    timelineVM,
    recommendationsCenter 
  } = useNotifications(
    automationVM?.alerts || [],
    automationVM?.recommendations || [],
    history
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const healthCard = useMemo(() => buildAutomationHealthCard(automationVM), [automationVM]);

  if (loading) return <LoadingState message="Cargando Centro de Automatización..." />;
  if (error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
      <p className="text-red-400">{error}</p>
    </div>
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap size={32} />
            Centro de Automatización
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Motor de reglas en tiempo real • Notificaciones inteligentes • Recomendaciones automáticas
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <AutomationHealthCard health={healthCard} status={healthCard.status} />

      {timelineVM?.todayCount > 0 && (
        <SectionCard title={`Automatizaciones ejecutadas hoy (${timelineVM.todayCount})`}>
          <AutomationTimeline events={timelineVM.todayEvents} limit={5} />
        </SectionCard>
      )}

      <NotificationCenter
        notifications={notifications}
        recommendations={recommendationsCenter?.topRecommendations || []}
        onMarkAsRead={markAsRead}
        onDismiss={dismiss}
        onClearAll={clearAll}
      />

      {timelineVM?.events?.length > 0 && (
        <SectionCard title="Timeline Completo">
          <AutomationTimeline events={timelineVM.events} limit={20} />
        </SectionCard>
      )}
    </div>
  );
}

export default AutomationCenterPage;
