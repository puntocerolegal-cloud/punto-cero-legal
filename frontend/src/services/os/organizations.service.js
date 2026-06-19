// Servicio de Organizaciones — Punto Cero OS.
// Hoy devuelve mock; cuando ENABLE_ORGANIZATIONS_API esté activo (y ENABLE_MOCKS
// en false) consumirá apiClient. La UI no cambia: consume siempre el servicio.
import * as mock from "@/modules/organizations/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { normalizeOrganizations } from "@/utils/normalizers";

// Desempaqueta la respuesta estándar { success, data, message, errors }.
function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}

const MOCK = {
  KPIS: mock.KPIS,
  ORGANIZATIONS: mock.ORGANIZATIONS,
  ORG_USERS: mock.ORG_USERS,
  OPERATIONS: mock.OPERATIONS,
  ORGS_BY_VERTICAL: mock.ORGS_BY_VERTICAL,
  USERS_BY_ORG: mock.USERS_BY_ORG,
  MRR_BY_ORG: mock.MRR_BY_ORG,
  HEALTH_DISTRIBUTION: mock.HEALTH_DISTRIBUTION,
};

export const organizationsService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled("ENABLE_ORGANIZATIONS_API")) return MOCK;
    const res = await apiClient.get("/organizations/dashboard");
    const payload = unwrap(res); // { organizations, KPIS }
    return {
      ...MOCK,
      ...payload,
      ORGANIZATIONS: normalizeOrganizations(payload.organizations || payload.ORGANIZATIONS || []),
    };
  },

  async getStats() {
    if (!isApiEnabled("ENABLE_ORGANIZATIONS_API")) return MOCK.KPIS;
    const res = await apiClient.get("/organizations/dashboard");
    return unwrap(res).KPIS || MOCK.KPIS;
  },

  async getList() {
    if (!isApiEnabled("ENABLE_ORGANIZATIONS_API")) return MOCK.ORGANIZATIONS;
    const res = await apiClient.get("/organizations");
    return normalizeOrganizations(unwrap(res) || []);
  },

  async getDetails(id) {
    if (!isApiEnabled("ENABLE_ORGANIZATIONS_API")) return MOCK.ORGANIZATIONS.find((o) => o._id === id) || null;
    const res = await apiClient.get(`/organizations/${id}`);
    return unwrap(res);
  },
};

export default organizationsService;
