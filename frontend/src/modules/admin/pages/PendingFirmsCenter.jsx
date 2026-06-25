import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle, CheckCircle, XCircle, Eye, Check, X } from 'lucide-react';
import { API } from '@/config/api';

export function PendingFirmsCenter() {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const loadPendingFirms = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API}/firms/status/pending`, { headers });
      setFirms(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar firmas pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingFirms();
  }, []);

  const handleApproveFirm = async (firmId) => {
    if (!window.confirm('¿Estás seguro de que deseas aprobar esta firma?')) return;
    
    try {
      setProcessingId(firmId);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(`${API}/firms/${firmId}/approve`, {}, { headers });
      
      setFirms(firms.filter(f => f.id !== firmId));
      setShowDetailModal(false);
      setSelectedFirm(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al aprobar firma');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFirm = async () => {
    if (!selectedFirm) return;
    
    try {
      setProcessingId(selectedFirm.id);
      const token = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(
        `${API}/firms/${selectedFirm.id}/reject`,
        { reason: rejectReason },
        { headers }
      );
      
      setFirms(firms.filter(f => f.id !== selectedFirm.id));
      setShowDetailModal(false);
      setShowRejectModal(false);
      setSelectedFirm(null);
      setRejectReason('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al rechazar firma');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Centro de Aprobación</h2>
        <p className="text-gray-400">Revisa y aprueba firmas pendientes</p>
      </div>

      {/* Métricas */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Pendientes de Aprobación</p>
          <p className="text-3xl font-bold text-white">{firms.length}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Estado</p>
          <p className="text-lg font-semibold text-yellow-400">En Revisión</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Acción Requerida</p>
          <p className="text-lg font-semibold text-orange-400">{firms.length > 0 ? 'Sí' : 'No'}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-700 flex gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Tabla de Firmas */}
      {firms.length > 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Firma</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">NIT</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Socio Fundador</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Ciudad</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Registro</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {firms.map((firm, idx) => (
                  <tr key={idx} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{firm.name}</p>
                      <p className="text-xs text-gray-400">{firm.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{firm.nit}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{firm.owner_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{firm.city}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full text-xs font-semibold">
                        {firm.plan === 'firm_growth' ? 'Crecimiento (5)' : 'Enterprise (10)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(firm.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedFirm(firm);
                            setShowDetailModal(true);
                          }}
                          className="p-2 hover:bg-gray-600 rounded transition-colors text-gray-300 hover:text-white"
                          title="Ver Detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">No hay firmas pendientes de aprobación</p>
          <p className="text-gray-400 text-sm mt-2">Todas las firmas han sido procesadas</p>
        </div>
      )}

      {/* Modal de Detalles */}
      {showDetailModal && selectedFirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-900 border-b border-gray-700 p-6 z-10">
              <h2 className="text-2xl font-bold text-white">Detalles de la Firma</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowRejectModal(false);
                  setSelectedFirm(null);
                }}
                className="p-1 hover:bg-gray-800 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!showRejectModal ? (
                <>
                  {/* Firma Info */}
                  <div>
                    <h3 className="font-semibold text-white mb-4">Información de la Firma</h3>
                    <div className="grid md:grid-cols-2 gap-4 space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">Nombre</p>
                        <p className="text-white font-medium">{selectedFirm.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">NIT</p>
                        <p className="text-white font-medium">{selectedFirm.nit}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email Corporativo</p>
                        <p className="text-white font-medium">{selectedFirm.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Plan</p>
                        <p className="text-white font-medium">
                          {selectedFirm.plan === 'firm_growth' ? 'Firma en Crecimiento (5 abogados)' : 'Consolidación Empresarial (10 abogados)'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Ciudad</p>
                        <p className="text-white font-medium">{selectedFirm.city}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">País</p>
                        <p className="text-white font-medium">{selectedFirm.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Socio Fundador */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="font-semibold text-white mb-4">Socio Fundador</h3>
                    <div className="grid md:grid-cols-2 gap-4 space-y-2">
                      <div>
                        <p className="text-gray-400 text-sm">Nombre</p>
                        <p className="text-white font-medium">{selectedFirm.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white font-medium">{selectedFirm.owner_email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Registro */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="font-semibold text-white mb-4">Información de Registro</h3>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Fecha de Registro</p>
                      <p className="text-white font-medium">
                        {new Date(selectedFirm.created_at).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="border-t border-gray-700 pt-6 flex gap-3">
                    <button
                      onClick={() => handleApproveFirm(selectedFirm.id)}
                      disabled={processingId === selectedFirm.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
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
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      RECHAZAR
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Rechazo Form */}
                  <div>
                    <h3 className="font-semibold text-white mb-4">Motivo del Rechazo</h3>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explica el motivo del rechazo..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg transition-colors text-white font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleRejectFirm}
                      disabled={processingId === selectedFirm.id || !rejectReason.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors text-white font-semibold flex items-center justify-center gap-2"
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingFirmsCenter;
