import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { FirmOSLayout } from "./FirmOSLayout";
import { FirmDashboard } from "./pages/FirmDashboard";
import { FirmLawyers } from "./pages/FirmLawyers";
import { FirmCases } from "./pages/FirmCases";
import { FirmFinance } from "./pages/FirmFinance";
import { FirmAnalytics } from "./pages/FirmAnalytics";
import { FirmSettings } from "./pages/FirmSettings";
import { FirmOnboarding } from "./pages/FirmOnboarding";
import { FirmTeam } from "./pages/FirmTeam";
import OnboardingWizardFirm from "./pages/OnboardingWizardFirm";
import FirmDirectorySettings from "./pages/FirmDirectorySettings";
import CRMEnterprise from "./pages/CRMEnterprise";
import BillingEnterprise from "./pages/BillingEnterprise";
import AICorporate from "./pages/AICorporate";

export function FirmOSModule() {
  return (
    <Routes>
      {/* Onboarding - Sin layout envolvente */}
      <Route path="onboarding" element={<FirmOnboarding />} />
      <Route path="wizard" element={<OnboardingWizardFirm />} />

      {/* Dashboard y rutas principales */}
      <Route index element={<FirmOSLayout title="Dashboard"><FirmDashboard /></FirmOSLayout>} />
      <Route path="lawyers" element={<FirmOSLayout title="Abogados"><FirmLawyers /></FirmOSLayout>} />
      <Route path="team" element={<FirmOSLayout title="Equipo"><FirmTeam /></FirmOSLayout>} />
      <Route path="cases" element={<FirmOSLayout title="Casos"><FirmCases /></FirmOSLayout>} />
      <Route path="finance" element={<FirmOSLayout title="Finanzas"><FirmFinance /></FirmOSLayout>} />
      <Route path="billing" element={<FirmOSLayout title="Facturación"><BillingEnterprise /></FirmOSLayout>} />
      <Route path="analytics" element={<FirmOSLayout title="Analytics"><FirmAnalytics /></FirmOSLayout>} />
      <Route path="crm" element={<FirmOSLayout title="CRM Empresarial"><CRMEnterprise /></FirmOSLayout>} />
      <Route path="ia" element={<FirmOSLayout title="IA Corporativa"><AICorporate /></FirmOSLayout>} />
      <Route path="directory" element={<FirmOSLayout title="Perfil Público"><FirmDirectorySettings /></FirmOSLayout>} />
      <Route path="settings" element={<FirmOSLayout title="Configuración"><FirmSettings /></FirmOSLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

export default FirmOSModule;
