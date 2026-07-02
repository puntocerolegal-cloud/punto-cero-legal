import { useState, useCallback, useMemo, useEffect } from 'react';
import { useOrchestration } from './useOrchestration';
import { useAutonomousEngine } from './useAutonomousEngine';
import {
  deserializeGovernanceState,
  serializeGovernanceState,
  buildAuditEvent,
  buildAuditTrail,
  buildPolicy,
  AUDIT_EVENT_TYPE,
} from '../domain/governanceDomain';
import {
  buildGovernanceDashboard,
  buildAuditPanel,
  buildExplanationCenter,
  buildPolicyPanel,
  buildCompliancePanel,
  buildSimulationPanel,
  buildMetricsPanel,
  buildExecutiveSummary,
} from '../application/governanceApplication';

const STORAGE_KEY = 'firm-os/governance';

export function useGovernance() {
  const orchestration = useOrchestration();
  const autonomous = useAutonomousEngine();

  const [auditEvents, setAuditEvents] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = deserializeGovernanceState(stored);
          return state.auditEvents || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load governance audit:', error);
    }
    return [];
  });

  const [policies, setPolicies] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = deserializeGovernanceState(stored);
          return state.policies || getDefaultPolicies();
        }
      }
    } catch (error) {
      console.warn('Failed to load policies:', error);
    }
    return getDefaultPolicies();
  });

  const [explanations, setExplanations] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const state = deserializeGovernanceState(stored);
          return state.explanations || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load explanations:', error);
    }
    return [];
  });

  const persistState = useCallback(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const state = {
          auditEvents,
          policies,
          explanations,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, serializeGovernanceState(state));
      }
    } catch (error) {
      console.warn('Failed to persist governance state:', error);
    }
  }, [auditEvents, policies, explanations]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const recordEvent = useCallback((event) => {
    const auditEvent = buildAuditEvent(
      event.type || AUDIT_EVENT_TYPE.DECISION_MADE,
      event.actor || 'system',
      event.resource || {},
      event.decision || {},
      event.impact || {}
    );
    setAuditEvents(prev => [auditEvent, ...prev].slice(0, 1000));
  }, []);

  const addPolicy = useCallback((scope, type, description, rules) => {
    const policy = buildPolicy(scope, type, description, rules);
    setPolicies(prev => [...prev, policy]);
  }, []);

  const togglePolicy = useCallback((policyId) => {
    setPolicies(prev =>
      prev.map(p => p.id === policyId ? { ...p, active: !p.active } : p)
    );
  }, []);

  const addExplanation = useCallback((explanation) => {
    setExplanations(prev => [explanation, ...prev].slice(0, 500));
  }, []);

  // Build dashboards
  const governanceDashboard = useMemo(() => {
    return buildGovernanceDashboard(
      { events: auditEvents },
      policies,
      orchestration?.orchestrationVM || {},
      autonomous?.autonomousVM || {}
    );
  }, [auditEvents, policies, orchestration, autonomous]);

  const auditPanel = useMemo(() => {
    return buildAuditPanel({ events: auditEvents });
  }, [auditEvents]);

  const policyPanel = useMemo(() => {
    return buildPolicyPanel(policies);
  }, [policies]);

  const compliancePanel = useMemo(() => {
    const trail = buildAuditTrail(auditEvents);
    return buildCompliancePanel({
      overallCompliance: 95,
      successfulEvents: trail.events.filter(e => e.decision?.confidence >= 70).length,
      suspiciousEvents: trail.events.filter(e => e.decision?.confidence < 50).length,
      totalEvents: trail.count,
      policyCompliance: policies.map(p => ({
        policyId: p.id,
        scope: p.scope,
        violations: 0,
        totalEvents: trail.count,
        complianceRate: 100,
      })),
    });
  }, [auditEvents, policies]);

  const metricsPanel = useMemo(() => {
    return buildMetricsPanel(governanceDashboard.metrics);
  }, [governanceDashboard]);

  const executiveSummary = useMemo(() => {
    return buildExecutiveSummary(governanceDashboard);
  }, [governanceDashboard]);

  return {
    // State
    auditEvents,
    policies,
    explanations,
    recordEvent,
    addPolicy,
    togglePolicy,
    addExplanation,

    // Dashboard
    governanceDashboard,
    auditPanel,
    policyPanel,
    compliancePanel,
    metricsPanel,
    executiveSummary,

    // References
    orchestration,
    autonomous,

    // Shortcuts
    metrics: governanceDashboard.metrics,
    compliance: governanceDashboard.compliance,
    systemHealth: governanceDashboard.summary?.systemHealth,
    timestamp: governanceDashboard.timestamp,
  };
}

function getDefaultPolicies() {
  return [
    buildPolicy(
      'automation',
      'rule',
      'Require approval for high-impact automation',
      [
        {
          name: 'Impact Threshold',
          reason: 'Action affects multiple cases',
          conditions: [
            { field: 'impact.affected', operator: 'greaterThan', value: 5 },
          ],
          severity: 'high',
        },
      ]
    ),
    buildPolicy(
      'workflow',
      'rule',
      'Enforce workflow completion',
      [
        {
          name: 'Workflow Validation',
          reason: 'Workflow must have valid nodes',
          conditions: [],
          severity: 'medium',
        },
      ]
    ),
    buildPolicy(
      'assignment',
      'threshold',
      'Prevent lawyer overload',
      [
        {
          name: 'Case Load',
          reason: 'Lawyer capacity exceeded',
          conditions: [
            { field: 'capacity', operator: 'greaterThan', value: 0.9 },
          ],
          severity: 'high',
        },
      ]
    ),
  ];
}
