import React, { useState, useEffect } from "react";
import { Users, FolderKanban, DollarSign, TrendingUp } from "lucide-react";

const MetricCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <Icon className="w-8 h-8 text-blue-400" />
    </div>
  </div>
);

export function FirmDashboard() {
  const [mockData] = useState({
    lawyers: 5,
    activeCases: 23,
    totalClients: 18,
    monthlyRevenue: 125000,
    health: 95,
    lawyersPerformance: [
      { name: "Dr. Juan Pérez", cases: 8, revenue: 35000 },
      { name: "Dra. Sandra López", cases: 6, revenue: 28000 },
      { name: "Dr. Roberto González", cases: 4, revenue: 22000 },
      { name: "Dr. Miguel Ramírez", cases: 3, revenue: 20000 },
      { name: "Dra. Catalina Morales", cases: 2, revenue: 20000 },
    ],
    upcomingDeadlines: [
      { case: "Demanda Corporativa ABC", deadline: "2025-02-15", lawyer: "Dr. Juan Pérez" },
      { case: "Contrato Laboral XYZ", deadline: "2025-02-20", lawyer: "Dra. Sandra López" },
      { case: "M&A Tech Company", deadline: "2025-02-25", lawyer: "Dr. Roberto González" },
    ],
  });

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          title="Abogados Activos"
          value={mockData.lawyers}
          subtitle="Team capacity: 5/5"
        />
        <MetricCard
          icon={FolderKanban}
          title="Casos Activos"
          value={mockData.activeCases}
          subtitle="En progreso"
        />
        <MetricCard
          icon={Users}
          title="Clientes"
          value={mockData.totalClients}
          subtitle="Cartera"
        />
        <MetricCard
          icon={DollarSign}
          title="Ingresos Mensual"
          value={`$${(mockData.monthlyRevenue / 1000).toFixed(0)}K`}
          subtitle="Enero 2025"
        />
      </div>

      {/* Rendimiento por Abogado */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Rendimiento por Abogado
        </h2>
        <div className="space-y-3">
          {mockData.lawyersPerformance.map((lawyer, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded">
              <div>
                <p className="font-medium">{lawyer.name}</p>
                <p className="text-sm text-gray-400">{lawyer.cases} casos</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(lawyer.revenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-400">Ingresos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Próximas Audiencias */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Próximas Fechas Clave</h2>
        <div className="space-y-3">
          {mockData.upcomingDeadlines.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded border-l-4 border-blue-500">
              <div>
                <p className="font-medium">{item.case}</p>
                <p className="text-sm text-gray-400">{item.lawyer}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-orange-400">{item.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
