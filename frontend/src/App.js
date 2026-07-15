import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ContentProvider } from './contexts/ContentProvider';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { CaseContextProvider } from './contexts/CaseContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UpgradeModal } from './components/commerce/UpgradeModal';
import { LawyerShell } from './shells/lawyer/LawyerShell';
import { FirmShell } from './shells/firm/FirmShell';
import { AdminShell } from './shells/admin/AdminShell';
import { useGoogleAdsTracking } from './hooks/useGoogleAdsTracking';

// Compatibilidad: las rutas antiguas /admin/os/* ahora viven en /admin/*.
// Redirige preservando el subpath para no romper enlaces ni marcadores previos.
function LegacyOsRedirect() {
  const loc = useLocation();
  const target = loc.pathname.replace(/^\/admin\/os/, '/admin') + loc.search;
  return <Navigate to={target} replace />;
}

// Páginas base
import { LandingPage } from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChangePasswordRequired from './pages/ChangePasswordRequired';
import ActivateFirmPage from './pages/ActivateFirmPage';
import ActivateLawyerPage from './pages/ActivateLawyerPage';
import VerificacionPendiente from './pages/VerificacionPendiente';
import CheckoutPage from './pages/CheckoutPage';
import DashboardHome from './pages/DashboardHome';
import PortalPage from './pages/PortalPage';
import FirmsDirectory from './pages/FirmsDirectory';
import PublicFirmProfile from './pages/PublicFirmProfile';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import CookiePolicy from './pages/legal/CookiePolicy';
import TermsConditions from './pages/legal/TermsConditions';
import SubscriptionAgreement from './pages/legal/SubscriptionAgreement';
import AdminPanel from './pages/AdminPanel';

// Partners y Analytics NO se importan aquí: son módulos nativos de Punto Cero
// System OS y viven exclusivamente bajo /admin/* (ver modules/admin/AdminModule.jsx).

// Roles
const LAWYER_ROLES = ['lawyer', 'client'];
const ADMIN_ROLES = ['admin', 'admin_general', 'socio_comercial'];

function RouteTracker() {
  useGoogleAdsTracking();
  return null;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <RouteTracker />
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
            <Route path="/change-password-required" element={<ChangePasswordRequired />} />
            <Route path="/activate-firm" element={<ActivateFirmPage />} />
            <Route path="/activate-lawyer" element={<ActivateLawyerPage />} />

            {/* Directorio de Firmas — Público */}
            <Route path="/firms" element={<FirmsDirectory />} />
            <Route path="/firms/:slug" element={<PublicFirmProfile />} />

            <Route path="/verificacion-pendiente" element={<ProtectedRoute allowUnverified={true}><VerificacionPendiente /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute allowUnverified={true}><CheckoutPage /></ProtectedRoute>} />

            <Route path="/dashboard/*" element={<LawyerShell />} />

            {/* Páginas legales institucionales (públicas) */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/subscription-agreement" element={<SubscriptionAgreement />} />

            <Route path="/portal" element={<PortalPage />} />
            <Route path="/portal/:code" element={<PortalPage />} />
            {/* Centro de Control unificado — AdminModule (Punto Cero System OS) es el
                ÚNICO panel principal de /admin. El AdminPanel heredado NO se elimina:
                queda aislado como herramienta interna del Administrador Maestro en
                /admin/master/legacy (nunca se muestra automáticamente tras el login). */}
            <Route path="/admin/master/legacy" element={<ProtectedRoute require={ADMIN_ROLES}><AdminPanel /></ProtectedRoute>} />
            {/* Compatibilidad histórica: el antiguo /admin/legacy redirige al acceso Maestro. */}
            <Route path="/admin/legacy" element={<Navigate to="/admin/master/legacy" replace />} />
            <Route path="/admin/os/*" element={<LegacyOsRedirect />} />
            <Route path="/admin/*" element={<AdminShell />} />

            {/* Firm OS — Nueva capa para firmas en crecimiento y consolidación empresarial */}
            <Route path="/firm-os/*" element={<FirmShell />} />

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
