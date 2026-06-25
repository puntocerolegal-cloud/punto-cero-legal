import React, { useState, useEffect, useCallback } from "react";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

const MetricCard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <Icon className="w-8 h-8 text-blue-400" />
    </div>
  </div>
);

export function FirmFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const firmId = user.firm_id;

      if (!firmId) {
        setError("No tienes acceso a un dashboard de firma");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API}/firms/${firmId}/financial`);
      setData(res.data.data);
    } catch (err) {
      console.error("Error loading financial data:", err);
      setError("Error al cargar los datos financieros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  if (loading) {
    return <div className="text-center py-8">Cargando datos financieros...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-400">Sin datos disponibles</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPIs Financieros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={DollarSign}
          title="Ingresos Total"
          value={`$${(data.total_revenue / 1000).toFixed(0)}K`}
          subtitle="Comisiones generadas"
          color="border-gray-700"
        />
        <MetricCard
          icon={CheckCircle}
          title="Pagado"
          value={`$${(data.paid_revenue / 1000).toFixed(0)}K`}
          subtitle={`${data.commission_payment_rate}% pagado`}
          color="border-green-700"
        />
        <MetricCard
          icon={AlertCircle}
          title="Pendiente"
          value={`$${(data.pending_revenue / 1000).toFixed(0)}K`}
          subtitle="En proceso"
          color="border-yellow-700"
        />
        <MetricCard
          icon={TrendingUp}
          title="Balance"
          value={`$${(data.balance / 1000).toFixed(0)}K`}
          subtitle="Disponible"
          color="border-blue-700"
        />
      </div>

      {/* Desglose Financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Comisiones */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-6">Estado de Comisiones</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Pagadas</span>
                <span className="font-semibold">${(data.paid_revenue / 1000).toFixed(1)}K</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${data.total_revenue > 0 ? (data.paid_revenue / data.total_revenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Pendiente</span>
                <span className="font-semibold">${(data.pending_revenue / 1000).toFixed(1)}K</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{
                    width: `${data.total_revenue > 0 ? (data.pending_revenue / data.total_revenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {data.rejected_revenue > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Rechazadas</span>
                  <span className="font-semibold">${(data.rejected_revenue / 1000).toFixed(1)}K</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${data.total_revenue > 0 ? (data.rejected_revenue / data.total_revenue) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">Total de Comisiones</p>
              <p className="text-2xl font-bold">${(data.total_revenue / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>

        {/* Métricas de Rendimiento */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-6">Métricas de Rendimiento</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Tasa de Pago</span>
              <span className="font-semibold text-green-400">{data.commission_payment_rate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Casos Activos</span>
              <span className="font-semibold">{data.active_cases}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Total de Comisiones</span>
              <span className="font-semibold">{data.commissions_count}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <span className="text-gray-400">Promedio por Caso</span>
              <span className="font-semibold">${(data.avg_revenue_per_case / 1000).toFixed(1)}K</span>
            </div>
            {data.total_invoiced > 0 && (
              <>
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                    <span className="text-gray-400">Facturado</span>
                    <span className="font-semibold">${(data.total_invoiced / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Resumen Financiero</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-900 rounded">
            <p className="text-gray-400 text-sm mb-1">Firma</p>
            <p className="text-lg font-semibold">{data.firm_name}</p>
          </div>
          <div className="p-4 bg-gray-900 rounded">
            <p className="text-gray-400 text-sm mb-1">Estado de Cobranza</p>
            <p className="text-lg font-semibold">
              {data.commission_payment_rate >= 80 ? "Excelente" : data.commission_payment_rate >= 50 ? "Bueno" : "Necesita Mejora"}
            </p>
          </div>
          <div className="p-4 bg-gray-900 rounded">
            <p className="text-gray-400 text-sm mb-1">Balance Disponible</p>
            <p className="text-lg font-semibold text-green-400">${(data.balance / 1000).toFixed(1)}K</p>
          </div>
        </div>
      </div>
    </div>
  );
}
