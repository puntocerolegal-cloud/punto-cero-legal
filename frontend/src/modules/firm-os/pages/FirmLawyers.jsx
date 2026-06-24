import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";

export function FirmLawyers() {
  const [lawyers] = useState([
    { id: 1, name: "Dr. Juan Pérez", specialty: "Derecho Corporativo", cases: 8, status: "active" },
    { id: 2, name: "Dra. Sandra López", specialty: "Derecho Laboral", cases: 6, status: "active" },
    { id: 3, name: "Dr. Roberto González", specialty: "M&A", cases: 4, status: "active" },
    { id: 4, name: "Dr. Miguel Ramírez", specialty: "Tributario", cases: 3, status: "active" },
    { id: 5, name: "Dra. Catalina Morales", specialty: "Derecho Ambiental", cases: 2, status: "active" },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Abogados</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Agregar Abogado
        </button>
      </div>

      {/* Lawyers Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Especialidad</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Casos Activos</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lawyers.map((lawyer, idx) => (
              <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">{lawyer.name}</td>
                <td className="px-6 py-4 text-gray-400">{lawyer.specialty}</td>
                <td className="px-6 py-4">{lawyer.cases}</td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-xs font-semibold">
                    {lawyer.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
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
    </div>
  );
}
