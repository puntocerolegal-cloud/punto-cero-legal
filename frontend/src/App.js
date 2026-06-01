import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />
            <Route path="/dashboard/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
            <Route path="/dashboard/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
            <Route path="/dashboard/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/dashboard/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
            <Route path="/dashboard/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
            <Route path="/dashboard/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/dashboard/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
