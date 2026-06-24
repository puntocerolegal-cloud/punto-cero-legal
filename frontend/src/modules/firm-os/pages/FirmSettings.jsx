import React, { useState } from "react";
import { Save } from "lucide-react";

export function FirmSettings() {
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

        <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors font-semibold mt-8">
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}
