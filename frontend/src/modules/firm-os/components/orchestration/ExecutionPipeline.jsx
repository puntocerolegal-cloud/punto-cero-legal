import React from 'react';
import { ArrowRight } from 'lucide-react';

const ExecutionPipeline = React.memo(({ pipeline = {} }) => {
  const stages = pipeline.stages || [];

  const getStageColor = (stageName) => {
    switch (stageName) {
      case 'Pending':
        return 'bg-slate-600 text-slate-100';
      case 'Running':
        return 'bg-blue-600 text-blue-100';
      case 'Completed':
        return 'bg-green-600 text-green-100';
      case 'Failed':
        return 'bg-red-600 text-red-100';
      default:
        return 'bg-slate-600 text-slate-100';
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-white font-semibold mb-6">Execution Pipeline</h3>
      
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, idx) => (
          <React.Fragment key={stage.name}>
            <div className="flex-1">
              <div className={`${getStageColor(stage.name)} rounded-lg p-4 text-center`}>
                <div className="text-2xl font-bold">{stage.count || 0}</div>
                <div className="text-xs mt-1 opacity-75">{stage.name}</div>
                <div className="text-xs mt-2 opacity-60">{Math.round(stage.percentage || 0)}%</div>
              </div>
            </div>
            {idx < stages.length - 1 && (
              <div className="flex-none">
                <ArrowRight size={20} className="text-slate-500" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-6 text-xs text-slate-400">
        <div>Total Executions: {pipeline.totalExecutions || 0}</div>
      </div>
    </div>
  );
});

ExecutionPipeline.displayName = 'ExecutionPipeline';
export default ExecutionPipeline;
