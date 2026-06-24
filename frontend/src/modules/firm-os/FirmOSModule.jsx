import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { FirmOSLayout } from "./FirmOSLayout";
import { FirmDashboard } from "./pages/FirmDashboard";
import { FirmLawyers } from "./pages/FirmLawyers";
import { FirmCases } from "./pages/FirmCases";
import { FirmSettings } from "./pages/FirmSettings";

export function FirmOSModule() {
  return (
    <Routes>
      <Route index element={<FirmOSLayout title="Dashboard"><FirmDashboard /></FirmOSLayout>} />
      <Route path="lawyers" element={<FirmOSLayout title="Abogados"><FirmLawyers /></FirmOSLayout>} />
      <Route path="cases" element={<FirmOSLayout title="Casos"><FirmCases /></FirmOSLayout>} />
      <Route path="settings" element={<FirmOSLayout title="Configuración"><FirmSettings /></FirmOSLayout>} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

export default FirmOSModule;
