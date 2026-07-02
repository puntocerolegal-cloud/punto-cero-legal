import React, { useMemo } from 'react';
import { Brain, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { useFirmCoreData } from '../hooks/useFirmCoreData';
import { useAIDecision } from '../hooks/useAIDecision';
import { LoadingState } from '../components/shared/LoadingState';
import { SectionCard } from '../components/shared/SectionCard';
import InsightCard from '../components/ai/InsightCard';
import ExecutiveSummary from '../components/ai/ExecutiveSummary';
import ConfidenceBadge from '../components/ai/ConfidenceBadge';

export function IntelligenceCenterPage() {
  const { loading, error, lawyers, cases, clients, departments } = useFirmCoreData();
  const ai = useAIDecision(lawyers, cases, clients, departments);

  if (loading) return <LoadingState message="Analizando datos con IA..." />;
  if (error) return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
      <p className="text-red-400">{error}</p>
    </div>
  );

  const topRecommendations = ai.recommendations.recommendations.slice(0, 3);
  const topRisks = ai.riskAnalysis.risksByLawyer.slice(0, 3);
  const topBurnouts = ai.riskAnalysis.burnoutByLawyer.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Brain size={32} />
            AI Executive Intelligence
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Motor de análisis sin IA externa • Algoritmos heurísticos puros • Recomendaciones inteligentes
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary summary={ai.summary} />

      {/* Top Recommendations */}
      {topRecommendations.length > 0 && (
        <SectionCard title="Recomendaciones Prioritarias">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecommendations.map((rec, idx) => (
              <div key={idx} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-sm text-gray-900">{rec.recommendation || rec.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{rec.description || rec.explanation}</p>
                <div className="flex items-center justify-between mt-2">
                  <ConfidenceBadge level={rec.confidence} />
                  <span className="text-sm font-bold text-blue-600">{rec.score || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Risk Analysis */}
      {topRisks.length > 0 && (
        <SectionCard title="Análisis de Riesgos Detectados">
          <div className="space-y-3">
            {topRisks.slice(0, 5).map((risk, idx) => (
              <div key={idx} className="p-3 border border-red-200 rounded-lg bg-red-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{risk.lawyerName}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {risk.atRiskCases} casos críticos en próximos 14 días
                  </p>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  risk.riskLevel === 'critical'
                    ? 'bg-red-200 text-red-800'
                    : risk.riskLevel === 'high'
                    ? 'bg-orange-200 text-orange-800'
                    : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {risk.riskLevel.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Burnout Indicators */}
      {topBurnouts.length > 0 && topBurnouts[0].risk !== 'low' && (
        <SectionCard title="Indicadores de Burnout">
          <div className="space-y-3">
            {topBurnouts.slice(0, 3).map((burnout, idx) => (
              <div key={idx} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{burnout.lawyerName}</p>
                  <span className={`text-sm font-bold ${
                    burnout.risk === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Puntuación: {burnout.score}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {burnout.criticalCases} casos críticos detectados
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Capacity Forecast */}
      <SectionCard title="Forecast de Capacidad (30 días)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">Tendencia</p>
            <p className="text-2xl font-bold text-blue-900">
              {ai.forecast.trend === 'increasing' ? '↗' : ai.forecast.trend === 'decreasing' ? '↘' : '→'}
            </p>
            <p className="text-xs text-blue-600 mt-2">{ai.forecast.trend}</p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-2">Pico Proyectado</p>
            <p className="text-2xl font-bold text-red-900">{ai.forecast.peak}%</p>
            <p className="text-xs text-red-600 mt-2">Ocupación máxima en los próximos 30 días</p>
          </div>
        </div>
      </SectionCard>

      {/* Insights */}
      {ai.insights.length > 0 && (
        <SectionCard title={`Insights Generados (${ai.insights.length})`}>
          <div className="space-y-3">
            {ai.insights.slice(0, 5).map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Health Status */}
      <SectionCard title="Salud de Departamentos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ai.health.departments.slice(0, 6).map((dept, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                dept.health === 'excellent'
                  ? 'bg-green-50 border-green-200'
                  : dept.health === 'good'
                  ? 'bg-blue-50 border-blue-200'
                  : dept.health === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">{dept.departmentName}</p>
              <p className="text-xs text-gray-600 mt-1">
                {dept.occupancyRate}% ocupación • {dept.teamSize} abogados
              </p>
              <span className="text-xs font-bold text-gray-900 mt-2 block">
                {dept.health === 'excellent'
                  ? '✓ Excelente'
                  : dept.health === 'good'
                  ? '○ Bueno'
                  : dept.health === 'warning'
                  ? '⚠ Advertencia'
                  : '✗ Crítico'}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default IntelligenceCenterPage;
