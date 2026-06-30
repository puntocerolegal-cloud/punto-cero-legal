// Servicio de Socios Comerciales — Punto Cero OS.
import * as mock from "@/modules/partners/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { normalizePartner, normalizePartners } from "@/utils/normalizers";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";
import { unwrap } from "@/lib/httpUnwrap";

// Tenant por defecto de la organización en producción. El backend exige tenant
// para CREAR/EDITAR/ELIMINAR; SUPER_ADMIN lo ignora al leer. Configurable por env.
const DEFAULT_TENANT = process.env.REACT_APP_DEFAULT_TENANT || "puntocero-org";

const MOCK = {
  KPIS: mock.KPIS,
  OPPORTUNITIES: mock.OPPORTUNITIES,
  PIPELINE_STAGES: mock.PIPELINE_STAGES,
  VERTICALS: mock.VERTICALS,
  PARTNERS: mock.PARTNERS,
  COMMISSIONS: mock.COMMISSIONS,
  OPERATIONS: mock.OPERATIONS,
};

export const partnersService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled("ENABLE_PARTNERS_API")) return MOCK;
    const payload = unwrap(await apiClient.get("/partners/dashboard"));
    // Conserva PIPELINE_STAGES / VERTICALS / COMMISSIONS / OPERATIONS del mock
    // (configuración/series aún no servidas por backend) y reemplaza los datos
    // reales (PARTNERS, OPPORTUNITIES, KPIS) normalizados.
    return {
      ...MOCK,
      ...payload,
      PARTNERS: normalizePartners(payload.PARTNERS || payload.partners || []),
    };
  },

  // Alias semántico solicitado (Fase 8).
  async getPartners() {
    return this.getList();
  },

  async getStats() {
    if (!isApiEnabled("ENABLE_PARTNERS_API")) return MOCK.KPIS;
    return unwrap(await apiClient.get("/partners/dashboard")).KPIS || MOCK.KPIS;
  },

  async getList() {
    if (!isApiEnabled("ENABLE_PARTNERS_API")) return MOCK.PARTNERS;
    return normalizePartners(unwrap(await apiClient.get("/partners")) || []);
  },

  // Alias semántico solicitado (Fase 8).
  async getPartner(id) {
    return this.getDetails(id);
  },

  async getDetails(id) {
    if (!isApiEnabled("ENABLE_PARTNERS_API")) return MOCK.PARTNERS.find((p) => p._id === id) || null;
    return normalizePartner(unwrap(await apiClient.get(`/partners/${id}`)));
  },

  // ── CRUD (Red de Agentes) — persiste en backend y emite eventos reactivos ──
  // CREAR exige tenant en el backend → enviamos X-Tenant-ID de la organización.
  async createPartner(payload) {
    const res = await apiClient.post("/partners/", payload, { headers: { "X-Tenant-ID": DEFAULT_TENANT } });
    const data = normalizePartner(unwrap(res));
    eventBus.emit(OS_EVENTS.partnerCreated, data);
    return data;
  },

  async updatePartner(id, payload) {
    const data = normalizePartner(unwrap(await apiClient.put(`/partners/${id}`, payload, { headers: { "X-Tenant-ID": DEFAULT_TENANT } })));
    eventBus.emit(OS_EVENTS.partnerUpdated, data);
    return data;
  },

  async deletePartner(id) {
    await apiClient.delete(`/partners/${id}`, { headers: { "X-Tenant-ID": DEFAULT_TENANT } });
    eventBus.emit(OS_EVENTS.partnerDeleted, { id });
    return true;
  },
};

export default partnersService;
