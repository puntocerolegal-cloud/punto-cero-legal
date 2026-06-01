import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerificacionPendiente from './pages/VerificacionPendiente';
import CheckoutPage from './pages/CheckoutPage';
import DashboardHome from './pages/DashboardHome';
import CRMPage from './pages/dashboard/CRMPage';
import CasesPage from './pages/dashboard/CasesPage';
import ClientsPage from './pages/dashboard/ClientsPage';
import AgendaPage from './pages/dashboard/AgendaPage';
import AIPage from './pages/dashboard/AIPage';
import MeetingsPage from './pages/dashboard/MeetingsPage';
import InvoicesPage from './pages/dashboard/InvoicesPage';
import DocumentsPage from './pages/dashboard/DocumentsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AdminPanel from './pages/AdminPanel';

// Roles
const LAWYER_ROLES = ['lawyer', 'client'];
const ADMIN_ROLES = ['admin', 'admin_general', 'socio_comercial'];

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* === RUTAS PÚBLICAS === */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* === RUTA DE VERIFICACIÓN PENDIENTE (allowUnverified) === */}
            <Route
              path="/verificacion-pendiente"
              element={<ProtectedRoute allowUnverified={true}><VerificacionPendiente /></ProtectedRoute>}
            />

            {/* === CHECKOUT (todos los autenticados pueden pagar, incluso PENDING) === */}
            <Route
              path="/checkout"
              element={<ProtectedRoute allowUnverified={true}><CheckoutPage /></ProtectedRoute>}
            />

            {/* === MI OFICINA JURÍDICA (Solo lawyers verificados) === */}
            <Route path="/dashboard" element={<ProtectedRoute require={LAWYER_ROLES}><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/crm" element={<ProtectedRoute require={LAWYER_ROLES}><CRMPage /></ProtectedRoute>} />
            <Route path="/dashboard/cases" element={<ProtectedRoute require={LAWYER_ROLES}><CasesPage /></ProtectedRoute>} />
            <Route path="/dashboard/clients" element={<ProtectedRoute require={LAWYER_ROLES}><ClientsPage /></ProtectedRoute>} />
            <Route path="/dashboard/agenda" element={<ProtectedRoute require={LAWYER_ROLES}><AgendaPage /></ProtectedRoute>} />
            <Route path="/dashboard/ai" element={<ProtectedRoute require={LAWYER_ROLES}><AIPage /></ProtectedRoute>} />
            <Route path="/dashboard/meetings" element={<ProtectedRoute require={LAWYER_ROLES}><MeetingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/invoices" element={<ProtectedRoute require={LAWYER_ROLES}><InvoicesPage /></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute require={LAWYER_ROLES}><DocumentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute require={LAWYER_ROLES}><SettingsPage /></ProtectedRoute>} />

            {/* === CENTRO DE GESTIÓN (Solo admin/socio_comercial) === */}
            <Route path="/admin" element={<ProtectedRoute require={ADMIN_ROLES}><AdminPanel /></ProtectedRoute>} />

            {/* === FALLBACK === */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
