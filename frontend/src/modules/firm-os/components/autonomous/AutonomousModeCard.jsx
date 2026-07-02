import React from 'react';
import { Radio, ChevronRight } from 'lucide-react';

const AutonomousModeCard = React.memo(({ modePanel = {}, onModeChange = () => {} }) => {
  const getModeColor = (level) => {
    switch (level) {
      case 0: return 'from-slate-600 to-slate-700';
      case 1: return 'from-blue-600 to-blue-700';
      case 2: return 'from-cyan-600 to-cyan-700';
      case 3: return 'from-green-600 to-green-700';
      case 4: return 'from-emerald-600 to-emerald-700';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  const getBadgeColor = (level) => {
    switch (level) {
      case 0: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 1: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 2: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 3: return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 4: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`bg-gradient-to-r ${getModeColor(modePanel.level)} rounded-lg p-6 text-white border border-white/10`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Radio size={24} />
              <h3 className="text-2xl font-bold">{modePanel.name}</h3>
            </div>
            <p className="text-white/90 text-sm">{modePanel.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white/80">{modePanel.level}</div>
            <div className="text-xs text-white/60">autonomy level</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/60">Auto Execution</div>
              <div className="text-sm font-semibold mt-1">
                {modePanel.autoExecution ? '✓ Enabled' : '✗ Disabled'}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/60">Approval Required</div>
              <div className="text-sm font-semibold mt-1">
                {modePanel.requiresApproval ? '✓ Yes' : '✗ No'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {modePanel.availableModes && modePanel.availableModes.map(m => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={`p-3 rounded-lg border transition-all text-center text-xs font-medium ${
              m.value === modePanel.currentMode
                ? `${getBadgeColor(m.level)} border-2`
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <div className="font-semibold">{m.name}</div>
            <div className="text-[10px] opacity-75 mt-0.5">Level {m.level}</div>
          </button>
        ))}
      </div>
    </div>
  );
});

AutonomousModeCard.displayName = 'AutonomousModeCard';
export default AutonomousModeCard;
