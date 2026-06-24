import React, { useState } from "react";
import { Plus } from "lucide-react";

export function FirmCases() {
  const [cases] = useState([
    { id: 1, title: "Demanda Corporativa ABC", client: "ABC Corp", lawyer: "Dr. Juan Pérez", status: "open", priority: "high" },
    { id: 2, title: "Contrato Laboral XYZ", client: "XYZ Ltd", lawyer: "Dra. Sandra López", status: "in_progress", priority: "medium" },
    { id: 3, title: "M&A Tech Company", client: "Tech Ventures", lawyer: "Dr. Roberto González", status: "in_progress", priority: "high" },
    { id: 4, title: "Revisión Tributaria", client: "Finance Co", lawyer: "Dr. Miguel Ramírez", status: "pending", priority: "low" },
    { id: 5, title: "Permisos Ambientales", client: "Green Energy", lawyer: "Dra. Catalina Morales", status: "open", priority: "medium" },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "open": return "bg-blue-900/30 text-blue-300";
      case "in_progress": return "bg-yellow-900/30 text-yellow-300";
      case "pending": return "bg-gray-700 text-gray-300";
      default: return "bg-green-900/30 text-green-300";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Casos</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo Caso
        </button>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem, idx) => (
          <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
            <h3 className="font-semibold text-lg mb-2">{caseItem.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{caseItem.client}</p>
            
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-gray-500">Abogado</p>
                <p className="text-sm">{caseItem.lawyer}</p>
              </div>
              
              <div className="flex gap-2">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(caseItem.status)}`}>
                  {caseItem.status === "open" ? "Abierto" : caseItem.status === "in_progress" ? "En Progreso" : "Pendiente"}
                </span>
                <span className={`inline-block px-2 py-1 text-xs font-semibold ${getPriorityColor(caseItem.priority)}`}>
                  {caseItem.priority === "high" ? "Alto" : caseItem.priority === "medium" ? "Medio" : "Bajo"}
                </span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm font-medium">
              Ver Detalles
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
