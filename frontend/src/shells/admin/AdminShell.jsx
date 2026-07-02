import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminOSLayout } from '@/modules/admin/AdminOSLayout';
import { adminRegistry } from './adminRegistry';

const ADMIN_ROLES = ['admin', 'admin_general', 'socio_comercial'];

function AdminShellRoutes() {
  const location = useLocation();

  return (
    <Routes>
      <Route path="/admin" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="PUNTO CERO SYSTEM OS">{adminRegistry.home()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/financial-os" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Financial OS">{adminRegistry.financialOs()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/ai-copilot" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="AI Legal Autopilot">{adminRegistry.aiCopilot()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/autonomous-control" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Autonomous & Global Legal OS">{adminRegistry.autonomousControl()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/legal-os" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Legal Operating System">{adminRegistry.legalOs()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/firms" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Directorio de Firmas">{adminRegistry.firms()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/firm-dashboard" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Dashboard de Firma">{adminRegistry.firmDashboard()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/sales-command-center" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Sales Command Center">{adminRegistry.salesCommandCenter()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/ai-command-center" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Copiloto IA">{adminRegistry.aiCommandCenter()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/sales-room" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Directorio de Abogados">{adminRegistry.salesRoom()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/cases-portal" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Portal de Casos">{adminRegistry.casesPortal()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/master" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Control Maestro">{adminRegistry.master()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/countries" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Segmentación por Países">{adminRegistry.countries()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/organizations" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Organizaciones">{adminRegistry.organizations()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Usuarios">{adminRegistry.users()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Roles">{adminRegistry.roles()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/permissions" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Permisos">{adminRegistry.permissions()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/verticals" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Motor Multivertical">{adminRegistry.verticals()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/partners" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Red de Agentes">{adminRegistry.partners()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/implementations" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Implementaciones">{adminRegistry.implementations()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/subscriptions" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Suscripciones y Facturación">{adminRegistry.subscriptions()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/plans" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Motor de Planes">{adminRegistry.plans()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/subscription-center" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Centro de Suscripciones">{adminRegistry.subscriptionCenter()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Facturación y Contabilidad">{adminRegistry.billing()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/referrals" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Referidos">{adminRegistry.referrals()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Notificaciones">{adminRegistry.notifications()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/commercial-ai" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="IA Comercial">{adminRegistry.commercialAi()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Analytics Center">{adminRegistry.analytics()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/inventory" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Inventario Inteligente">{adminRegistry.inventory()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/security" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Seguridad">{adminRegistry.security()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/support-access" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Accesos de Soporte">{adminRegistry.supportAccess()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="/admin/observability" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Observability Dashboard">{adminRegistry.observability()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={location.pathname.startsWith('/admin') ? '/admin' : '/'} replace />} />
    </Routes>
  );
}

export function AdminShell() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Cargando...</div>}>
      <AdminShellRoutes />
    </Suspense>
  );
}

export default AdminShell;
