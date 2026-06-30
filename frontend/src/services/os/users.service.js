// Servicio de Usuarios (administración global) — Punto Cero System OS.
// Hoy devuelve mock; con ENABLE_USERS_API activo (y ENABLE_MOCKS=false) consume
// apiClient. La UI no cambia: siempre consume el servicio.
import * as mock from "@/modules/users/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { unwrap } from "@/lib/httpUnwrap";

const FLAG = "ENABLE_USERS_API";

const MOCK = {
  KPIS: mock.KPIS,
  USERS: mock.USERS,
  OPERATIONS: mock.OPERATIONS,
  USERS_BY_ROLE: mock.USERS_BY_ROLE,
  USERS_BY_VERTICAL: mock.USERS_BY_VERTICAL,
  USERS_BY_STATUS: mock.USERS_BY_STATUS,
  MONTHLY_GROWTH: mock.MONTHLY_GROWTH,
};

export const usersService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/users/dashboard"));
    return { ...MOCK, ...payload, USERS: payload.USERS || payload.users || MOCK.USERS };
  },

  async getList() {
    if (!isApiEnabled(FLAG)) return MOCK.USERS;
    return unwrap(await apiClient.get("/users")) || [];
  },

  async getDetails(id) {
    if (!isApiEnabled(FLAG)) return MOCK.USERS.find((u) => u._id === id) || null;
    return unwrap(await apiClient.get(`/users/${id}`));
  },

  async create(payload) {
    if (!isApiEnabled(FLAG)) return { ...payload };
    return unwrap(await apiClient.post("/users", payload));
  },

  async update(id, payload) {
    if (!isApiEnabled(FLAG)) return { _id: id, ...payload };
    return unwrap(await apiClient.put(`/users/${id}`, payload));
  },

  // ── Ciclo de vida / acceso ──
  async setStatus(id, status) {
    if (!isApiEnabled(FLAG)) return { _id: id, status };
    return unwrap(await apiClient.patch(`/users/${id}/status`, { status }));
  },
  activate(id) { return this.setStatus(id, "ACTIVO"); },
  deactivate(id) { return this.setStatus(id, "INACTIVO"); },
  suspend(id) { return this.setStatus(id, "SUSPENDIDO"); },

  async resetAccess(id) {
    if (!isApiEnabled(FLAG)) return { _id: id, reset: true };
    return unwrap(await apiClient.post(`/users/${id}/reset-access`, {}));
  },
  async changeOrganization(id, organization) {
    if (!isApiEnabled(FLAG)) return { _id: id, organization };
    return unwrap(await apiClient.patch(`/users/${id}/organization`, { organization }));
  },
  async changeRole(id, role) {
    if (!isApiEnabled(FLAG)) return { _id: id, role };
    return unwrap(await apiClient.patch(`/users/${id}/role`, { role }));
  },
};

export default usersService;
