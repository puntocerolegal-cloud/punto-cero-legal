import React from 'react';
import { getWorkflowStatusColor } from '../../domain/workflowDomain';

const WorkflowStatusBadge = ({ status, className = '' }) => {
  const statusLabels = {
    active: 'Activo',
    paused: 'Pausado',
    completed: 'Completado',
    failed: 'Fallido',
    cancelled: 'Cancelado',
  };

  const color = getWorkflowStatusColor(status);
  const label = statusLabels[status] || status;

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
};

export default React.memo(WorkflowStatusBadge);
