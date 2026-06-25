import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";

export function FirmLawyers() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLawyers = useCallback(async () => {
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

      const res = await axios.get(`${API}/firms/${firmId}/lawyers`);
      setLawyers(res.data.data || []);
    } catch (err) {
      console.error("Error loading lawyers:", err);
      setError("Error al cargar los abogados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLawyers();
  }, [loadLawyers]);

  if (loading) {
    return <div className="text-center py-8">Cargando abogados...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Abogados ({lawyers.length})</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Agregar Abogado
        </button>
      </div>

      {/* Lawyers Table */}
      {lawyers.length > 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Especialidad</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Casos Activos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Ingresos</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lawyers.map((lawyer, idx) => (
                <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">{lawyer.name}</td>
                  <td className="px-6 py-4 text-gray-400">{lawyer.specialty || "—"}</td>
                  <td className="px-6 py-4">{lawyer.active_cases}</td>
                  <td className="px-6 py-4 font-semibold">${(lawyer.revenue / 1000).toFixed(0)}K</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                      <Edit2 className="w-4 h-4 text-blue-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          No hay abogados registrados en tu firma.
        </div>
      )}
    </div>
  );
}
