import React from "react";
import { Routes, Route } from "react-router-dom";
import { AdminOSLayout } from "./AdminOSLayout";
import { ExecutiveDashboard } from "./pages/ExecutiveDashboard";
import { SalesRoomModule } from "./pages/SalesRoomModule";
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
import { OSDataProvider } from "@/context/OSDataProvider";
import { OSStoreProvider } from "@/store/os/osStore";
import { TenantProvider } from "@/context/TenantContext";
import { SecurityDashboard } from "../security";

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
      <Route index element={<AdminOSLayout title="Dashboard Ejecutivo"><ExecutiveDashboard /></AdminOSLayout>} />
      <Route path="sales-room" element={<AdminOSLayout title="Sala de Ventas"><SalesRoomModule /></AdminOSLayout>} />
      <Route path="cases-portal" element={<AdminOSLayout title="Portal de Casos"><CasesPortal /></AdminOSLayout>} />
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
