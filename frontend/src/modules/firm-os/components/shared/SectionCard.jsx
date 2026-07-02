import React from "react";

export function SectionCard({ title, icon: Icon, children, footer }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
      {title && (
        <h2 className="mb-6 text-lg font-semibold uppercase tracking-wider text-white flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </h2>
      )}
      {children}
      {footer && <div className="mt-6 pt-4 border-t border-white/10">{footer}</div>}
    </div>
  );
}
