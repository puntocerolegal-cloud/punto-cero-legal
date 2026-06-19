import React from "react";
import { DataTable, StatusBadge } from "@/shared/components";

const STATUS = {
  registrado:   { tone: "pending",  label: "Registrado" },
  click:        { tone: "atencion", label: "Click" },
  convertido:   { tone: "normal",   label: "Convertido" },
  recompensado: { tone: "active",   label: "Recompensado" },
  expirado:     { tone: "critico",  label: "Expirado" },
};

/** Directorio de referidos — reutiliza DataTable. */
export function ReferralDirectory({ data = [] }) {
  const columns = [
    { key: "referido", label: "Referido", sortable: true, render: (r) => (
        <div><div className="text-white font-medium">{r.referido}</div><div className="text-[11px] text-white/40">{r.email}</div></div>
      ) },
    { key: "status", label: "Estado", render: (r) => {
        const s = STATUS[r.status] || { tone: "normal", label: r.status };
        return <StatusBadge tone={s.tone} label={s.label} />;
      } },
    { key: "plan", label: "Plan adquirido", render: (r) => r.plan || "—" },
    { key: "registeredAt", label: "Registro", sortable: true },
    { key: "purchasedAt", label: "Compra", render: (r) => r.purchasedAt || "—" },
    { key: "rewardMonths", label: "Meses ganados", sortable: true, render: (r) => (r.rewardMonths ? `+${r.rewardMonths}` : "—") },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={8}
      searchKeys={["referido", "email", "status"]}
      empty={{ title: "Sin referidos", description: "Comparte tu código para empezar a ganar meses gratis." }}
    />
  );
}

export default ReferralDirectory;
