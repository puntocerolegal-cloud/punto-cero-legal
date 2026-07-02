// Application layer for assignments - orchestrates domain + data
import { composeAssignmentsData, getRecommendedLawyers } from "../domain";

export function buildAssignmentsViewModel(lawyers = [], cases = []) {
  const assignmentsData = composeAssignmentsData(lawyers, cases);
  const { cases: caseData, lawyers: lawyerData } = assignmentsData;

  return {
    // Header
    header: {
      title: "Centro Inteligente de Asignación",
      subtitle: "Asigna casos a los abogados más adecuados automáticamente",
    },

    // Summary stats
    summaryStats: [
      {
        label: "Casos pendientes",
        value: caseData.pending.length,
        color: "text-blue-400",
      },
      {
        label: "Abogados disponibles",
        value: lawyerData.available.length,
        color: "text-emerald-400",
      },
    ],

    // Cases panel
    casesPanel: {
      title: "Casos Pendientes",
      count: caseData.pending.length,
      cases: caseData.pending.map(c => ({
        id: c.case_number,
        caseNumber: c.case_number || "Caso sin número",
        clientName: c.client_name || "Cliente",
        caseType: c.case_type || "Tipo no especificado",
        status: c.assignment_status || "nuevo",
        statusDot:
          c.assignment_status === "asignado" ? "bg-purple-400" :
          c.assignment_status === "pendiente" ? "bg-amber-400" :
          "bg-blue-400",
      })),
      isEmpty: caseData.pending.length === 0,
      emptyMessage: "Todos los casos están asignados",
    },

    // Recommendations generator
    getRecommendations: (selectedCase) => {
      if (!selectedCase) return [];
      return getRecommendedLawyers(lawyers, selectedCase, 5).map(lawyer => ({
        id: lawyer.id,
        name: lawyer.name || "Abogado",
        specialty: lawyer.specialty || "Especialidad",
        score: lawyer.score,
        reason: lawyer.reason,
        metrics: {
          activeCases: lawyer.total_cases || 0,
          office: lawyer.office || "N/A",
          available: lawyer.available !== false ? "Disponible" : "Limitada",
          department: lawyer.department || "N/A",
        },
        scoreColor:
          lawyer.score >= 90 ? "text-emerald-400" :
          lawyer.score >= 70 ? "text-amber-400" :
          "text-white/60",
      }));
    },

    // Lawyers panel
    lawyersPanel: {
      title: "Abogados Recomendados",
      count: lawyerData.available.length,
      isEmpty: caseData.pending.length === 0,
      emptyMessage: "Selecciona un caso para ver recomendaciones",
    },

    // Summary
    summary: {
      pendingCases: caseData.pending.length,
      availableLawyers: lawyerData.available.length,
      totalCases: caseData.total,
    },
  };
}
