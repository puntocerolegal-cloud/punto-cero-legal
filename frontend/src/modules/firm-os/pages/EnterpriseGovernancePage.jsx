import React from 'react';
import { useGovernance } from '../hooks/useGovernance';
import { Shield, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import AuditLog from '../components/governance/AuditLog';
import PolicyManager from '../components/governance/PolicyManager';
import ComplianceMetrics from '../components/governance/ComplianceMetrics';
import GovernanceSummary from '../components/governance/GovernanceSummary';

const EnterpriseGovernancePage = React.memo(() => {
  const governance = useGovernance();

  if (!governance || !governance.governanceDashboard) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading Enterprise Governance Layer...
      </div>
    );
  }

  const {
    governanceDashboard,
    auditPanel,
    policyPanel,
    compliancePanel,
    metricsPanel,
    executiveSummary,
    togglePolicy,
  } = governance;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Shield size={32} />
          Enterprise Governance Layer
        </h1>
        <div className="text-right">
          <div className="text-sm text-slate-400">System Health</div>
          <div className={`text-2xl font-bold capitalize ${
            governanceDashboard.summary?.systemHealth === 'excellent' ? 'text-green-400' :
            governanceDashboard.summary?.systemHealth === 'good' ? 'text-blue-400' :
            'text-yellow-400'
          }`}>
            {governanceDashboard.summary?.systemHealth || 'unknown'}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <GovernanceSummary summary={executiveSummary} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Total Audit Events</div>
          <div className="text-3xl font-bold text-white">{governanceDashboard.summary?.totalEvents || 0}</div>
          <div className="text-xs text-slate-400 mt-2">recorded in system</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Active Policies</div>
          <div className="text-3xl font-bold text-green-400">{policyPanel?.activePolicies || 0}</div>
          <div className="text-xs text-slate-400 mt-2">of {policyPanel?.totalPolicies || 0} total</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400 mb-2">Compliance Rate</div>
          <div className="text-3xl font-bold text-blue-400">{compliancePanel?.overallCompliance || 0}%</div>
          <div className="text-xs text-slate-400 mt-2">system-wide</div>
        </div>
      </div>

      {/* Metrics Panels */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {metricsPanel && Object.entries(metricsPanel).slice(0, 6).map(([key, metric]) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-2">{metric.label}</div>
            <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}%</div>
            {metric.trend && (
              <div className="text-xs text-slate-400 mt-1">
                {metric.trend === 'up' ? '↗ Trending up' : metric.trend === 'down' ? '↘ Trending down' : '→ Stable'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Compliance & Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceMetrics metrics={metricsPanel || {}} compliance={compliancePanel || {}} />
        <PolicyManager panel={policyPanel || {}} onTogglePolicy={togglePolicy} />
      </div>

      {/* Audit Trail */}
      <AuditLog events={auditPanel?.recentEvents || []} />

      {/* System Information */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-1">Integrated Engines</div>
            <div className="text-white font-semibold">8</div>
            <div className="text-xs text-slate-500">All operational</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Last Event</div>
            <div className="text-white font-semibold">
              {governanceDashboard.summary?.lastEvent
                ? new Date(governanceDashboard.summary.lastEvent.timestamp).toLocaleTimeString()
                : 'None'}
            </div>
            <div className="text-xs text-slate-500">Recent activity</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Architecture</div>
            <div className="text-white font-semibold">D→A→H→C→P</div>
            <div className="text-xs text-slate-500">Domain driven</div>
          </div>
          <div>
            <div className="text-slate-400 mb-1">Persistence</div>
            <div className="text-white font-semibold">localStorage</div>
            <div className="text-xs text-slate-500">Client-side only</div>
          </div>
        </div>
      </div>
    </div>
  );
});

EnterpriseGovernancePage.displayName = 'EnterpriseGovernancePage';
export default EnterpriseGovernancePage;
