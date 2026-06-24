import React, { useEffect, useState } from "react";
import {
  Globe,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Map,
  Activity,
  AlertCircle,
  Zap,
} from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

const money = (v, currency = "USD") => `${currency} ${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

export function GlobalNetwork() {
  const [revenue, setRevenue] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [revenueRes, countriesRes] = await Promise.allSettled([
        axios.get(`${API}/global/revenue-summary`, { headers }),
        axios.get(`${API}/global/countries`, { headers }),
      ]);

      if (revenueRes.status === "fulfilled") {
        setRevenue(revenueRes.value.data?.data || {});
      }
      if (countriesRes.status === "fulfilled") {
        setCountries(countriesRes.value.data?.data || []);
      }
    } catch (err) {
      console.error("Error loading global data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Cargando red global...</p>
        </div>
      </div>
    );
  }

  const revenueByCountry = revenue?.revenue_by_country || {};
  const revenueByFirm = revenue?.revenue_by_firm || {};
  const totalRevenue = revenue?.total_revenue_usd || 0;
  const countriesActive = revenue?.countries_active || 0;

  return (
    <div className="space-y-8">
      {/* Global Network Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-purple-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Global Legal Network OS</h2>
              <p className="text-white/60 text-sm">Red internacional de operaciones legales</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-400">{countriesActive}</p>
            <p className="text-white/60 text-sm">Países activos</p>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Ingresos Globales (USD)</p>
          <p className="text-3xl font-bold text-[#f97316]">{money(totalRevenue)}</p>
          <p className="text-green-400 text-xs mt-2">Consolidado en tiempo real</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Países Operando</p>
          <p className="text-3xl font-bold text-blue-400">{countriesActive}</p>
          <p className="text-white/60 text-xs mt-2">Jurisdicciones activas</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Firmas Conectadas</p>
          <p className="text-3xl font-bold text-green-400">{Object.keys(revenueByFirm).length}</p>
          <p className="text-white/60 text-xs mt-2">En red global</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white/60 text-sm mb-2">Red Status</p>
          <p className="text-3xl font-bold text-green-500">✓</p>
          <p className="text-white/60 text-xs mt-2">Operando globalmente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { key: "overview", label: "Resumen Global", icon: "🌍" },
            { key: "countries", label: "Países", icon: "🗺️" },
            { key: "revenue", label: "Ingresos", icon: "💰" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                selectedTab === tab.key
                  ? "border-[#f97316] text-[#f97316]"
                  : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Statistics */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Estadísticas de Red
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Países en operación</span>
                  <span className="text-white font-semibold">{countriesActive}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Firmas registradas</span>
                  <span className="text-white font-semibold">{Object.keys(revenueByFirm).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">Ingresos totales USD</span>
                  <span className="text-[#f97316] font-semibold">{money(totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Global Connections */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" /> Conexiones Internacionales
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {countries.slice(0, 6).map((country) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">{country.name}</p>
                      <p className="text-white/40 text-xs">{country.code} • {country.currency}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                        Activo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Countries Tab */}
      {selectedTab === "countries" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Países Soportados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country) => (
              <div
                key={country.code}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <p className="text-white font-semibold mb-3">{country.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Código</span>
                    <span className="text-white font-semibold">{country.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Moneda</span>
                    <span className="text-white">{country.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Zona Horaria</span>
                    <span className="text-white text-xs">{country.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Impuestos</span>
                    <span className="text-white">{(country.tax_rate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Idioma</span>
                    <span className="text-white uppercase text-xs">{country.language}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {selectedTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Countries */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Top Países por Ingresos</h4>
              <div className="space-y-2">
                {Object.entries(revenueByCountry)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([country, amount]) => (
                    <div key={country} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">{country}</span>
                      <span className="text-[#f97316] font-semibold">{money(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Firms */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Top Firmas por Ingresos</h4>
              <div className="space-y-2">
                {Object.entries(revenueByFirm)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([firm, amount]) => (
                    <div key={firm} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white/70">{firm.substring(0, 12)}...</span>
                      <span className="text-[#f97316] font-semibold">{money(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Distribución de Ingresos Globales</h4>
            <div className="space-y-3">
              {Object.entries(revenueByCountry)
                .sort(([, a], [, b]) => b - a)
                .map(([country, amount]) => {
                  const percentage = (amount / totalRevenue) * 100;
                  return (
                    <div key={country}>
                      <div className="flex justify-between mb-2">
                        <p className="text-white/70 text-sm">{country}</p>
                        <p className="text-white font-semibold text-sm">{percentage.toFixed(1)}%</p>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#f97316] to-[#f59e0b]"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalNetwork;
