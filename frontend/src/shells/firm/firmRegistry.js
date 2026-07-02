import React from 'react';
import { FirmDashboard } from '@/modules/firm-os/pages/FirmDashboard';
import CRMPage from '@/pages/dashboard/CRMPage';
import CasesPage from '@/pages/dashboard/CasesPage';
import ClientsPage from '@/pages/dashboard/ClientsPage';
import AgendaPage from '@/pages/dashboard/AgendaPage';
import AIPage from '@/pages/dashboard/AIPage';
import MeetingsPage from '@/pages/dashboard/MeetingsPage';
import InvoicesPage from '@/pages/dashboard/InvoicesPage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';
import { AutomationCenterPage } from '@/modules/firm-os/pages/AutomationCenterPage';
import { WorkflowBuilderPage } from '@/modules/firm-os/pages/WorkflowBuilderPage';
import { SchedulerPage } from '@/modules/firm-os/pages/SchedulerPage';
import { IntelligenceCenterPage } from '@/modules/firm-os/pages/IntelligenceCenterPage';
import EnterpriseMissionControl from '@/modules/firm-os/pages/EnterpriseMissionControl';
import AutonomousOperationsPage from '@/modules/firm-os/pages/AutonomousOperationsPage';
import EnterpriseGovernancePage from '@/modules/firm-os/pages/EnterpriseGovernancePage';

export const firmRegistry = {
  home: () => <FirmDashboard />,
  crm: () => <CRMPage />,
  cases: () => <CasesPage />,
  clients: () => <ClientsPage />,
  calendar: () => <AgendaPage />,
  ai: () => <AIPage />,
  meetings: () => <MeetingsPage />,
  invoices: () => <InvoicesPage />,
  documents: () => <DocumentsPage />,
  settings: () => <SettingsPage />,
  automation: () => <AutomationCenterPage />,
  workflowBuilder: () => <WorkflowBuilderPage />,
  scheduler: () => <SchedulerPage />,
  intelligence: () => <IntelligenceCenterPage />,
  missionControl: () => <EnterpriseMissionControl />,
  autonomousOperations: () => <AutonomousOperationsPage />,
  governance: () => <EnterpriseGovernancePage />,
};

export default firmRegistry;
