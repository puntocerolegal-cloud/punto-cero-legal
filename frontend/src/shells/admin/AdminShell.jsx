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
      <Route path="" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="PUNTO CERO SYSTEM OS">{adminRegistry.home()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="financial-os" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Financial OS">{adminRegistry.financialOs()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="ai-copilot" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="AI Legal Autopilot">{adminRegistry.aiCopilot()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="autonomous-control" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Autonomous & Global Legal OS">{adminRegistry.autonomousControl()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="legal-os" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Legal Operating System">{adminRegistry.legalOs()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="firms" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Directorio de Firmas">{adminRegistry.firms()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="firm-dashboard" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Dashboard de Firma">{adminRegistry.firmDashboard()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="sales-command-center" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Sales Command Center">{adminRegistry.salesCommandCenter()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="ai-command-center" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Copiloto IA">{adminRegistry.aiCommandCenter()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="sales-room" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Directorio de Abogados">{adminRegistry.salesRoom()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="cases-portal" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Portal de Casos">{adminRegistry.casesPortal()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="master" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Control Maestro">{adminRegistry.master()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="countries" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Segmentación por Países">{adminRegistry.countries()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="organizations" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Organizaciones">{adminRegistry.organizations()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="users" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Usuarios">{adminRegistry.users()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="roles" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Roles">{adminRegistry.roles()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="permissions" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Permisos">{adminRegistry.permissions()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="verticals" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Motor Multivertical">{adminRegistry.verticals()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="partners" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Red de Agentes">{adminRegistry.partners()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="implementations" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Implementaciones">{adminRegistry.implementations()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="subscriptions" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Suscripciones y Facturación">{adminRegistry.subscriptions()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="plans" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Motor de Planes">{adminRegistry.plans()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="subscription-center" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Centro de Suscripciones">{adminRegistry.subscriptionCenter()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="billing" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Facturación y Contabilidad">{adminRegistry.billing()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="referrals" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Referidos">{adminRegistry.referrals()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="notifications" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Notificaciones">{adminRegistry.notifications()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="commercial-ai" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="IA Comercial">{adminRegistry.commercialAi()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="analytics" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Analytics Center">{adminRegistry.analytics()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="inventory" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Inventario Inteligente">{adminRegistry.inventory()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="security" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Seguridad">{adminRegistry.security()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="support-access" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Accesos de Soporte">{adminRegistry.supportAccess()}</AdminOSLayout></ProtectedRoute>} />
      <Route path="observability" element={<ProtectedRoute require={ADMIN_ROLES}><AdminOSLayout title="Observability Dashboard">{adminRegistry.observability()}</AdminOSLayout></ProtectedRoute>} />
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
