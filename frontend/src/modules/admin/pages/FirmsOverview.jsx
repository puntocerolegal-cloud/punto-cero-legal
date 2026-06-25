import React, { useState, useEffect, useCallback } from "react";
import { Building2, Users, FolderKanban, DollarSign, TrendingUp, Plus, X, AlertCircle } from "lucide-react";
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

// Force Vercel rebuild - v2
export function FirmsOverview() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalFirms: 0,
    totalLawyers: 0,
    activeCases: 0,
    totalRevenue: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Colombia',
    plan: 'firm_growth',
    founder_name: '',
    founder_email: '',
    founder_phone: '',
    founder_bar_number: ''
  });
  const [creatingFirm, setCreatingFirm] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadFirmsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(`${API}/firms`, { headers });
      const firmsList = res.data.data || [];
      setFirms(firmsList);

      // Calculate metrics
      let totalLawyers = 0;
      let totalActiveCases = 0;
      let totalRevenue = 0;

      // Fetch detailed data for each firm
      const firmsWithDetails = await Promise.all(
        firmsList.map(async (firm) => {
          try {
            const [lawyersRes, casesRes, financialRes] = await Promise.all([
              axios.get(`${API}/firms/${firm.id}/lawyers`, { headers }),
              axios.get(`${API}/firms/${firm.id}/cases`, { headers }),
              axios.get(`${API}/firms/${firm.id}/financial`, { headers }),
            ]);

            const lawyers = lawyersRes.data.data || [];
            const cases = casesRes.data.data || [];
            const financial = financialRes.data.data || {};

            totalLawyers += lawyers.length;
            totalActiveCases += cases.filter((c) => c.status === "open" || c.status === "in_progress").length;
            totalRevenue += financial.total_revenue || 0;

            return {
              ...firm,
              lawyersCount: lawyers.length,
              activeCases: cases.filter((c) => c.status === "open" || c.status === "in_progress").length,
              totalCases: cases.length,
              revenue: financial.total_revenue || 0,
              paymentRate: financial.commission_payment_rate || 0,
              balance: financial.balance || 0,
            };
          } catch (err) {
            console.error(`Error fetching details for firm ${firm.id}:`, err);
            return {
              ...firm,
              lawyersCount: 0,
              activeCases: 0,
              totalCases: 0,
              revenue: 0,
              paymentRate: 0,
              balance: 0,
            };
          }
        })
      );

      setFirms(firmsWithDetails);
      setMetrics({
        totalFirms: firmsList.length,
        totalLawyers,
        activeCases: totalActiveCases,
        totalRevenue,
      });
    } catch (err) {
      console.error("Error loading firms:", err);
      setError("Error al cargar las firmas");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateFirm = async (e) => {
    e.preventDefault();
    setCreatingFirm(true);
    setCreateError('');
    try {
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API}/firms`, formData, { headers });
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Colombia',
        plan: 'firm_growth',
        founder_name: '',
        founder_email: '',
        founder_phone: '',
        founder_bar_number: ''
      });
      loadFirmsData();
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Error al crear la firma');
    } finally {
      setCreatingFirm(false);
    }
  };

  useEffect(() => {
    loadFirmsData();
  }, [loadFirmsData]);

  if (loading) {
    return <div className="text-center py-8">Cargando firmas...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPIs Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Building2}
          title="Total de Firmas"
          value={metrics.totalFirms}
          subtitle="Firmas registradas"
          color="border-gray-700"
        />
        <MetricCard
          icon={Users}
          title="Abogados Total"
          value={metrics.totalLawyers}
          subtitle="En todas las firmas"
          color="border-blue-700"
        />
        <MetricCard
          icon={FolderKanban}
          title="Casos Activos"
          value={metrics.activeCases}
          subtitle="En progreso"
          color="border-green-700"
        />
        <MetricCard
          icon={DollarSign}
          title="Ingresos Global"
          value={`$${(metrics.totalRevenue / 1000).toFixed(0)}K`}
          subtitle="Comisiones totales"
          color="border-yellow-700"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Directorio de Firmas</h2>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Crear Firma
        </button>
      </div>

      {/* Firmas Table */}
      {firms.length > 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Firma</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Abogados</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Casos Activos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Ingresos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Cobranza</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {firms.map((firm, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{firm.name}</p>
                        <p className="text-xs text-gray-400">{firm.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-xs font-semibold">
                        {firm.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold">{firm.lawyersCount}</span>
                      <span className="text-gray-400 text-xs ml-1">/ {firm.max_lawyers}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{firm.activeCases}</td>
                    <td className="px-6 py-4 text-sm font-semibold">${(firm.revenue / 1000).toFixed(0)}K</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={firm.paymentRate >= 80 ? "text-green-400" : firm.paymentRate >= 50 ? "text-yellow-400" : "text-red-400"}>
                        {firm.paymentRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          firm.status === "active" ? "bg-green-900/30 text-green-300" : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {firm.status === "active" ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No hay firmas registradas.
        </div>
      )}

      {/* Resumen por Plan */}
      {firms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Distribución por Plan</h3>
            <div className="space-y-2 text-sm">
              {Array.from(new Set(firms.map((f) => f.plan))).map((plan) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="text-gray-400">{plan}</span>
                  <span className="font-semibold">{firms.filter((f) => f.plan === plan).length} firmas</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Ocupancia de Licencias</h3>
            <div className="space-y-3">
              {firms.map((firm) => {
                const occupancy = ((firm.lawyersCount / firm.max_lawyers) * 100).toFixed(0);
                return (
                  <div key={firm.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{firm.name}</span>
                      <span className="text-xs font-semibold">{occupancy}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          occupancy >= 80 ? "bg-red-500" : occupancy >= 50 ? "bg-yellow-500" : "bg-green-500"
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">Top Firmas por Ingresos</h3>
            <div className="space-y-2">
              {firms
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((firm, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{firm.name}</span>
                    <span className="font-semibold">${(firm.revenue / 1000).toFixed(0)}K</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Firma */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Crear Nueva Firma</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-800 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded bg-red-900/30 border border-red-700 flex gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateFirm} className="space-y-4">
              {/* SECCIÓN: INFORMACIÓN DE LA FIRMA */}
              <div className="border-b border-gray-700 pb-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Información de la Firma</h4>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Nombre de la Firma</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Email de la Firma</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Plan</label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="firm_growth">Crecimiento (5 abogados)</option>
                      <option value="firm_enterprise">Enterprise (20 abogados)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: SOCIO FUNDADOR */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Socio Fundador</h4>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.founder_name}
                    onChange={(e) => setFormData({ ...formData, founder_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Email (para Acceso)</label>
                  <input
                    type="email"
                    value={formData.founder_email}
                    onChange={(e) => setFormData({ ...formData, founder_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.founder_phone}
                    onChange={(e) => setFormData({ ...formData, founder_phone: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">Tarjeta Profesional</label>
                  <input
                    type="text"
                    value={formData.founder_bar_number}
                    onChange={(e) => setFormData({ ...formData, founder_bar_number: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingFirm}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded transition-colors font-semibold"
                >
                  {creatingFirm ? 'Creando...' : 'Crear Firma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
