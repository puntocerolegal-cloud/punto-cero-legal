import React, { useState, useEffect } from "react";
import { Save, AlertCircle } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

export function FirmSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    firmName: "Firma Jurídica en Crecimiento",
    firmEmail: "contacto@firmacrecimiento.co",
    firmPhone: "+57 1 2345678",
    firmAddress: "Cra 7 #120-50",
    firmCity: "Bogotá",
    firmCountry: "Colombia",
    plan: "firm_growth",
    maxLawyers: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Cargar datos de la firma al montar
  useEffect(() => {
    const loadFirmSettings = async () => {
      try {
        const firmId = user?.firm_id;
        if (!firmId) return;

        const res = await axios.get(`${API}/firms/${firmId}`);
        const firm = res.data;

        setSettings({
          firmName: firm.name || "",
          firmEmail: firm.email || "",
          firmPhone: firm.phone || "",
          firmAddress: firm.address || "",
          firmCity: firm.city || "",
          firmCountry: firm.country || "Colombia",
          plan: firm.plan || "firm_growth",
          maxLawyers: firm.max_lawyers || 5,
        });
      } catch (err) {
        console.error("Error loading firm settings:", err);
      }
    };

    loadFirmSettings();
  }, [user?.firm_id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const firmId = user?.firm_id;
      if (!firmId) {
        setError("No tienes acceso a una firma");
        return;
      }

      await axios.patch(`${API}/firms/${firmId}`, {
        name: settings.firmName,
        email: settings.firmEmail,
        phone: settings.firmPhone,
        address: settings.firmAddress,
        city: settings.firmCity,
        country: settings.firmCountry,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err.response?.data?.detail || "Error al guardar cambios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Firma</h1>
        <p className="text-gray-400 mt-2">Administra la información de tu firma</p>
      </div>

      {/* Form */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8 border border-gray-700 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre de Firma</label>
          <input
            type="text"
            value={settings.firmName}
            onChange={(e) => setSettings({ ...settings, firmName: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={settings.firmEmail}
              onChange={(e) => setSettings({ ...settings, firmEmail: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              value={settings.firmPhone}
              onChange={(e) => setSettings({ ...settings, firmPhone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Dirección</label>
          <input
            type="text"
            value={settings.firmAddress}
            onChange={(e) => setSettings({ ...settings, firmAddress: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ciudad</label>
            <input
              type="text"
              value={settings.firmCity}
              onChange={(e) => setSettings({ ...settings, firmCity: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">País</label>
            <input
              type="text"
              value={settings.firmCountry}
              onChange={(e) => setSettings({ ...settings, firmCountry: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <hr className="border-gray-700" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Plan</label>
            <select
              value={settings.plan}
              onChange={(e) => setSettings({ ...settings, plan: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              disabled
            >
              <option value="firm_growth">Firma en Crecimiento</option>
              <option value="firm_enterprise">Consolidación Empresarial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max. Abogados</label>
            <input
              type="number"
              value={settings.maxLawyers}
              disabled
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-500"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg flex gap-2 text-red-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300">
            ✓ Cambios guardados exitosamente
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold mt-8"
        >
          <Save className="w-5 h-5" />
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
