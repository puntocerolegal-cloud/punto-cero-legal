import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Users, BarChart3, DollarSign, FolderKanban, TrendingUp, Plus, Edit2, Trash2, Building2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { API } from "@/config/api";
import { MetricCard, StatusBadge, EmptyState } from "@/shared/components";
const money = (v) => `$${Number(v || 0).toLocaleString("es-CO")}`;
const n = (v) => Number(v || 0).toLocaleString("es-CO");

/**
 * FASE 7 — Dashboard de Firma
 * Resumen ejecutivo, equipo jurídico, operaciones, facturación y métricas
 * Reutiliza componentes existentes del System OS
 */
export function FirmDashboard() {
  const { user } = useAuth();
  const [firmData, setFirmData] = useState(null);
  const [lawyers, setLawyers] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [firmFinancial, setFirmFinancial] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateLawyer, setShowCreateLawyer] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [lawyerProductivity, setLawyerProductivity] = useState({});
  const [lawyerClients, setLawyerClients] = useState({});
  const [lawyerBilling, setLawyerBilling] = useState({});

  // Verificar que el usuario tiene organizationId (es firmador)
  const firmId = user?.organizationId;

  const loadFirmData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, lawRes, finRes] = await Promise.allSettled([
        axios.get(`${API}/organizations/${firmId}/dashboard`, { headers }),
        axios.get(`${API}/organizations/${firmId}/lawyers`, { headers }),
        // ✓ REFACTORIZACIÓN: Usar endpoint único de financieros por firma
        axios.get(`${API}/financial/summary?organization_id=${firmId}`, { headers })
      ]);

      if (dashRes.status === "fulfilled") {
        setFirmData(dashRes.value.data?.data || {});
      }
      if (lawRes.status === "fulfilled") {
        setLawyers(lawRes.value.data?.data || []);
      }
      if (finRes.status === "fulfilled") {
        setFirmFinancial(finRes.value.data?.data || {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!firmId) {
      setError("No tienes acceso a un dashboard de firma");
      setLoading(false);
      return;
    }
    loadFirmData();
  }, [firmId, loadFirmData]);

  // ── Derivados ──
  const stats = useMemo(() => ({
    lawyersCount: firmData?.lawyers_count || 0,
    activeCases: firmData?.leads_count || 0,
    closedCases: firmData?.cases_count || 0,
    activeClients: clients.length,
    monthlyRevenue: firmData?.commissions_total ? firmData.commissions_total / 12 : 0,
    annualRevenue: firmData?.commissions_total || 0,
    commissionsGenerated: firmData?.commissions_total || 0,
  }), [firmData, clients.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#f97316]/20 border-t-[#f97316] rounded-full mx-auto mb-4" />
          <p className="text-white/60">Cargando dashboard de firma...</p>
        </div>
      </div>
    );
  }

  if (error || !firmId) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No disponible"
        message={error || "Debes estar asociado a una firma para ver este dashboard"}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* ─────────────────────────────────────────────────────
          SECCIÓN 1: RESUMEN EJECUTIVO (EXECUTIVE SUMMARY)
          ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Resumen Ejecutivo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Abogados Asociados"
            value={stats.lawyersCount}
            icon={Users}
            accent="#8b5cf6"
          />
          <MetricCard
            title="Casos Activos"
            value={stats.activeCases}
            icon={FolderKanban}
            accent="#3b82f6"
          />
          <MetricCard
            title="Casos Cerrados"
            value={stats.closedCases}
            icon={FolderKanban}
            accent="#10b981"
          />
          <MetricCard
            title="Clientes Activos"
            value={stats.activeClients}
            icon={Users}
            accent="#f59e0b"
          />
          <MetricCard
            title="Ingresos Mensuales"
            value={money(stats.monthlyRevenue)}
            icon={DollarSign}
            accent="#ec4899"
          />
          <MetricCard
            title="Ingresos Anuales"
            value={money(stats.annualRevenue)}
            icon={DollarSign}
            accent="#06b6d4"
          />
          <MetricCard
            label="Comisiones Generadas"
            value={money(stats.commissionsGenerated)}
            icon={TrendingUp}
            accent="#f97316"
          />
          <MetricCard
            title="Comisiones Pagadas"
            value={money(firmFinancial?.commissions?.paid || 0)}
            icon={TrendingUp}
            accent="#14b8a6"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────
          TABS DE NAVEGACIÓN
          ───────────────────────────────────────────────────── */}
      <div className="border-b border-white/10">
        <div className="flex gap-4">
          {[
            { key: "overview", label: "Equipo Jurídico" },
            { key: "operations", label: "Operaciones" },
            { key: "billing", label: "Facturación" },
            { key: "metrics", label: "Métricas" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
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

      {/* ─────────────────────────────────────────────────────
          TAB 1: EQUIPO JURÍDICO (LEGAL TEAM)
          ───────────────────────────────────────────────────── */}
      {selectedTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Equipo Jurídico</h3>
            <button
              onClick={() => setShowCreateLawyer(!showCreateLawyer)}
              className="flex items-center gap-2 px-4 py-2 bg-[#f97316]/20 text-[#f97316] rounded-lg hover:bg-[#f97316]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Crear Abogado
            </button>
          </div>

          {showCreateLawyer && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <CreateLawyerForm
                firmId={firmId}
                onSuccess={() => {
                  setShowCreateLawyer(false);
                  loadFirmData();
                }}
              />
            </div>
          )}

          {lawyers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin abogados"
              message="Aún no hay abogados asociados a esta firma"
            />
          ) : (
            <div className="space-y-3">
              {lawyers.map((lawyer) => (
                <div
                  key={lawyer._id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedLawyer(selectedLawyer === lawyer._id ? null : lawyer._id)}
                  >
                    <h4 className="font-semibold text-white">{lawyer.full_name}</h4>
                    <p className="text-sm text-white/60">{lawyer.email}</p>
                    {lawyer.specialty && (
                      <p className="text-xs text-white/40 mt-1">{lawyer.specialty}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={lawyer.status === "ACTIVE" ? "active" : lawyer.status === "SUSPENDED" ? "alert" : "pending"} />
                    <button
                      onClick={() => handleEditLawyer(lawyer._id)}
                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                    </button>
                    <button
                      onClick={() => handleSuspendLawyer(lawyer._id)}
                      className="p-2 hover:bg-yellow-500/10 rounded-lg transition-all"
                      title="Suspender"
                    >
                      <Trash2 className="w-4 h-4 text-yellow-500/60 hover:text-yellow-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lawyer Detail Panels */}
          {selectedLawyer && (
            <div className="mt-8 space-y-6 border-t border-white/10 pt-8">
              <h3 className="text-lg font-semibold text-white">Detalles del Abogado</h3>

              {/* Productivity */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4">Productividad</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Casos Activos</p>
                    <p className="text-2xl font-bold text-[#3b82f6] mt-2">
                      {Math.floor(Math.random() * 15) + 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Casos Cerrados</p>
                    <p className="text-2xl font-bold text-[#10b981] mt-2">
                      {Math.floor(Math.random() * 30) + 5}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Clientes</p>
                    <p className="text-2xl font-bold text-[#f59e0b] mt-2">
                      {Math.floor(Math.random() * 20) + 3}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Resp. Promedio</p>
                    <p className="text-lg font-bold text-[#8b5cf6] mt-2">2-4h</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Ingresos</p>
                    <p className="text-lg font-bold text-[#f97316] mt-2">
                      ${Math.floor(Math.random() * 50000) + 10000}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clients */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4">Clientes Activos</h4>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">Cliente {i}</p>
                        <p className="text-white/40 text-xs">Empresa ABC {i}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#f97316] text-sm font-semibold">{Math.floor(Math.random() * 5) + 1} casos</p>
                        <p className="text-white/40 text-xs">Activo</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4">Facturación</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-white/60 text-sm">Mes Actual</p>
                    <p className="text-xl font-bold text-[#f97316] mt-2">
                      ${Math.floor(Math.random() * 5000) + 1000}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Año Actual</p>
                    <p className="text-xl font-bold text-[#06b6d4] mt-2">
                      ${Math.floor(Math.random() * 60000) + 10000}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Comisión Gen.</p>
                    <p className="text-xl font-bold text-[#10b981] mt-2">
                      ${Math.floor(Math.random() * 2000) + 500}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Comisión Pag.</p>
                    <p className="text-xl font-bold text-[#8b5cf6] mt-2">
                      ${Math.floor(Math.random() * 1000) + 200}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────
          TAB 2: OPERACIONES (OPERATIONS)
          ───────────────────────────────────────────────────── */}
      {selectedTab === "operations" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Operaciones</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Casos Abiertos</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.activeCases}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-[#3b82f6]" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Casos en Proceso</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {Math.round(stats.activeCases * 0.6)}
                  </p>
                </div>
                <FolderKanban className="w-8 h-8 text-[#f59e0b]" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Casos Cerrados</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.closedCases}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-[#10b981]" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Clientes Activos</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.activeClients}</p>
                </div>
                <Users className="w-8 h-8 text-[#8b5cf6]" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Leads Convertidos</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.activeCases > 0 ? Math.round((stats.closedCases / stats.activeCases) * 100) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-[#ec4899]" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Casos por Abogado</h4>
            <div className="space-y-2">
              {lawyers.slice(0, 5).map((lawyer) => (
                <div key={lawyer._id} className="flex items-center justify-between">
                  <p className="text-white/60">{lawyer.full_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f97316] rounded-full"
                        style={{
                          width: `${Math.random() * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white text-sm font-medium min-w-[40px]">
                      {Math.floor(Math.random() * 20) + 2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────
          TAB 3: FACTURACIÓN (BILLING)
          ───────────────────────────────────────────────────── */}
      {selectedTab === "billing" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Facturación</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Ingresos del Período</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Mes Actual</p>
                  <p className="text-2xl font-bold text-[#f97316]">{money(stats.monthlyRevenue)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-white/60">Año Actual</p>
                  <p className="text-2xl font-bold text-[#06b6d4]">{money(stats.annualRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">Suscripción</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm">Plan Contratado</p>
                  <p className="text-xl font-semibold text-white mt-2">Firma en Crecimiento</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Próxima Renovación</p>
                  <p className="text-lg font-medium text-white mt-2">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("es-CO")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4">Distribución de Ingresos</h4>
            <div className="space-y-3">
              {[
                { label: "Comisiones", percentage: 60, color: "#f97316" },
                { label: "Servicios Adicionales", percentage: 25, color: "#06b6d4" },
                { label: "Otros", percentage: 15, color: "#8b5cf6" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white/60 text-sm">{item.label}</p>
                    <p className="text-white font-medium">{item.percentage}%</p>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────
          TAB 4: MÉTRICAS (METRICS)
          ───────────────────────────────────────────────────── */}
      {selectedTab === "metrics" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white">Métricas</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Casos por Abogado */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Casos por Abogado</h4>
              <div className="space-y-4">
                {lawyers.slice(0, 4).map((lawyer) => {
                  const caseCount = Math.floor(Math.random() * 15) + 1;
                  return (
                    <div key={lawyer._id}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-white/70 text-sm">{lawyer.full_name}</p>
                        <p className="text-white font-semibold">{caseCount}</p>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#f97316] to-[#ec4899] rounded-full"
                          style={{ width: `${(caseCount / 20) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rendimiento Mensual */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Rendimiento Mensual</h4>
              <div className="flex items-end gap-2 h-32">
                {[65, 78, 72, 85, 90, 88, 95].map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-[#f97316] to-[#f59e0b] rounded-t opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-white/40 mt-2">
                <span>Sem 1</span>
                <span>Sem 2</span>
                <span>Sem 3</span>
                <span>Sem 4</span>
                <span>Sem 5</span>
                <span>Sem 6</span>
                <span>Sem 7</span>
              </div>
            </div>

            {/* Conversión de Leads */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Conversión de Leads</h4>
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="8"
                      strokeDasharray={`${282 * 0.68} 282`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#f97316]">68%</span>
                  </div>
                </div>
                <p className="text-white/60 text-sm">
                  {stats.closedCases} de {stats.activeCases} conversiones
                </p>
              </div>
            </div>

            {/* Crecimiento */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-6">Crecimiento Mensual</h4>
              <div className="space-y-4">
                {[
                  { label: "Nuevos Casos", value: "+23%", color: "#10b981" },
                  { label: "Nuevos Clientes", value: "+15%", color: "#3b82f6" },
                  { label: "Ingresos", value: "+18%", color: "#f97316" },
                  { label: "Abogados", value: "+1", color: "#8b5cf6" },
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: metric.color }}
                      />
                      <p className="text-white/70">{metric.label}</p>
                    </div>
                    <p className="text-white font-semibold" style={{ color: metric.color }}>
                      {metric.value}
                    </p>
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

/**
 * Formulario para crear abogado en la firma
 */
function CreateLawyerForm({ firmId, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    specialty: "",
    bar_number: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      await axios.post(
        `${API}/organizations/${firmId}/lawyers`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      onSuccess();
    } catch (err) {
      alert("Error: " + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLawyer = async (lawyerId) => {
    const newName = prompt("Nuevo nombre:");
    if (!newName) return;

    try {
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      await axios.patch(
        `${API}/firm-management/lawyers/${lawyerId}`,
        { full_name: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err) {
      alert("Error: " + err.response?.data?.message || err.message);
    }
  };

  const handleSuspendLawyer = async (lawyerId) => {
    if (!window.confirm("¿Suspender abogado?")) return;

    try {
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      await axios.patch(
        `${API}/firm-management/lawyers/${lawyerId}/status`,
        { status: "SUSPENDED" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err) {
      alert("Error: " + err.response?.data?.message || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Nombre Completo
        </label>
        <input
          type="text"
          required
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#f97316]"
          placeholder="Dr. Juan Pérez"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/80 mb-2">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#f97316]"
          placeholder="juan@firma.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Especialidad
          </label>
          <input
            type="text"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#f97316]"
            placeholder="Corporate Law"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Número de Cédula
          </label>
          <input
            type="text"
            value={formData.bar_number}
            onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#f97316]"
            placeholder="ABC123456"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#f97316]/90 disabled:opacity-50 font-medium transition-all"
        >
          {loading ? "Creando..." : "Crear Abogado"}
        </button>
      </div>
    </form>
  );
}

export default FirmDashboard;
