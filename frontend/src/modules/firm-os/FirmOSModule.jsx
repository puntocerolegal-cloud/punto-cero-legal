import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./styles/animations.css";
import { FirmOSLayout } from "./FirmOSLayout";

// Páginas específicas de Firma (no existen en Lawyer OS)
import { FirmDashboard } from "./pages/FirmDashboard";
import { FirmLawyers } from "./pages/FirmLawyers";
import { FirmTeam } from "./pages/FirmTeam";
import { FirmOnboarding } from "./pages/FirmOnboarding";
import OnboardingWizardFirm from "./pages/OnboardingWizardFirm";
import { FirmAnalytics } from "./pages/FirmAnalytics";
import { FirmFinance } from "./pages/FirmFinance";
import BillingEnterprise from "./pages/BillingEnterprise";
import FirmDirectorySettings from "./pages/FirmDirectorySettings";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { CommunicationPage } from "./pages/CommunicationPage";
import { OfficesPage } from "./pages/OfficesPage";
import { AlertsCenter } from "./pages/AlertsCenter";
import { OrganizationalStructure } from "./pages/OrganizationalStructure";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import ExpedientesPage from "./pages/ExpedientesPage";
import { AutomationCenterPage } from "./pages/AutomationCenterPage";
import { WorkflowCenterPage } from "./pages/WorkflowCenterPage";
import { WorkflowBuilderPage } from "./pages/WorkflowBuilderPage";
import { SchedulerPage } from "./pages/SchedulerPage";
import { IntelligenceCenterPage } from "./pages/IntelligenceCenterPage";
import EnterpriseMissionControl from "./pages/EnterpriseMissionControl";
import AutonomousOperationsPage from "./pages/AutonomousOperationsPage";
import EnterpriseGovernancePage from "./pages/EnterpriseGovernancePage";

// REUTILIZACIÓN: Componentes directamente de Lawyer OS (sin duplicación)
import { DashboardHome } from "@/pages/DashboardHome";
import CRMPage from "@/pages/dashboard/CRMPage";
import CasesPage from "@/pages/dashboard/CasesPage";
import ClientsPage from "@/pages/dashboard/ClientsPage";
import AgendaPage from "@/pages/dashboard/AgendaPage";
import AIPage from "@/pages/dashboard/AIPage";
import MeetingsPage from "@/pages/dashboard/MeetingsPage";
import InvoicesPage from "@/pages/dashboard/InvoicesPage";
import DocumentsPage from "@/pages/dashboard/DocumentsPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";

/**
 * Firm OS Module — Consolidado con Reutilización Completa
 *
 * Arquitectura:
 * ✓ Dashboard de firma (específico a Firm OS)
 * ✓ Operaciones Jurídicas: 100% reutilizadas de Lawyer OS
 * ✓ Gestión Empresarial: 100% específico a Firm OS
 *
 * NO hay duplicación de componentes.
 * NO hay stubs ni placeholders.
 * Firm OS hereda toda la experiencia del Lawyer OS.
 */
