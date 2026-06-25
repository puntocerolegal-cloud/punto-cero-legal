import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminOSLayout } from "./AdminOSLayout";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { SalesRoomModule } from "./pages/SalesRoomModule";
import { MasterControl } from "./pages/MasterControl";
import { CasesPortal } from "./pages/CasesPortal";
import { CountrySegmentation } from "./pages/CountrySegmentation";
import { InventoryModule } from "../inventory/InventoryModule";
import { VerticalsDashboard } from "../verticals";
import { UsersDashboard } from "../users";
import { RolesDashboard } from "../roles";
import { PermissionsDashboard } from "../permissions";
import { PlansDashboard } from "../plans";
import { SubscriptionCenter } from "../subscriptionCenter";
import { ReferralsDashboard } from "../referrals";
import { NotificationsDashboard } from "../notifications";
import { CommercialAIDashboard } from "../commercialAi";
import UpgradeCenter from "@/pages/admin/SubscriptionCenter";
import SupportAccessPanel from "@/pages/admin/Seguridad";
import { SupportAccessGate } from "@/components/security/SupportAccessGate";
import { PartnersDashboard } from "../partners";
import { ImplementationsDashboard } from "../implementations";
import { SubscriptionsDashboard } from "../subscriptions";
import { OrganizationsDashboard } from "../organizations";
import { BillingDashboard } from "../billing";
import { AnalyticsDashboard } from "../analytics";
import { PendingFirmsCenter } from "./pages/PendingFirmsCenter";
import { OSDataProvider } from "@/context/OSDataProvider";
import { OSStoreProvider } from "@/store/os/osStore";
import { TenantProvider } from "@/context/TenantContext";
import { SecurityDashboard } from "../security";
import { FirmDashboard } from "./pages/FirmDashboard";
import { SalesCommandCenter } from "./pages/SalesCommandCenter";
import { AICommandCenter } from "./pages/AICommandCenter";
import { ExecutiveIntelligenceCenter } from "./pages/ExecutiveIntelligenceCenter";
import { FinancialDashboard } from "./pages/FinancialDashboard";
import { AICopilot } from "./pages/AICopilot";
import { AutonomousControl } from "./pages/AutonomousControl";
import { GlobalNetwork } from "./pages/GlobalNetwork";
import { LegalOS } from "./pages/LegalOS";
import { FirmsOverview } from "./pages/FirmsOverview";

/**
 * Módulo Administrativo de Punto Cero OS.
 * Rutas anidadas bajo /admin/*. Todas las secciones están construidas
 * (sin placeholders pendientes). Envuelto en los providers globales del OS
 * (caché/refresh y estado compartido) — infraestructura aditiva, sin cambiar UI.
 */
