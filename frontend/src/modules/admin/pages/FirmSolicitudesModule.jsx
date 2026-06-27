import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  Copy,
  FileText,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { API } from '@/config/api';

export function FirmSolicitudesModule() {
  // ═══════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════

  const [firms, setFirms] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    trial_active: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [credentials, setCredentials] = useState(null);

  // FILTROS
  const [filters, setFilters] = useState({
    status: 'all', // all, pending, approved, rejected
    plan: 'all',
    country: 'all',
    search: ''
  });

  const [filteredFirms, setFilteredFirms] = useState([]);

  // ═══════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════

  const getAuthHeaders = () => {
    const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const headers = getAuthHeaders();

      // Cargar estadísticas
      const statsRes = await axios.get(`${API}/firms/stats/summary`, { headers });
      setStats(statsRes.data.data || {});

      // Cargar firmas pendientes
      const firmsRes = await axios.get(`${API}/firms/status/pending`, { headers });
      setFirms(firmsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar solicitudes');
      console.error('Error loading firms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ═══════════════════════════════════════
  // FILTRADO
  // ═══════════════════════════════════════

  useEffect(() => {
    let filtered = firms;

    // Filtro de búsqueda
    if (filters.search.trim()) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(term) ||
        f.email.toLowerCase().includes(term) ||
        f.nit?.toLowerCase().includes(term) ||
        f.owner_name.toLowerCase().includes(term)
      );
    }

    // Filtro de plan
    if (filters.plan !== 'all') {
      filtered = filtered.filter(f => f.plan === filters.plan);
    }

    // Filtro de país
    if (filters.country !== 'all') {
      filtered = filtered.filter(f => f.country === filters.country);
    }

    setFilteredFirms(filtered);
  }, [firms, filters]);

  // ═══════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════

  const handleApproveFirm = async () => {
    if (!selectedFirm) return;

    try {
      setProcessingId(selectedFirm.id);
      const headers = getAuthHeaders();

      const res = await axios.post(`${API}/firms/${selectedFirm.id}/approve`, {}, { headers });

      // Mostrar modal de credenciales
      setCredentials(res.data.credentials);
      setShowDetailModal(false);
      setShowApprovalModal(true);

      // Recargar datos después de un tiempo
      setTimeout(() => {
        loadData();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al aprobar firma');
      console.error('Error approving firm:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFirm = async () => {
    if (!selectedFirm || !rejectReason.trim()) {
      setError('El motivo del rechazo es requerido');
      return;
    }

    if (rejectReason.trim().length < 5) {
      setError('El motivo debe tener al menos 5 caracteres');
      return;
    }

    try {
      setProcessingId(selectedFirm.id);
      const headers = getAuthHeaders();

      await axios.post(
        `${API}/firms/${selectedFirm.id}/reject`,
        { reason: rejectReason },
        { headers }
      );

      // Cerrar modales
      setShowDetailModal(false);
      setShowRejectModal(false);
      setSelectedFirm(null);
      setRejectReason('');

      // Recargar datos
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al rechazar firma');
      console.error('Error rejecting firm:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // ═══════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════

  const getPlanLabel = (plan) => {
    return plan === 'firm_growth' ? 'Crecimiento (5)' : 'Enterprise (10)';
  };

  const getCountries = () => {
    const countries = new Set(firms.map(f => f.country));
    return Array.from(countries).sort();
  };

  // ═══════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Cargando solicitudes de firmas...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════

  return (
    <div className="space-y-8">
      {/* ═══════ HEADER ═══════ */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Solicitudes de Firmas</h1>
        <p className="text-gray-400">Gestiona y aprueba las solicitudes de registro de nuevas firmas</p>
      </div>

      {/* ═══════ DASHBOARD DE ESTADÍSTICAS ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Pendientes */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-900/10 border border-yellow-700/50 rounded-xl p-6 hover:border-yellow-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-yellow-200 text-sm font-semibold uppercase tracking-wider">Pendientes</p>
            <div className="p-2 bg-yellow-600/30 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-yellow-300">{stats.pending}</p>
          <p className="text-xs text-yellow-200/60 mt-2">Aguardando revisión</p>
        </div>

        {/* Aprobadas */}
        <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-700/50 rounded-xl p-6 hover:border-green-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-200 text-sm font-semibold uppercase tracking-wider">Aprobadas</p>
            <div className="p-2 bg-green-600/30 rounded-lg">
              <Check className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-green-300">{stats.approved}</p>
          <p className="text-xs text-green-200/60 mt-2">Firmas activas</p>
        </div>

        {/* Rechazadas */}
        <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 border border-red-700/50 rounded-xl p-6 hover:border-red-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-red-200 text-sm font-semibold uppercase tracking-wider">Rechazadas</p>
            <div className="p-2 bg-red-600/30 rounded-lg">
              <X className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-red-300">{stats.rejected}</p>
          <p className="text-xs text-red-200/60 mt-2">No aprobadas</p>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-700/50 rounded-xl p-6 hover:border-blue-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">Total</p>
            <div className="p-2 bg-blue-600/30 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-300">{stats.total}</p>
          <p className="text-xs text-blue-200/60 mt-2">Solicitudes registradas</p>
        </div>

        {/* Trials Activos */}
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-700/50 rounded-xl p-6 hover:border-purple-600 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-purple-200 text-sm font-semibold uppercase tracking-wider">Trials Activos</p>
            <div className="p-2 bg-purple-600/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-purple-300">{stats.trial_active}</p>
          <p className="text-xs text-purple-200/60 mt-2">En período de prueba</p>
        </div>
      </div>

      {/* ═══════ MENSAJE DE ERROR ═══════ */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-3 text-red-300 items-start">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* ═══════ FILTROS Y BÚSQUEDA ═══════ */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-400 mb-4">
          <Filter className="w-5 h-5" />
          <span className="font-semibold">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar firma, email, NIT..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>

          {/* Filtro Plan */}
          <select
            value={filters.plan}
            onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los Planes</option>
            <option value="firm_growth">Crecimiento (5)</option>
            <option value="firm_enterprise">Enterprise (10)</option>
          </select>

          {/* Filtro País */}
          <select
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los Países</option>
            {getCountries().map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* Botón Limpiar Filtros */}
          <button
            onClick={() => setFilters({ status: 'all', plan: 'all', country: 'all', search: '' })}
            className="bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 text-white text-sm transition-colors font-medium"
          >
            Limpiar Filtros
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Mostrando {filteredFirms.length} de {firms.length} solicitudes
        </p>
      </div>

      {/* ═══════ TABLA DE SOLICITUDES ═══════ */}
      {filteredFirms.length > 0 ? (
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/60 border-b border-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Firma</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Responsable</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Teléfono</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">País</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirms.map((firm) => (
                  <tr
                    key={firm.id}
                    className="border-b border-gray-700/30 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white text-sm">{firm.name}</p>
                      <p className="text-xs text-gray-400 mt-1">NIT: {firm.nit || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{firm.owner_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{firm.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{firm.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{firm.country}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-semibold">
                        {getPlanLabel(firm.plan)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(firm.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-yellow-900/50 text-yellow-300 rounded-full text-xs font-semibold">
                        Pendiente
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedFirm(firm);
                          setShowDetailModal(true);
                        }}
                        className="p-2 hover:bg-blue-600/30 rounded transition-colors text-blue-400 hover:text-blue-300"
                        title="Ver Detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-800/30 border border-gray-700/30 rounded-lg">
          {firms.length === 0 ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-semibold">No hay solicitudes pendientes</p>
              <p className="text-gray-400 text-sm mt-2">Todas las solicitudes han sido procesadas</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 text-lg font-semibold">No hay solicitudes que coincidan con los filtros</p>
              <p className="text-gray-400 text-sm mt-2">Intenta ajustar los criterios de búsqueda</p>
            </>
          )}
        </div>
      )}

      {/* ═══════ MODAL DE DETALLES ═══════ */}
      {showDetailModal && selectedFirm && !showApprovalModal && !showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Detalles de la Solicitud</h2>
                <p className="text-gray-400 text-sm mt-1">{selectedFirm.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedFirm(null);
                  setRejectReason('');
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Información de la Firma */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  Información de la Firma
                </h3>
                <div className="grid md:grid-cols-2 gap-6 bg-gray-800/30 rounded-lg p-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Nombre</p>
                    <p className="text-white font-medium text-lg">{selectedFirm.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">NIT</p>
                    <p className="text-white font-medium">{selectedFirm.nit}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email Corporativo</p>
                    <p className="text-white font-medium break-all">{selectedFirm.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Teléfono</p>
                    <p className="text-white font-medium">{selectedFirm.phone || 'No proporcionado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Dirección</p>
                    <p className="text-white font-medium">{selectedFirm.address || 'No proporcionada'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Ciudad</p>
                    <p className="text-white font-medium">{selectedFirm.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">País</p>
                    <p className="text-white font-medium">{selectedFirm.country}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Plan Solicitado</p>
                    <p className="text-white font-medium">{getPlanLabel(selectedFirm.plan)}</p>
                  </div>
                </div>
              </div>

              {/* Información del Socio Fundador */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  Socio Fundador
                </h3>
                <div className="grid md:grid-cols-2 gap-6 bg-gray-800/30 rounded-lg p-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Nombre</p>
                    <p className="text-white font-medium">{selectedFirm.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Email</p>
                    <p className="text-white font-medium break-all">{selectedFirm.owner_email}</p>
                  </div>
                </div>
              </div>

              {/* Información de Registro */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  Información de Registro
                </h3>
                <div className="grid md:grid-cols-2 gap-6 bg-gray-800/30 rounded-lg p-4">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fecha de Registro</p>
                    <p className="text-white font-medium">
                      {new Date(selectedFirm.created_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Última Actualización</p>
                    <p className="text-white font-medium">
                      {new Date(selectedFirm.updated_at).toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="border-t border-gray-700 pt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleApproveFirm();
                  }}
                  disabled={processingId === selectedFirm.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
                >
                  {processingId === selectedFirm.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      APROBAR FIRMA
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processingId === selectedFirm.id}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  RECHAZAR
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedFirm(null);
                  }}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-white font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL DE RECHAZO ═══════ */}
      {showDetailModal && showRejectModal && selectedFirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-lg w-full">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
              <h2 className="text-2xl font-bold text-white">Rechazar Solicitud</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-300 mb-4">
                  Está a punto de <strong>rechazar</strong> la solicitud de <strong>{selectedFirm.name}</strong>
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  El propietario recibirá una notificación por email explicando el motivo del rechazo.
                </p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Motivo del Rechazo <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explica detalladamente el motivo del rechazo (mínimo 5 caracteres)..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  rows={6}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-2 text-right">
                  {rejectReason.length} / 500 caracteres
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-lg transition-colors text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectFirm}
                  disabled={
                    processingId === selectedFirm.id ||
                    !rejectReason.trim() ||
                    rejectReason.trim().length < 5
                  }
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
                >
                  {processingId === selectedFirm.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Rechazando...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Confirmar Rechazo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MODAL DE APROBACIÓN - MOSTRAR CREDENCIALES ═══════ */}
      {showApprovalModal && credentials && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-green-700 max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-900 to-green-800 border-b border-green-700 px-6 py-8">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-8 h-8 text-green-300" />
                <h2 className="text-2xl font-bold text-white">¡Firma Aprobada!</h2>
              </div>
              <p className="text-green-200 text-sm">
                Los datos de acceso se muestran a continuación. Cópialos y entrégalos manualmente al propietario.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Advertencia */}
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠️ <strong>Importante:</strong> Estas credenciales se muestran una sola vez. Asegúrate de copiarlas antes de cerrar esta ventana.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Email (Usuario)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={credentials.email}
                    readOnly
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className={`p-3 rounded-lg transition-colors ${
                      copiedField === 'email'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    title="Copiar email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedField === 'email' && (
                  <p className="text-green-400 text-xs mt-1">✓ Copiado</p>
                )}
              </div>

              {/* Contraseña */}
              {credentials.temp_password ? (
                <div>
                  <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Contraseña Temporal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={credentials.temp_password}
                      readOnly
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(credentials.temp_password, 'password')}
                      className={`p-3 rounded-lg transition-colors ${
                        copiedField === 'password'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                      title="Copiar contraseña"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedField === 'password' && (
                    <p className="text-green-400 text-xs mt-1">✓ Copiado</p>
                  )}
                </div>
              ) : (
                <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                  <p className="text-blue-200 text-sm">
                    ℹ️ <strong>Nota:</strong> El propietario ya tiene acceso configurado. No hay contraseña temporal.
                  </p>
                </div>
              )}

              {/* Copiar Ambas */}
              {credentials.temp_password && (
                <button
                  onClick={() => {
                    copyToClipboard(
                      `Email: ${credentials.email}\nContraseña: ${credentials.temp_password}`,
                      'both'
                    );
                  }}
                  className={`w-full px-4 py-3 rounded-lg transition-colors font-semibold ${
                    copiedField === 'both'
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedField === 'both' ? '✓ Ambas Copiadas' : 'Copiar Email y Contraseña'}
                </button>
              )}

              {/* Información Importante */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                <p>
                  <strong>Nota:</strong> {credentials.note}
                </p>
                <p>
                  El propietario deberá cambiar la contraseña al ingresar por primera vez.
                </p>
              </div>

              {/* Botón Cerrar */}
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setCredentials(null);
                  setSelectedFirm(null);
                }}
                className="w-full bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors text-white font-semibold"
              >
                Entendido, Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FirmSolicitudesModule;
