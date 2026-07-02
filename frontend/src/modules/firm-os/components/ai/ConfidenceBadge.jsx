import React from 'react';

const ConfidenceBadge = ({ level, score }) => {
  const levelConfig = {
    very_low: { color: 'bg-red-100 text-red-800', label: 'Muy baja' },
    low: { color: 'bg-orange-100 text-orange-800', label: 'Baja' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Media' },
    high: { color: 'bg-blue-100 text-blue-800', label: 'Alta' },
    very_high: { color: 'bg-green-100 text-green-800', label: 'Muy alta' },
  };

  const config = levelConfig[level] || levelConfig.medium;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color.split(' ')[0]}`}></span>
      {config.label}
      {score && <span className="ml-1 font-semibold">{score}%</span>}
    </span>
  );
};

export default React.memo(ConfidenceBadge);
