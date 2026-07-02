import React from "react";

export function EmptyState({ icon: Icon, title, description, button }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-white/40" />}
      {title && <p className="text-white/60 font-medium mb-2">{title}</p>}
      {description && <p className="text-white/50 text-sm mb-4">{description}</p>}
      {button && <div>{button}</div>}
    </div>
  );
}
