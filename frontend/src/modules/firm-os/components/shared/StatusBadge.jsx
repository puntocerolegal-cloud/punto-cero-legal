import React from "react";

export function StatusBadge({ status = "pendiente", variant = "inline" }) {
  const statusStyles = {
    activo: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    inactivo: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    trial: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    ocupado: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    disponible: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    advertencia: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    crítico: "bg-red-500/20 text-red-300 border-red-500/30",
    pendiente: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    suspendido: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const label = {
    activo: "Activo",
    inactivo: "Inactivo",
    trial: "Trial",
    ocupado: "Ocupado",
    disponible: "Disponible",
    advertencia: "Advertencia",
    crítico: "Crítico",
    pendiente: "Pendiente",
    suspendido: "Suspendido",
  };

  const style = statusStyles[status] || statusStyles.pendiente;
  const text = label[status] || status;

  if (variant === "dot") {
    const dotColors = {
      activo: "bg-emerald-400",
      inactivo: "bg-amber-400",
      trial: "bg-cyan-400",
      ocupado: "bg-orange-400",
      disponible: "bg-emerald-400",
      advertencia: "bg-amber-400",
      crítico: "bg-red-400",
      pendiente: "bg-slate-400",
      suspendido: "bg-red-400",
    };
    return <div className={`w-2 h-2 rounded-full ${dotColors[status] || dotColors.pendiente}`}></div>;
  }

  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium border ${style}`}>
      {text}
    </div>
  );
}
