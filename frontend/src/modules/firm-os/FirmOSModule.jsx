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

export function FirmOSModule() {
  return (
    <Routes>
      <Route path="onboarding" element={<FirmOnboarding />} />
      <Route index element={<FirmOSLayout title="Dashboard"><FirmDashboard /></FirmOSLayout>} />
      <Route path="lawyers" element={<FirmOSLayout title="Abogados"><FirmLawyers /></FirmOSLayout>} />
      <Route path="team" element={<FirmOSLayout title="Equipo"><FirmTeam /></FirmOSLayout>} />
      <Route path="cases" element={<FirmOSLayout title="Casos"><FirmCases /></FirmOSLayout>} />
      <Route path="finance" element={<FirmOSLayout title="Finanzas"><FirmFinance /></FirmOSLayout>} />
      <Route path="analytics" element={<FirmOSLayout title="Analytics"><FirmAnalytics /></FirmOSLayout>} />
      <Route path="settings" element={<FirmOSLayout title="Configuración"><FirmSettings /></FirmOSLayout>} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

export default FirmOSModule;
