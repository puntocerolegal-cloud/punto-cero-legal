import React from 'react';
import { SectionCard } from '../shared/SectionCard';

export function ExecutiveChartCard({ title, icon: Icon, children, subtitle, actions }) {
  return (
    <SectionCard title={title} icon={Icon}>
      {subtitle && <p className="text-xs text-white/60 mb-4">{subtitle}</p>}
      <div className="w-full h-80 flex items-center justify-center">
        {children}
      </div>
      {actions && (
        <div className="mt-4 flex gap-2">
          {actions}
        </div>
      )}
    </SectionCard>
  );
}
