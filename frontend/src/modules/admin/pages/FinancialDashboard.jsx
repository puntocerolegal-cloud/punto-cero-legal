import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { MetricCard } from "@/shared/components";

const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;

export function FinancialDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      // ✓ REFACTORIZACIÓN: Único endpoint centralizado — Frontend SOLO consume
      const res = await axios.get(`${API}/financial/summary`, { headers });
      setSummary(res.data?.data || {});
    } catch (err) {
      console.error("Load error:", err);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Cargando Financial OS...</p>
        </div>
      </div>
    );
  }

  // ✓ REFACTORIZACIÓN: Frontend EXTRAE datos del resumen, NUNCA calcula
  const revenue = summary?.global_revenue || 0;
  const paid = summary?.global_paid || 0;
  const pending = summary?.global_pending || 0;
  const balance = summary?.global_balance || 0;
  const commissions = summary?.commissions || {};
  const invoices = summary?.invoices || {};
  const health = summary?.health || {};
  const byCountry = summary?.by_country || {};
  const byFirm = summary?.by_firm || {};
  const byVertical = summary?.by_vertical || {};
  const monthlyBreakdown = summary?.monthly_breakdown || {};

  return (
    <div className="space-y-8">
      {/* KPIs Globales */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Resumen Financiero Global</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Ingresos Globales"
            value={money(revenue)}
            icon={DollarSign}
            accent="#10b981"
          />
          <MetricCard
            title="Comisiones Pagadas"
            value={money(paid)}
            icon={CheckCircle}
            accent="#3b82f6"
          />
          <MetricCard
            title="Comisiones Pendientes"
            value={money(pending)}
            icon={Clock}
            accent="#f59e0b"
          />
          <MetricCard
            title="Balance Neto"
            value={money(balance)}
            icon={TrendingUp}
            accent="#06b6d4"
          />
          <MetricCard
            title="Tasa de Pago"
            value={`${health?.commission_payment_rate || 0}%`}
            icon={BarChart3}
            accent="#8b5cf6"
          />
        </div>
      </div>

      {/* Navegación de Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { key: "overview", label: "Resumen" },
            { key: "commissions", label: "Comisiones" },
            { key: "geography", label: "Geografía" },
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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Overview */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <h4 className="text-white font-semibold text-sm mb-3">Pendientes</h4>
              <p className="text-2xl font-bold text-yellow-400">{money(commissions?.pending || 0)}</p>
              <p className="text-white/40 text-xs mt-1">{commissions?.count ? `${(commissions.pending / commissions.total * 100).toFixed(0)}%` : "0%"} del total</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h4 className="text-white font-semibold text-sm mb-3">Aprobadas</h4>
              <p className="text-2xl font-bold text-blue-400">{money(commissions?.approved || 0)}</p>
              <p className="text-white/40 text-xs mt-1">{commissions?.count ? `${(commissions.approved / commissions.total * 100).toFixed(0)}%` : "0%"} del total</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
              <h4 className="text-white font-semibold text-sm mb-3">Pagadas</h4>
              <p className="text-2xl font-bold text-green-400">{money(commissions?.paid || 0)}</p>
              <p className="text-white/40 text-xs mt-1">{commissions?.count ? `${(commissions.paid / commissions.total * 100).toFixed(0)}%` : "0%"} del total</p>
            </div>
          </div>

          {/* Invoices Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold text-sm mb-3">Facturas Borrador</h4>
              <p className="text-2xl font-bold text-white">{money(invoices?.draft || 0)}</p>
              <p className="text-white/40 text-xs mt-1">{invoices?.count || 0} total facturas</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold text-sm mb-3">Facturas Emitidas</h4>
              <p className="text-2xl font-bold text-white">{money(invoices?.issued || 0)}</p>
              <p className="text-white/40 text-xs mt-1">En espera de pago</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold text-sm mb-3">Facturas Pagadas</h4>
              <p className="text-2xl font-bold text-white">{money(invoices?.paid || 0)}</p>
              <p className="text-white/40 text-xs mt-1">Completadas</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Commissions */}
      {selectedTab === "commissions" && (
        <div className="space-y-6">
          <h3 className="text-white font-semibold">Desglose de Comisiones por Estado</h3>
          <div className="space-y-4">
            {commissions?.total > 0 && (
              <>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-white/70 text-sm">Pendientes</p>
                    <p className="text-white font-semibold text-sm">{money(commissions.pending)}</p>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500" style={{ width: `${(commissions.pending / commissions.total) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-white/70 text-sm">Aprobadas</p>
                    <p className="text-white font-semibold text-sm">{money(commissions.approved)}</p>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(commissions.approved / commissions.total) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-white/70 text-sm">Pagadas</p>
                    <p className="text-white font-semibold text-sm">{money(commissions.paid)}</p>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${(commissions.paid / commissions.total) * 100}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB: Geography */}
      {selectedTab === "geography" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Ingresos por País</h4>
              <div className="space-y-3">
                {Object.entries(byCountry)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([country, amount]) => (
                    <div key={country} className="flex items-center justify-between p-2">
                      <p className="text-white/70 text-sm">{country}</p>
                      <p className="text-white font-semibold">{money(amount)}</p>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Ingresos por Firma</h4>
              <div className="space-y-3">
                {Object.entries(byFirm)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
                  .map(([firm, amount]) => (
                    <div key={firm} className="flex items-center justify-between p-2">
                      <p className="text-white/70 text-sm">{firm?.substring(0, 12)}...</p>
                      <p className="text-white font-semibold">{money(amount)}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialDashboard;
