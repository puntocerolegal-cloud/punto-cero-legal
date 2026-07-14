import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FirmOSLayout } from '@/modules/firm-os/FirmOSLayout';
import { FirmOnboarding } from '@/modules/firm-os/pages/FirmOnboarding';
import { AlertsCenter } from '@/modules/firm-os/pages/AlertsCenter';
import { FirmTeam } from '@/modules/firm-os/pages/FirmTeam';
import { FirmLawyers } from '@/modules/firm-os/pages/FirmLawyers';
import { FirmAnalytics } from '@/modules/firm-os/pages/FirmAnalytics';
import { firmRegistry } from './firmRegistry';

const FIRM_ROLES = ['firm_owner', 'firm_admin', 'firm_lawyer'];

function FirmShellRoutes() {
  const location = useLocation();

  return (
    <Routes>
      <Route index element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.home /></FirmOSLayout></ProtectedRoute>} />
      <Route path="crm" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.crm /></FirmOSLayout></ProtectedRoute>} />
      <Route path="cases" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.cases /></FirmOSLayout></ProtectedRoute>} />
      <Route path="clients" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.clients /></FirmOSLayout></ProtectedRoute>} />
      <Route path="agenda" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.calendar /></FirmOSLayout></ProtectedRoute>} />
      <Route path="ai" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.ai /></FirmOSLayout></ProtectedRoute>} />
      <Route path="meetings" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.meetings /></FirmOSLayout></ProtectedRoute>} />
      <Route path="invoices" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.invoices /></FirmOSLayout></ProtectedRoute>} />
      <Route path="documents" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.documents /></FirmOSLayout></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.settings /></FirmOSLayout></ProtectedRoute>} />
      <Route path="automation" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.automation /></FirmOSLayout></ProtectedRoute>} />
      <Route path="workflow-builder" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.workflowBuilder /></FirmOSLayout></ProtectedRoute>} />
      <Route path="scheduler" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.scheduler /></FirmOSLayout></ProtectedRoute>} />
      <Route path="intelligence" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.intelligence /></FirmOSLayout></ProtectedRoute>} />
      <Route path="mission-control" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.missionControl /></FirmOSLayout></ProtectedRoute>} />
      <Route path="autonomous-operations" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.autonomousOperations /></FirmOSLayout></ProtectedRoute>} />
      <Route path="governance" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><firmRegistry.governance /></FirmOSLayout></ProtectedRoute>} />
      <Route path="onboarding" element={<ProtectedRoute require={FIRM_ROLES}><FirmOnboarding /></ProtectedRoute>} />
      <Route path="alerts" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><AlertsCenter /></FirmOSLayout></ProtectedRoute>} />
      <Route path="team" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><FirmTeam /></FirmOSLayout></ProtectedRoute>} />
      <Route path="lawyers" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><FirmLawyers /></FirmOSLayout></ProtectedRoute>} />
      <Route path="analytics" element={<ProtectedRoute require={FIRM_ROLES}><FirmOSLayout><FirmAnalytics /></FirmOSLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={location.pathname.startsWith('/firm-os') ? '/firm-os' : '/'} replace />} />
    </Routes>
  );
}

export function FirmShell() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Cargando...</div>}>
      <FirmShellRoutes />
    </Suspense>
  );
}

export default FirmShell;
