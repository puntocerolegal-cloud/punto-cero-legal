import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Globe, MapPin } from "lucide-react";
import { API } from "@/config/api";
import { MetricCard } from "@/shared/components";
import { CasesChart } from "@/shared/charts";
import { CURRENCIES } from "@/modules/plans/mockData";
import { ActivityDetailDrawer } from "../components/ActivityDetailDrawer";
import { ConnectionState } from "../components/ConnectionState";

/**
 * Segmentación por Países (antes Geografía) — Operaciones del System OS.
 * Grid denso de los casos reales (MongoDB) con filtros por país, moneda local y
 * moneda de pago, para ver dónde se está vendiendo. Vista completa, sin sub-pestañas.
 */
// País → moneda local (desde el catálogo maestro de monedas).
const COUNTRY_CCY = CURRENCIES.reduce((acc, c) => ({ ...acc, [c.country]: c.currency_code }), {});
const ccyOf = (country) => COUNTRY_CCY[country] || "USD";
const PAYMENT_CCY = ["Local", "USD"];

export function CountrySegmentation() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fCountry, setFCountry] = useState("");
  const [fCurrency, setFCurrency] = useState("");
  const [fPayment, setFPayment] = useState("Local");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/admin-ops/operations/cases`);
      const d = res.data;
      setCases(Array.isArray(d) ? d : d?.cases || []);
    } catch (e) { setError(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => cases.map((c) => ({ ...c, _ccy: ccyOf(c.client_country) })), [cases]);
  const countries = useMemo(() => Array.from(new Set(rows.map((r) => r.client_country).filter(Boolean))), [rows]);
  const currencies = useMemo(() => Array.from(new Set(rows.map((r) => r._ccy))), [rows]);

  const filtered = useMemo(() => rows.filter((r) =>
    (!fCountry || r.client_country === fCountry) && (!fCurrency || r._ccy === fCurrency)
  ), [rows, fCountry, fCurrency]);

  const byCountry = useMemo(() => {
    const map = {};
    filtered.forEach((r) => { const k = r.client_country || "—"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  if (loading || error) return <ConnectionState loading={loading} error={error} title="Segmentación por Países" />;

  const kpis = [
    { title: "Casos totales", value: filtered.length, icon: MapPin, accent: "#06b6d4" },
    { title: "Países activos", value: byCountry.length, icon: Globe, accent: "#3b82f6" },
    { title: "Monedas", value: new Set(filtered.map((r) => r._ccy)).size, icon: Globe, accent: "#f59e0b" },
    { title: "Moneda de pago", value: fPayment, icon: Globe, accent: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#06b6d4]/30 bg-[#06b6d4]/[0.06] px-4 py-2.5 text-xs text-[#67e8f9]">
        Operaciones · Segmentación por Países · casos reales desde MongoDB · filtra por país, moneda y moneda de pago.
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <MetricCard key={k.title} {...k} />)}
      </section>

      {/* Filtros densos */}
      <section className="flex flex-wrap gap-2 items-center">
        <Select label="País" value={fCountry} onChange={setFCountry} items={countries} />
        <Select label="Moneda" value={fCurrency} onChange={setFCurrency} items={currencies} />
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <span className="text-[11px] text-white/40 px-2">Moneda de pago:</span>
          {PAYMENT_CCY.map((p) => (
            <button key={p} onClick={() => setFPayment(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${fPayment === p ? "bg-[#06b6d4]/30 text-white" : "text-white/50 hover:text-white"}`}>
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Grid de país + tabla */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10 text-xs uppercase tracking-wider">
                <th className="p-3 pl-5">Caso</th><th className="p-3">País</th><th className="p-3">Moneda</th>
                <th className="p-3">Pago</th><th className="p-3">Área</th><th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id || r.case_number} onClick={() => setSelected(r)} className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer">
                  <td className="p-3 pl-5">
                    <div className="text-white font-medium truncate max-w-[220px]">{r.title || r.case_number}</div>
                    <div className="text-[11px] text-white/40">{r.client_name}</div>
                  </td>
                  <td className="p-3 text-white/70">{r.client_country || "—"}</td>
                  <td className="p-3 font-mono text-[#06b6d4]">{r._ccy}</td>
                  <td className="p-3 text-white/60">{fPayment === "USD" ? "USD" : r._ccy}</td>
                  <td className="p-3 text-white/70">{r.legal_area || "—"}</td>
                  <td className="p-3 text-white/60">{r.estado || r.status || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-white/40">Sin casos para estos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        <CasesChart data={byCountry} title="Casos por país" />
      </section>

      <ActivityDetailDrawer activity={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function Select({ label, value, onChange, items }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#06b6d4]/50">
      <option value="">{label}: todos</option>
      {items.map((it) => <option key={it} value={it}>{it}</option>)}
    </select>
  );
}

export default CountrySegmentation;
