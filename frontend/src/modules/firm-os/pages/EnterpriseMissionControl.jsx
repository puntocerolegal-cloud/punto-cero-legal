import React from 'react';
import { useOrchestration } from '../hooks/useOrchestration';
import MissionControlHeader from '../components/orchestration/MissionControlHeader';
import SystemHealthCard from '../components/orchestration/SystemHealthCard';
import ExecutionPipeline from '../components/orchestration/ExecutionPipeline';
import ModuleStatus from '../components/orchestration/ModuleStatus';
import RealtimeMetric from '../components/orchestration/RealtimeMetric';
import SystemWarning from '../components/orchestration/SystemWarning';
import SystemRecommendation from '../components/orchestration/SystemRecommendation';
import ExecutionTimeline from '../components/orchestration/ExecutionTimeline';
import ResourceUsage from '../components/orchestration/ResourceUsage';

const EnterpriseMissionControl = React.memo(() => {
  const orchestration = useOrchestration();

  if (!orchestration || !orchestration.missionControl) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading Mission Control...
      </div>
    );
  }

  const { missionControl, systemMetrics, warnings, recommendations, realtimeMetrics, resourceDashboard } = orchestration;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <MissionControlHeader
        status={missionControl.headerStatus}
        timestamp={missionControl.timestamp}
      />

      {/* Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg px-2">System Health</h2>
          {missionControl.systemHealth.modules.map((module, idx) => (
            <SystemHealthCard key={idx} module={module} />
          ))}
        </div>

        {/* Real-time Metrics */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg px-2">Real-time Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(realtimeMetrics || {}).slice(0, 6).map(([key, metric]) => (
              <RealtimeMetric
                key={key}
                label={metric.label || key.replace(/([A-Z])/g, ' $1').trim()}
                value={metric.value || 0}
                unit={metric.unit || '%'}
                trend={metric.trend || 'stable'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Execution Pipeline */}
      <ExecutionPipeline pipeline={missionControl.pipelineView} />

      {/* Module Status Grid */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-4 px-2">Module Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {missionControl.systemHealth.modules.map((module, idx) => (
            <ModuleStatus key={idx} module={module} />
          ))}
        </div>
      </div>

      {/* Timeline and Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExecutionTimeline events={missionControl.timeline} />
        <ResourceUsage resources={resourceDashboard} />
      </div>

      {/* Warnings and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg px-2">System Alerts</h2>
          {warnings && warnings.length > 0 ? (
            warnings.slice(0, 5).map((warning, idx) => (
              <SystemWarning key={idx} warning={warning} />
            ))
          ) : (
            <div className="text-slate-400 text-sm p-4 text-center">
              No active warnings
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg px-2">Recommendations</h2>
          {recommendations && recommendations.length > 0 ? (
            recommendations.slice(0, 5).map((rec, idx) => (
              <SystemRecommendation key={idx} recommendation={rec} />
            ))
          ) : (
            <div className="text-slate-400 text-sm p-4 text-center">
              No recommendations at this time
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-white font-semibold text-lg mb-6">Execution Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{missionControl.executionStats?.totalExecutions || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{missionControl.executionStats?.successful || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Successful</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{missionControl.executionStats?.failed || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{missionControl.executionStats?.running || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{missionControl.executionStats?.successRate || 0}%</div>
            <div className="text-xs text-slate-400 mt-1">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
});

EnterpriseMissionControl.displayName = 'EnterpriseMissionControl';
export default EnterpriseMissionControl;