export function FirmOSModule() {
  return (
    <Routes>
      {/* Onboarding */}
      <Route path="onboarding" element={<FirmOnboarding />} />
      <Route path="wizard" element={<OnboardingWizardFirm />} />

      {/* ═══════════════════════════════════════════════════════════════
          OPERACIONES JURÍDICAS — 100% Reutilizadas de Lawyer OS
          ═══════════════════════════════════════════════════════════════ */}

      {/* Dashboard de Firma (específico, pero con layout de Lawyer) */}
      <Route index element={<FirmOSLayout><FirmDashboard /></FirmOSLayout>} />

      {/* CRM Jurídico — importado directamente de Lawyer OS */}
      <Route path="crm" element={<FirmOSLayout><CRMPage /></FirmOSLayout>} />

      {/* Portal de Casos — importado directamente de Lawyer OS */}
      <Route path="cases" element={<FirmOSLayout><CasesPage /></FirmOSLayout>} />

      {/* Directorio de Clientes — importado directamente de Lawyer OS */}
      <Route path="clients" element={<FirmOSLayout><ClientsPage /></FirmOSLayout>} />

      {/* Agenda Inteligente — importado directamente de Lawyer OS */}
      <Route path="agenda" element={<FirmOSLayout><AgendaPage /></FirmOSLayout>} />

      {/* IA Jurídica — importado directamente de Lawyer OS */}
      <Route path="ai" element={<FirmOSLayout><AIPage /></FirmOSLayout>} />

      {/* Sala de Conferencias — importado directamente de Lawyer OS */}
      <Route path="meetings" element={<FirmOSLayout><MeetingsPage /></FirmOSLayout>} />

      {/* Facturación — importado directamente de Lawyer OS */}
      <Route path="invoices" element={<FirmOSLayout><InvoicesPage /></FirmOSLayout>} />

      {/* Documentos — importado directamente de Lawyer OS */}
      <Route path="documents" element={<FirmOSLayout><DocumentsPage /></FirmOSLayout>} />

      {/* Configuración — importado directamente de Lawyer OS */}
      <Route path="settings" element={<FirmOSLayout><SettingsPage /></FirmOSLayout>} />

      {/* ═══════════════════════════════════════════════════════════════
          GESTIÓN EMPRESARIAL — 100% Específico de Firm OS
          ═══════════════════════════════════════════════════════════════ */}

      {/* Centro de Alertas */}
      <Route path="alerts" element={<FirmOSLayout><AlertsCenter /></FirmOSLayout>} />

      {/* Centro de Automatización */}
      <Route path="automation" element={<FirmOSLayout><AutomationCenterPage /></FirmOSLayout>} />

      {/* Centro de Workflow */}
      <Route path="workflows" element={<FirmOSLayout><WorkflowCenterPage /></FirmOSLayout>} />

      {/* Workflow Builder */}
      <Route path="workflow-builder" element={<FirmOSLayout><WorkflowBuilderPage /></FirmOSLayout>} />

      {/* Scheduler */}
      <Route path="scheduler" element={<FirmOSLayout><SchedulerPage /></FirmOSLayout>} />

      {/* AI Intelligence Center */}
      <Route path="intelligence" element={<FirmOSLayout><IntelligenceCenterPage /></FirmOSLayout>} />

      {/* Enterprise Mission Control */}
      <Route path="mission-control" element={<FirmOSLayout><EnterpriseMissionControl /></FirmOSLayout>} />

      {/* Autonomous Operations Engine */}
      <Route path="autonomous-operations" element={<FirmOSLayout><AutonomousOperationsPage /></FirmOSLayout>} />

      {/* Enterprise Governance Layer */}
      <Route path="governance" element={<FirmOSLayout><EnterpriseGovernancePage /></FirmOSLayout>} />

      {/* Equipo Jurídico */}
      <Route path="team" element={<FirmOSLayout><FirmTeam /></FirmOSLayout>} />

      {/* Control de Abogados */}
      <Route path="lawyers" element={<FirmOSLayout><FirmLawyers /></FirmOSLayout>} />

      {/* Indicadores Empresariales */}
      <Route path="analytics" element={<FirmOSLayout><FirmAnalytics /></FirmOSLayout>} />

      {/* Finanzas */}
      <Route path="finance" element={<FirmOSLayout><FirmFinance /></FirmOSLayout>} />

      {/* Facturación Empresarial */}
      <Route path="billing" element={<FirmOSLayout><BillingEnterprise /></FirmOSLayout>} />

      {/* Directorio Público */}
      <Route path="directory" element={<FirmOSLayout><FirmDirectorySettings /></FirmOSLayout>} />

      {/* Gestión Empresarial — Nuevos Módulos */}
      <Route path="structure" element={<FirmOSLayout><OrganizationalStructure /></FirmOSLayout>} />
      <Route path="departments" element={<FirmOSLayout><DepartmentsPage /></FirmOSLayout>} />
      <Route path="offices" element={<FirmOSLayout><OfficesPage /></FirmOSLayout>} />
      <Route path="expedientes" element={<FirmOSLayout><ExpedientesPage /></FirmOSLayout>} />
      <Route path="assignments" element={<FirmOSLayout><AssignmentsPage /></FirmOSLayout>} />
      <Route path="communication" element={<FirmOSLayout><CommunicationPage /></FirmOSLayout>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}

export default FirmOSModule;
