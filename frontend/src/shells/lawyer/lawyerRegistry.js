import React from 'react';
import { DashboardHome } from '@/pages/DashboardHome';
import CRMPage from '@/pages/dashboard/CRMPage';
import CasesPage from '@/pages/dashboard/CasesPage';
import ClientsPage from '@/pages/dashboard/ClientsPage';
import AgendaPage from '@/pages/dashboard/AgendaPage';
import AIPage from '@/pages/dashboard/AIPage';
import MeetingsPage from '@/pages/dashboard/MeetingsPage';
import InvoicesPage from '@/pages/dashboard/InvoicesPage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';
import SettingsPage from '@/pages/dashboard/SettingsPage';

export const lawyerRegistry = {
  home: () => <DashboardHome />,
  crm: () => <CRMPage />,
  cases: () => <CasesPage />,
  clients: () => <ClientsPage />,
  calendar: () => <AgendaPage />,
  ai: () => <AIPage />,
  meetings: () => <MeetingsPage />,
  invoices: () => <InvoicesPage />,
  documents: () => <DocumentsPage />,
  settings: () => <SettingsPage />,
};

export default lawyerRegistry;
