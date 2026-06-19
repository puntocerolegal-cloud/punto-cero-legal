// Servicio consolidado del OS — Punto Cero OS.
// Une la información de Partners, Implementaciones, Suscripciones, Facturación
// y Organizaciones en una sola consulta. Pensado para alimentar Analytics y el
// Dashboard Ejecutivo global. Hoy combina los mocks de cada servicio.
import { organizationsService } from "./organizations.service";
import { partnersService } from "./partners.service";
import { implementationsService } from "./implementations.service";
import { subscriptionsService } from "./subscriptions.service";
import { billingService } from "./billing.service";

export const dashboardService = {
  async getConsolidated() {
    const [organizations, partners, implementations, subscriptions, billing] = await Promise.all([
      organizationsService.getDashboard(),
      partnersService.getDashboard(),
      implementationsService.getDashboard(),
      subscriptionsService.getDashboard(),
      billingService.getDashboard(),
    ]);

    return {
      organizations,
      partners,
      implementations,
      subscriptions,
      billing,
      summary: {
        activeOrgs: organizations?.KPIS?.activeOrgs ?? 0,
        activePartners: partners?.KPIS?.activePartners ?? 0,
        activeImplementations: implementations?.KPIS?.activeProjects ?? 0,
        mrr: subscriptions?.KPIS?.mrr ?? 0,
        totalBilled: billing?.KPIS?.totalBilled ?? 0,
      },
    };
  },
};

export default dashboardService;
