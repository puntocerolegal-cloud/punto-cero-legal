import { useMemo } from 'react';
import {
  buildDecisionCenter,
  buildRecommendationsView,
  buildPredictionDashboard,
  buildHealthDashboard,
  buildExecutiveInsights,
  buildRiskAnalysis,
  buildForecastDashboard,
  buildCapacityDashboard,
} from '../application/aiDecisionApplication';

export function useAIDecision(lawyers = [], cases = [], clients = [], departments = []) {
  // Main decision center
  const decisionCenter = useMemo(() => {
    return buildDecisionCenter(lawyers, cases, clients, departments);
  }, [lawyers, cases, clients, departments]);

  // Recommendations
  const recommendations = useMemo(() => {
    return buildRecommendationsView(lawyers, cases, clients, departments);
  }, [lawyers, cases, clients, departments]);

  // Predictions
  const predictions = useMemo(() => {
    return buildPredictionDashboard(lawyers, cases, clients);
  }, [lawyers, cases, clients]);

  // Health dashboard
  const health = useMemo(() => {
    return buildHealthDashboard(lawyers, cases, departments);
  }, [lawyers, cases, departments]);

  // Executive insights
  const executiveInsights = useMemo(() => {
    return buildExecutiveInsights(lawyers, cases, clients);
  }, [lawyers, cases, clients]);

  // Risk analysis
  const riskAnalysis = useMemo(() => {
    return buildRiskAnalysis(lawyers, cases);
  }, [lawyers, cases]);

  // Forecast
  const forecast = useMemo(() => {
    return buildForecastDashboard(lawyers, cases);
  }, [lawyers, cases]);

  // Capacity
  const capacity = useMemo(() => {
    return buildCapacityDashboard(lawyers, cases, departments);
  }, [lawyers, cases, departments]);

  return {
    // Core data
    decisionCenter,
    recommendations,
    predictions,
    health,
    executiveInsights,
    riskAnalysis,
    forecast,
    capacity,

    // Shortcuts
    insights: decisionCenter.insights,
    summary: decisionCenter.summary,
    timestamp: decisionCenter.timestamp,
  };
}
