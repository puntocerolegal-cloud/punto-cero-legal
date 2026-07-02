import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

const AutonomousApprovalCard = React.memo(({ approval = {}, onApprove = () => {}, onReject = () => {} }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 border-red-500/30';
      case 'expired':
        return 'bg-slate-500/20 border-slate-500/30';
      default:
        return 'bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={18} className="text-green-400" />;
      case 'rejected':
        return <XCircle size={18} className="text-red-400" />;
      case 'expired':
        return <Clock size={18} className="text-slate-400" />;
      default:
        return <AlertTriangle size={18} className="text-yellow-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return 'Pending Approval';
    }
  };

  const isExpiring = approval.isExpiring && approval.status === 'pending';
  const isPending = approval.status === 'pending';

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor(approval.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          {getStatusIcon(approval.status)}
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">Case {approval.caseId}</div>
            <div className="text-xs text-slate-300 mt-0.5">
              {new Date(approval.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <span className="text-xs font-medium text-white/70">
          {getStatusText(approval.status)}
        </span>
      </div>

      {approval.reason && (
        <div className="mb-3 text-xs text-slate-300 bg-white/5 p-2 rounded">
          {approval.reason}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div>
          <div className="text-slate-400">Impact</div>
          <div className="font-semibold text-white mt-0.5 capitalize">{approval.impact}</div>
        </div>
        <div>
          <div className="text-slate-400">Confidence</div>
          <div className="font-semibold text-white mt-0.5">{approval.confidence}%</div>
        </div>
        <div>
          <div className="text-slate-400">Status</div>
          <div className={`font-semibold mt-0.5 ${isExpiring ? 'text-orange-300' : 'text-white'}`}>
            {isExpiring ? 'Expiring' : 'Active'}
          </div>
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
          <button
            onClick={() => onApprove(approval.id)}
            className="flex-1 px-3 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 transition-all text-xs font-medium"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => onReject(approval.id)}
            className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all text-xs font-medium"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {approval.expiresAt && isPending && (
        <div className="mt-2 text-xs text-slate-400">
          Expires: {new Date(approval.expiresAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
});

AutonomousApprovalCard.displayName = 'AutonomousApprovalCard';
export default AutonomousApprovalCard;
