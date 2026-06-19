import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentProvider';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { CaseContextProvider } from './contexts/CaseContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UpgradeModal } from './components/commerce/UpgradeModal';
import { FeatureGate } from './components/commerce/FeatureGate';

// Compatibilidad: las rutas antiguas /admin/os/* ahora viven en /admin/*.
// Redirige preservando el subpath para no romper enlaces ni marcadores previos.
function LegacyOsRedirect() {
  const loc = useLocation();
  const target = loc.pathname.replace(/^\/admin\/os/, '/admin') + loc.search;
  return <Navigate to={target} replace />;
}

// Páginas base
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificacionPendiente from './pages/VerificacionPendiente';
import CheckoutPage from './pages/CheckoutPage';
import DashboardHome from './pages/DashboardHome';
import PortalPage from './pages/PortalPage';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import TermsConditions from './pages/legal/TermsConditions';
import SubscriptionAgreement from './pages/legal/SubscriptionAgreement';
import AdminPanel from './pages/AdminPanel';
import AdminModule from './modules/admin/AdminModule';

// Páginas del Dashboard
import CRMPage from './pages/dashboard/CRMPage';
import CasesPage from './pages/dashboard/CasesPage';
import ClientsPage from './pages/dashboard/ClientsPage';
import AgendaPage from './pages/dashboard/AgendaPage';
import AIPage from './pages/dashboard/AIPage';
import MeetingsPage from './pages/dashboard/MeetingsPage';
import InvoicesPage from './pages/dashboard/InvoicesPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import SettingsPage from './pages/dashboard/SettingsPage';

// Partners y Analytics NO se importan aquí: son módulos nativos de Punto Cero
// System OS y viven exclusivamente bajo /admin/* (ver modules/admin/AdminModule.jsx).

// Roles
const LAWYER_ROLES = ['lawyer', 'client'];
const ADMIN_ROLES = ['admin', 'admin_general', 'socio_comercial'];

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ContentProvider>
        <AuthProvider>
          <SubscriptionProvider>
          <CaseContextProvider>
          {/* Modal de Bloqueo Comercial global (controlado por la IA Comercial) */}
          <UpgradeModal />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/verificacion-pendiente" element={<ProtectedRoute allowUnverified={true}><VerificacionPendiente /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute allowUnverified={true}><CheckoutPage /></ProtectedRoute>} />

            {/* Rutas del Dashboard — cada página se auto-envuelve en DashboardLayout
                (se eliminó el wrapper externo que causaba doble layout). Cada feature
                consulta el Motor de Planes vía FeatureGate. */}
            <Route path="/dashboard" element={<ProtectedRoute require={LAWYER_ROLES}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/crm" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="crm"><CRMPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/cases" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="cases"><CasesPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/clients" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="crm"><ClientsPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/agenda" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="agenda"><AgendaPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/ai" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="ai"><AIPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/meetings" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="video"><MeetingsPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/invoices" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="billing"><InvoicesPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute require={LAWYER_ROLES}><FeatureGate feature="documents"><DocumentsPage /></FeatureGate></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute require={LAWYER_ROLES}><SettingsPage /></ProtectedRoute>} />

            {/* Páginas legales institucionales (públicas) */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/subscription-agreement" element={<SubscriptionAgreement />} />

            <Route path="/portal" element={<PortalPage />} />
            <Route path="/portal/:code" element={<PortalPage />} />
            {/* Centro de Control unificado — AdminModule es el panel principal de /admin */}
            <Route path="/admin/legacy" element={<ProtectedRoute require={ADMIN_ROLES}><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/os/*" element={<LegacyOsRedirect />} />
            <Route path="/admin/*" element={<ProtectedRoute require={ADMIN_ROLES}><AdminModule /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </CaseContextProvider>
          </SubscriptionProvider>
        </AuthProvider>
        </ContentProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;