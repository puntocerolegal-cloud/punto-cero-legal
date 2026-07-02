import React from 'react';

const NotificationBadge = ({ count, hasCritical, className = '' }) => {
  if (!count || count === 0) return null;

  const bgColor = hasCritical ? 'bg-red-600' : 'bg-blue-600';

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full ${bgColor} ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default React.memo(NotificationBadge);
