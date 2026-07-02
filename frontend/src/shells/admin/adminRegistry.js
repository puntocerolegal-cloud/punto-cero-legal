import React from 'react';
import { ExecutiveDashboard } from '@/modules/admin/pages/ExecutiveDashboard';
import { FinancialDashboard } from '@/modules/admin/pages/FinancialDashboard';
import { AICopilot } from '@/modules/admin/pages/AICopilot';
import { AutonomousControl } from '@/modules/admin/pages/AutonomousControl';
import { LegalOS } from '@/modules/admin/pages/LegalOS';
import { FirmsOverview } from '@/modules/admin/pages/FirmsOverview';
import { FirmDashboard } from '@/modules/admin/pages/FirmDashboard';
import { SalesCommandCenter } from '@/modules/admin/pages/SalesCommandCenter';
import { AICommandCenter } from '@/modules/admin/pages/AICommandCenter';
import { SalesRoomModule } from '@/modules/admin/pages/SalesRoomModule';
import { CasesPortal } from '@/modules/admin/pages/CasesPortal';
import { MasterControl } from '@/modules/admin/pages/MasterControl';
import { CountrySegmentation } from '@/modules/admin/pages/CountrySegmentation';
import { OrganizationsDashboard } from '@/modules/organizations';
import { UsersDashboard } from '@/modules/users';
import { RolesDashboard } from '@/modules/roles';
import { PermissionsDashboard } from '@/modules/permissions';
import { VerticalsDashboard } from '@/modules/verticals';
import { PartnersDashboard } from '@/modules/partners';
import { ImplementationsDashboard } from '@/modules/implementations';
import { SubscriptionsDashboard } from '@/modules/subscriptions';
import { PlansDashboard } from '@/modules/plans';
import { SubscriptionCenter } from '@/modules/subscriptionCenter';
import { BillingDashboard } from '@/modules/billing';
import { ReferralsDashboard } from '@/modules/referrals';
import { NotificationsDashboard } from '@/modules/notifications';
import { CommercialAIDashboard } from '@/modules/commercialAi';
import { AnalyticsDashboard } from '@/modules/analytics';
import { InventoryModule } from '@/modules/inventory/InventoryModule';
import { SecurityDashboard } from '@/modules/security';
import Seguridad from '@/pages/admin/Seguridad';
import ObservabilityDashboard from '@/pages/system/ObservabilityDashboard';

export const adminRegistry = {
  home: () => <ExecutiveDashboard />,
  financialOs: () => <FinancialDashboard />,
  aiCopilot: () => <AICopilot />,
  autonomousControl: () => <AutonomousControl />,
  legalOs: () => <LegalOS />,
  firms: () => <FirmsOverview />,
  firmDashboard: () => <FirmDashboard />,
  salesCommandCenter: () => <SalesCommandCenter />,
  aiCommandCenter: () => <AICommandCenter />,
  salesRoom: () => <SalesRoomModule />,
  casesPortal: () => <CasesPortal />,
  master: () => <MasterControl />,
  countries: () => <CountrySegmentation />,
  organizations: () => <OrganizationsDashboard />,
  users: () => <UsersDashboard />,
  roles: () => <RolesDashboard />,
  permissions: () => <PermissionsDashboard />,
  verticals: () => <VerticalsDashboard />,
  partners: () => <PartnersDashboard />,
  implementations: () => <ImplementationsDashboard />,
  subscriptions: () => <SubscriptionsDashboard />,
  plans: () => <PlansDashboard />,
  subscriptionCenter: () => <SubscriptionCenter />,
  billing: () => <BillingDashboard />,
  referrals: () => <ReferralsDashboard />,
  notifications: () => <NotificationsDashboard />,
  commercialAi: () => <CommercialAIDashboard />,
  analytics: () => <AnalyticsDashboard />,
  inventory: () => <InventoryModule />,
  security: () => <SecurityDashboard />,
  supportAccess: () => <Seguridad />,
  observability: () => <ObservabilityDashboard />,
};

export default adminRegistry;
