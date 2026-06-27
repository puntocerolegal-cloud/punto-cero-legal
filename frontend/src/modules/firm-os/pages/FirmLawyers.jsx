import React, { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { TeamTable } from "../components/TeamTable";
import { InviteLawyerModal } from "../components/InviteLawyerModal";

export function FirmLawyers() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadLawyers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const firmId = user?.firm_id;

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
  }, [user?.firm_id]);

  useEffect(() => {
    loadLawyers();
  }, [loadLawyers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando abogados...</p>
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
        <h1 className="text-3xl font-bold">Abogados ({lawyers?.length || 0})</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
        >
          <Plus className="w-5 h-5" />
          Invitar Abogado
        </button>
      </div>

      {/* Lawyers Table - Reutilizando TeamTable */}
      <TeamTable
        members={lawyers}
        loading={loading}
        columns={['name', 'specialty', 'cases']}
      />

      {/* Invitar Modal */}
      <InviteLawyerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadLawyers()}
      />
    </div>
  );
}
