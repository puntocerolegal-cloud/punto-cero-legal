import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FeatureGate } from '@/components/commerce/FeatureGate';
import { lawyerRegistry } from './lawyerRegistry';

const LAWYER_ROLES = ['lawyer', 'client'];

function LawyerShellRoutes() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="" element={<ProtectedRoute require={LAWYER_ROLES}><DashboardLayout><lawyerRegistry.home /></DashboardLayout></ProtectedRoute>} />
      <Route path="crm" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="crm"><DashboardLayout><lawyerRegistry.crm /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="cases" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="cases"><DashboardLayout><lawyerRegistry.cases /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="clients" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="crm"><DashboardLayout><lawyerRegistry.clients /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="agenda" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="agenda"><DashboardLayout><lawyerRegistry.calendar /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="ai" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="ai"><DashboardLayout><lawyerRegistry.ai /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="meetings" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="video"><DashboardLayout><lawyerRegistry.meetings /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="invoices" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="billing"><DashboardLayout><lawyerRegistry.invoices /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="documents" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="documents"><DashboardLayout><lawyerRegistry.documents /></DashboardLayout></FeatureGate></ProtectedRoute>} />
      <Route path="settings" element={<ProtectedRoute require={LAWYER_ROLES}><DashboardLayout><lawyerRegistry.settings /></DashboardLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={location.pathname.startsWith('/dashboard') ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
}

export function LawyerShell() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Cargando...</div>}>
      <LawyerShellRoutes />
    </Suspense>
  );
}

export default LawyerShell;