export function AdminModule() {
  return (
    <TenantProvider>
      <OSDataProvider>
        <OSStoreProvider>
          <Routes>
      <Route index element={<AdminOSLayout title="PUNTO CERO SYSTEM OS"><ExecutiveDashboard /></AdminOSLayout>} />
      <Route path="executive-intelligence" element={<AdminOSLayout title="Centro de Inteligencia Ejecutiva"><ExecutiveIntelligenceCenter /></AdminOSLayout>} />
      <Route path="financial-os" element={<AdminOSLayout title="Financial OS"><FinancialDashboard /></AdminOSLayout>} />
      <Route path="ai-copilot" element={<AdminOSLayout title="AI Legal Autopilot"><AICopilot /></AdminOSLayout>} />
      <Route path="autonomous-control" element={<AdminOSLayout title="Autonomous Legal OS"><AutonomousControl /></AdminOSLayout>} />
      <Route path="global-network" element={<AdminOSLayout title="Global Network OS"><GlobalNetwork /></AdminOSLayout>} />
      <Route path="legal-os" element={<AdminOSLayout title="Legal Operating System"><LegalOS /></AdminOSLayout>} />
      <Route path="firms" element={<AdminOSLayout title="Directorio de Firmas"><FirmsOverview /></AdminOSLayout>} />
      <Route path="firms-approval" element={<AdminOSLayout title="Centro de Aprobación de Firmas"><PendingFirmsCenter /></AdminOSLayout>} />
      <Route path="firm-dashboard" element={<AdminOSLayout title="Dashboard de Firma"><FirmDashboard /></AdminOSLayout>} />
      <Route path="sales-command-center" element={<AdminOSLayout title="Sales Command Center"><SalesCommandCenter /></AdminOSLayout>} />
      <Route path="ai-command-center" element={<AdminOSLayout title="Copiloto IA"><AICommandCenter /></AdminOSLayout>} />
      <Route path="sales-room" element={<AdminOSLayout title="Sala de Ventas"><SalesRoomModule /></AdminOSLayout>} />
      <Route path="cases-portal" element={<AdminOSLayout title="Portal de Casos"><CasesPortal /></AdminOSLayout>} />
      <Route path="master" element={<AdminOSLayout title="Control Maestro"><MasterControl /></AdminOSLayout>} />
      <Route path="countries" element={<AdminOSLayout title="Segmentación por Países"><CountrySegmentation /></AdminOSLayout>} />
      <Route path="organizations" element={<AdminOSLayout title="Organizaciones"><OrganizationsDashboard /></AdminOSLayout>} />
      <Route path="users" element={<AdminOSLayout title="Usuarios"><UsersDashboard /></AdminOSLayout>} />
      <Route path="roles" element={<AdminOSLayout title="Roles"><RolesDashboard /></AdminOSLayout>} />
      <Route path="permissions" element={<AdminOSLayout title="Permisos"><PermissionsDashboard /></AdminOSLayout>} />
      <Route path="verticals" element={<AdminOSLayout title="Motor Multivertical"><VerticalsDashboard /></AdminOSLayout>} />
      <Route path="partners" element={<AdminOSLayout title="Socios Comerciales"><PartnersDashboard /></AdminOSLayout>} />
      <Route path="implementations" element={<AdminOSLayout title="Implementaciones"><ImplementationsDashboard /></AdminOSLayout>} />
      <Route path="subscriptions" element={<AdminOSLayout title="Suscripciones y Facturación"><SubscriptionsDashboard /></AdminOSLayout>} />
      <Route path="plans" element={<AdminOSLayout title="Motor de Planes"><PlansDashboard /></AdminOSLayout>} />
      <Route path="subscription-center" element={<AdminOSLayout title="Centro de Suscripción"><SubscriptionCenter /></AdminOSLayout>} />
      <Route path="upgrade" element={<AdminOSLayout title="Actualizar Plan"><UpgradeCenter /></AdminOSLayout>} />
      <Route path="billing" element={<AdminOSLayout title="Facturación y Contabilidad"><BillingDashboard /></AdminOSLayout>} />
      <Route path="referrals" element={<AdminOSLayout title="Referidos"><ReferralsDashboard /></AdminOSLayout>} />
      <Route path="notifications" element={<AdminOSLayout title="Notificaciones"><NotificationsDashboard /></AdminOSLayout>} />
      <Route path="commercial-ai" element={<AdminOSLayout title="IA Comercial"><CommercialAIDashboard /></AdminOSLayout>} />
      <Route path="analytics" element={<AdminOSLayout title="Analytics Center"><AnalyticsDashboard /></AdminOSLayout>} />
      <Route path="inventory" element={<AdminOSLayout title="Inventario Inteligente"><InventoryModule /></AdminOSLayout>} />
      {/* Ruta técnica protegida con la capa adicional SupportAccessGate. */}
      <Route path="security" element={<AdminOSLayout title="Seguridad"><SupportAccessGate><SecurityDashboard /></SupportAccessGate></AdminOSLayout>} />
      {/* Panel emisor/revocador de tokens de soporte (no requiere token). */}
      <Route path="support-access" element={<AdminOSLayout title="Accesos de Soporte"><SupportAccessPanel /></AdminOSLayout>} />
          </Routes>
        </OSStoreProvider>
      </OSDataProvider>
    </TenantProvider>
  );
}

export default AdminModule;
