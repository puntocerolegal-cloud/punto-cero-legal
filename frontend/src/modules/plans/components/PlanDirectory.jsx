import React from "react";
import { DataTable } from "@/shared/components";
import { PlanStatusBadge } from "./PlanStatusBadge";
import { localPrice, formatMoney } from "../currency";
import { describeLimit } from "../access";

/**
 * Directorio de planes — reutiliza DataTable.
 * Muestra el precio en la moneda seleccionada (currency) + ingreso generado.
 */
export function PlanDirectory({ data = [], currency, onRowClick }) {
  const code = currency?.currency_code || "USD";
  const columns = [
    { key: "name", label: "Nombre", sortable: true, render: (r) => <span className="text-white font-medium">{r.name}</span> },
    { key: "priceUsd", label: "Precio", sortable: true, render: (r) => (
        <div>
          <div className="text-white">{formatMoney(localPrice(r, currency), code)}</div>
          <div className="text-[11px] text-white/40">{formatMoney(r.priceUsd, "USD")} base</div>
        </div>
      ) },
    { key: "max_users", label: "Usuarios", render: (r) => describeLimit(r.limits?.max_users) },
    { key: "max_cases", label: "Casos", render: (r) => describeLimit(r.limits?.max_cases) },
    { key: "status", label: "Estado", render: (r) => <PlanStatusBadge status={r.status} /> },
    { key: "orgs", label: "Organizaciones", sortable: true },
    { key: "revenue", label: "Ingreso generado", sortable: true, render: (r) => formatMoney(localPrice(r, currency) * (r.orgs || 0), code) },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={8}
      searchKeys={["name"]}
      onRowClick={onRowClick}
      empty={{ title: "Sin planes", description: "Aún no hay planes configurados." }}
    />
  );
}

export default PlanDirectory;
