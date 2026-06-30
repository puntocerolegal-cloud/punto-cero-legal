// Servicio del Motor Multivertical — Punto Cero System OS.
// Hoy devuelve mock; cuando ENABLE_VERTICALS_API esté activo (y ENABLE_MOCKS
// en false) consumirá apiClient. La UI no cambia: consume siempre el servicio.
import * as mock from "@/modules/verticals/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { unwrap } from "@/lib/httpUnwrap";

const MOCK = {
  KPIS: mock.KPIS,
  VERTICALS: mock.VERTICALS,
  OPERATIONS: mock.OPERATIONS,
  REVENUE_BY_VERTICAL: mock.REVENUE_BY_VERTICAL,
  ORGS_BY_VERTICAL: mock.ORGS_BY_VERTICAL,
  GROWTH_BY_VERTICAL: mock.GROWTH_BY_VERTICAL,
  STATUS_DISTRIBUTION: mock.STATUS_DISTRIBUTION,
};

export const verticalsService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled("ENABLE_VERTICALS_API")) return MOCK;
    const payload = unwrap(await apiClient.get("/verticals/dashboard"));
    return {
      ...MOCK,
      ...payload,
      VERTICALS: payload.VERTICALS || payload.verticals || MOCK.VERTICALS,
    };
  },

  async getList() {
    if (!isApiEnabled("ENABLE_VERTICALS_API")) return MOCK.VERTICALS;
    return unwrap(await apiClient.get("/verticals")) || [];
  },

  async getDetails(id) {
    if (!isApiEnabled("ENABLE_VERTICALS_API")) return MOCK.VERTICALS.find((v) => v._id === id) || null;
    return unwrap(await apiClient.get(`/verticals/${id}`));
  },

  // ── Ciclo de vida ──
  // En mock devuelve el nuevo estado (la UI actualiza su copia local);
  // con backend activo persiste vía PATCH.
  async setStatus(id, status) {
    if (!isApiEnabled("ENABLE_VERTICALS_API")) return { _id: id, status };
    return unwrap(await apiClient.patch(`/verticals/${id}/status`, { status }));
  },

  activate(id) { return this.setStatus(id, "ACTIVA"); },
  deactivate(id) { return this.setStatus(id, "DESHABILITADA"); },
  prepare(id) { return this.setStatus(id, "DESARROLLO"); },
};

export default verticalsService;
