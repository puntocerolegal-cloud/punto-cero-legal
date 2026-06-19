import * as React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

/**
 * Estado vacío reutilizable — Punto Cero OS.
 * props: icon (lucide), title, description, action (ReactNode).
 */
export function EmptyState({ icon: Icon = Inbox, title = "Sin datos", description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02]",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white/40" />
      </div>
      <h3 className="text-white font-semibold">{title}</h3>
      {description && <p className="text-sm text-white/50 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
