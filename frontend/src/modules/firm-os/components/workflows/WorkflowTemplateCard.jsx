import React from 'react';
import { Plus, AlertCircle, CheckCircle, Clock, Zap, Filter, FileText, Pen, Star } from 'lucide-react';

const WorkflowTemplateCard = ({ template, onSelect }) => {
  if (!template) return null;

  const icons = {
    Plus: <Plus size={24} />,
    AlertCircle: <AlertCircle size={24} />,
    Clock: <Clock size={24} />,
    Zap: <Zap size={24} />,
    Filter: <Filter size={24} />,
    FileText: <FileText size={24} />,
    Pen: <Pen size={24} />,
    Star: <Star size={24} />,
    TrendingUp: <Zap size={24} />,
  };

  const icon = icons[template.icon] || <Zap size={24} />;

  const priorityColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const priorityLabel = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  };

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      style={{ borderColor: template.color }}
      onClick={() => onSelect?.(template)}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${template.color}20` }}
        >
          <div style={{ color: template.color }}>
            {icon}
          </div>
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{template.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[template.priority]}`}>
          {priorityLabel[template.priority]}
        </span>

        <span className="text-xs text-gray-500">
          {template.conditions?.length || 0} condiciones
        </span>

        <span className="text-xs text-gray-500">
          {template.actions?.length || 0} acciones
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(template);
          }}
          className="ml-auto inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs"
        >
          <Plus size={14} />
          Usar
        </button>
      </div>
    </div>
  );
};

export default React.memo(WorkflowTemplateCard);
