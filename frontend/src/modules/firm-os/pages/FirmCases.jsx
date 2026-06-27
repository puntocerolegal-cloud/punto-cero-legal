import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

export function FirmCases() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const firmId = user?.firm_id;

      if (!firmId) {
        setError("No tienes acceso a un dashboard de firma");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API}/firms/${firmId}/cases`);
      setCases(res.data.data || []);
    } catch (err) {
      console.error("Error loading cases:", err);
      setError("Error al cargar los casos");
    } finally {
      setLoading(false);
    }
  }, [user?.firm_id]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-900/30 text-blue-300";
      case "in_progress": return "bg-yellow-900/30 text-yellow-300";
      case "pending": return "bg-gray-700 text-gray-300";
      default: return "bg-green-900/30 text-green-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando casos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <p className="text-red-300 text-sm mt-2">Por favor, intenta recargar la página</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Casos ({cases?.length || 0})</h1>
        <button
          disabled
          title="Funcionalidad en desarrollo"
          className="flex items-center gap-2 bg-gray-700 text-gray-400 px-4 py-2 rounded-lg transition-colors cursor-not-allowed opacity-50"
        >
          <Plus className="w-5 h-5" />
          Nuevo Caso
        </button>
      </div>

      {/* Cases Grid */}
      {cases && cases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((caseItem, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <h3 className="font-semibold text-lg mb-2">{caseItem.case_number}</h3>
              <p className="text-gray-400 text-sm mb-4">{caseItem.client_name}</p>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Materia</p>
                  <p className="text-sm">{caseItem.matter || "—"}</p>
                </div>

                <div className="flex gap-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status === "open" ? "Abierto" : caseItem.status === "in_progress" ? "En Progreso" : "Pendiente"}
                  </span>
                </div>
              </div>

              <button
                disabled
                title="Funcionalidad en desarrollo"
                className="w-full mt-4 px-4 py-2 bg-gray-700 text-gray-400 rounded transition-colors text-sm font-medium cursor-not-allowed opacity-50"
              >
                Ver Detalles
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No hay casos registrados en tu firma.
        </div>
      )}
    </div>
  );
}
