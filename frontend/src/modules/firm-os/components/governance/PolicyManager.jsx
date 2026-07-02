import React from 'react';
import { Toggle, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

const PolicyManager = React.memo(({ panel = {}, onTogglePolicy = () => {} }) => {
  const getScopeColor = (scope) => {
    const colors = {
      automation: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      workflow: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      scheduler: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      assignment: 'bg-green-500/20 text-green-300 border-green-500/30',
      escalation: 'bg-red-500/20 text-red-300 border-red-500/30',
      notification: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    };
    return colors[scope] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  const getTypeIcon = (type) => {
    if (type === 'threshold') return '⚠️';
    if (type === 'rule') return '📋';
    if (type === 'constraint') return '🔒';
    if (type === 'approval_gate') return '✅';
    return '⚙️';
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Shield size={18} />
          Policy Framework
        </h3>
        <span className="text-xs text-slate-400">
          {panel.activePolicies || 0} Active / {panel.totalPolicies || 0} Total
        </span>
      </div>

      <div className="space-y-3">
        {panel.policies && panel.policies.length > 0 ? (
          panel.policies.map((policy) => (
            <div
              key={policy.id}
              className={`border rounded-lg p-4 ${getScopeColor(policy.scope)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(policy.type)}</span>
                    <h4 className="font-semibold text-white">
                      {policy.description || `${policy.scope} Policy`}
                    </h4>
                  </div>
                  <div className="text-xs text-slate-300 mt-2">
                    <span className="inline-block mr-3">Scope: <strong>{policy.scope}</strong></span>
                    <span className="inline-block">Rules: <strong>{policy.ruleCount || 0}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{policy.compliance || 95}%</div>
                    <div className="text-xs text-slate-400">Compliance</div>
                  </div>
                  <button
                    onClick={() => onTogglePolicy(policy.id)}
                    className={`p-2 rounded-lg transition-all ${
                      policy.active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={policy.active ? 'Disable' : 'Enable'}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">
            No policies configured
          </div>
        )}
      </div>
    </div>
  );
});

PolicyManager.displayName = 'PolicyManager';
export default PolicyManager;
