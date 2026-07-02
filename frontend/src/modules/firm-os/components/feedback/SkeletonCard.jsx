import React from 'react';

export function SkeletonCard({ count = 1, height = '200px', variant = 'card' }) {
  const skeletons = Array.from({ length: count });

  if (variant === 'kpi') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {skeletons.map((_, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/[0.02] p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-white/10 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3">
        {skeletons.map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg bg-white/5 animate-pulse">
            <div className="h-12 w-12 bg-white/10 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-3 bg-white/10 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {skeletons.map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-6 animate-pulse" style={{ minHeight: height }}>
          <div className="h-6 bg-white/10 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
            <div className="h-20 bg-white/10 rounded mt-4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
