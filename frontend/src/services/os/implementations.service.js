// Servicio de Implementaciones — Punto Cero OS.
import * as mock from "@/modules/implementations/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { normalizeImplementation, normalizeImplementations } from "@/utils/normalizers";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";
import { unwrap } from "@/lib/httpUnwrap";

const MOCK = {
  STAGES: mock.STAGES,
  CHECKLISTS: mock.CHECKLISTS,
  PROJECTS: mock.PROJECTS,
  KPIS: mock.KPIS,
  OPERATIONS: mock.OPERATIONS,
  GO_LIVES: mock.GO_LIVES,
  BY_VERTICAL: mock.BY_VERTICAL,
  AVG_TIME_BY_STAGE: mock.AVG_TIME_BY_STAGE,
  GO_LIVE_BY_MONTH: mock.GO_LIVE_BY_MONTH,
  CONVERSION_SOLD_TO_PRODUCTIVE: mock.CONVERSION_SOLD_TO_PRODUCTIVE,
};

const ON = () => isApiEnabled("ENABLE_IMPLEMENTATIONS_API");

export const implementationsService = {
  _mock: MOCK,

  async getDashboard() {
    if (!ON()) return MOCK;
    const payload = unwrap(await apiClient.get("/implementations/dashboard"));
    // Conserva del mock las series de gráficos y OPERATIONS (aún no servidas);
    // reemplaza con datos reales PROJECTS / KPIS / GO_LIVES.
    return {
      ...MOCK,
      ...payload,
      PROJECTS: normalizeImplementations(payload.PROJECTS || payload.implementations || []),
    };
  },

  async getImplementations() {
    return this.getList();
  },

  async getStats() {
    if (!ON()) return MOCK.KPIS;
    return unwrap(await apiClient.get("/implementations/dashboard")).KPIS || MOCK.KPIS;
  },

  async getList() {
    if (!ON()) return MOCK.PROJECTS;
    return normalizeImplementations(unwrap(await apiClient.get("/implementations")) || []);
  },

  async getImplementation(id) {
    return this.getDetails(id);
  },

  async getDetails(id) {
    if (!ON()) return MOCK.PROJECTS.find((p) => p.id === id) || null;
    return normalizeImplementation(unwrap(await apiClient.get(`/implementations/${id}`)));
  },

  // ── Mutaciones (emiten eventos en el EventBus) ──
  async create(payload) {
    const data = normalizeImplementation(unwrap(await apiClient.post("/implementations/", payload)));
    eventBus.emit(OS_EVENTS.implementationCreated, data);
    return data;
  },

  async update(id, payload) {
    const prevStage = payload?._prevStage;
    const data = normalizeImplementation(unwrap(await apiClient.put(`/implementations/${id}`, payload)));
    eventBus.emit(OS_EVENTS.implementationUpdated, data);
    if (payload?.stage && prevStage && payload.stage !== prevStage) {
      eventBus.emit(OS_EVENTS.implementationStageChanged, data);
    }
    return data;
  },

  async remove(id) {
    await apiClient.delete(`/implementations/${id}`);
    eventBus.emit(OS_EVENTS.implementationDeleted, { id });
    return true;
  },
};

export default implementationsService;
