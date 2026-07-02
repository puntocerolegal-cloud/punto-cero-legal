import React from 'react';
import { Activity } from 'lucide-react';

const MissionControlHeader = React.memo(({ status = {}, timestamp = null }) => {
  const isHealthy = status.isHealthy !== false;
  const activeModules = status.activeModules || 0;
  const errorModules = status.errorModules || 0;
  const lastUpdate = status.lastUpdate || new Date().toLocaleTimeString();

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${isHealthy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <Activity size={24} className={isHealthy ? 'text-green-400' : 'text-red-400'} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mission Control</h1>
            <p className="text-slate-300 text-sm">Enterprise Orchestration Center</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-slate-400">Active Modules</div>
              <div className="text-2xl font-bold text-green-400">{activeModules}</div>
            </div>
            {errorModules > 0 && (
              <div>
                <div className="text-sm text-slate-400">Errors</div>
                <div className="text-2xl font-bold text-red-400">{errorModules}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-slate-400">Last Update</div>
              <div className="text-xs text-slate-300">{lastUpdate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MissionControlHeader.displayName = 'MissionControlHeader';
export default MissionControlHeader;
