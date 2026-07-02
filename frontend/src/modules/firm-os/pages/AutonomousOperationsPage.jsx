import React from 'react';
import { useAutonomousEngine } from '../hooks/useAutonomousEngine';
import { Activity, Gauge } from 'lucide-react';
import AutonomousModeCard from '../components/autonomous/AutonomousModeCard';
import AutonomousDecisionCard from '../components/autonomous/AutonomousDecisionCard';
import AutonomousApprovalCard from '../components/autonomous/AutonomousApprovalCard';
import AutonomousExecutionCard from '../components/autonomous/AutonomousExecutionCard';
import AutonomousStatistics from '../components/autonomous/AutonomousStatistics';
import AutonomousActivity from '../components/autonomous/AutonomousActivity';

const AutonomousOperationsPage = React.memo(() => {
  const autonomous = useAutonomousEngine();

  if (!autonomous || !autonomous.dashboard) {
    return (
      <div className="p-6 text-center text-slate-400">
        Loading Autonomous Operations Engine...
      </div>
    );
  }

  const {
    dashboard,
    modePanel,
    statisticsCard,
    metrics,
    approvalCenter,
    activityFeed,
    changeMode,
    approveDecision,
    rejectDecision,
    decisionCards,
  } = autonomous;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Activity size={32} />
          Autonomous Operations Engine
        </h1>
        <div className="text-right">
          <div className="text-sm text-slate-400">Autonomy Score</div>
          <div className={`text-3xl font-bold ${
            dashboard.autonomyScore >= 75 ? 'text-green-400' :
            dashboard.autonomyScore >= 50 ? 'text-blue-400' :
            'text-yellow-400'
          }`}>
            {dashboard.autonomyScore}
          </div>
        </div>
      </div>

      {/* Mode Selection Card */}
      <AutonomousModeCard modePanel={modePanel} onModeChange={changeMode} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400">Automation Score</div>
          <div className="text-3xl font-bold text-blue-400 mt-2">{metrics.automationScore}%</div>
          <div className="mt-2 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${metrics.automationScore}%` }} />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400">Success Rate</div>
          <div className="text-3xl font-bold text-green-400 mt-2">{metrics.executionSuccessRate}%</div>
          <div className="mt-2 h-1 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${metrics.executionSuccessRate}%` }} />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400">Pending Approvals</div>
          <div className="text-3xl font-bold text-yellow-400 mt-2">{metrics.pendingApprovals}</div>
          <div className="text-xs text-slate-400 mt-2">awaiting action</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-400">Confidence Avg</div>
          <div className="text-3xl font-bold text-purple-400 mt-2">{metrics.confidenceAverage}%</div>
          <div className="text-xs text-slate-400 mt-2">decision quality</div>
        </div>
      </div>

      {/* Decisions Pending Execution */}
      {decisionCards && decisionCards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg px-2">Pending Decisions ({decisionCards.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decisionCards.slice(0, 6).map((decision, idx) => (
              <AutonomousDecisionCard key={idx} decision={decision} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {approvalCenter && approvalCenter.pending && approvalCenter.pending.count > 0 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-lg px-2">Approvals Needed ({approvalCenter.pending.count})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvalCenter.pending.items.slice(0, 4).map((approval, idx) => (
              <AutonomousApprovalCard
                key={idx}
                approval={approval}
                onApprove={() => approveDecision(approval.id)}
                onReject={() => rejectDecision(approval.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Activity and Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AutonomousActivity activity={activityFeed} />
        <AutonomousStatistics statistics={statisticsCard} />
      </div>

      {/* Execution Summary */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-white font-semibold text-lg mb-6">Execution Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{dashboard.summary?.totalDecisions || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Total Decisions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{dashboard.summary?.autoExecuting || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Auto Executing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{dashboard.summary?.pendingApproval || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Pending Approval</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{dashboard.summary?.manualReview || 0}</div>
            <div className="text-xs text-slate-400 mt-1">Manual Review</div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {dashboard.forecast && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Gauge size={20} className="text-blue-400" />
            <h2 className="text-white font-semibold text-lg">Execution Forecast</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-400">Mode</div>
              <div className="text-lg font-bold text-white mt-1 capitalize">{dashboard.forecast.mode}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Expected Success Rate</div>
              <div className="text-lg font-bold text-green-400 mt-1">{dashboard.forecast.estimatedSuccessRate}%</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Autonomy Score</div>
              <div className="text-lg font-bold text-purple-400 mt-1">{dashboard.autonomyScore}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Execution Timeline */}
      {dashboard.timeline && dashboard.timeline.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-white font-semibold text-lg mb-4">Recent Executions</h2>
          <div className="space-y-2">
            {dashboard.timeline.slice(0, 10).map((event, idx) => (
              <AutonomousExecutionCard key={idx} execution={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

AutonomousOperationsPage.displayName = 'AutonomousOperationsPage';
export default AutonomousOperationsPage;
