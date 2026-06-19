// Servicio de Roles — Punto Cero System OS.
import * as mock from "@/modules/roles/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";

function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}

const FLAG = "ENABLE_ROLES_API";

const MOCK = {
  KPIS: mock.KPIS,
  ROLES: mock.ROLES,
  OPERATIONS: mock.OPERATIONS,
  USERS_BY_ROLE: mock.USERS_BY_ROLE,
  ROLE_STATUS_DISTRIBUTION: mock.ROLE_STATUS_DISTRIBUTION,
};

export const rolesService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/roles/dashboard"));
    return { ...MOCK, ...payload, ROLES: payload.ROLES || payload.roles || MOCK.ROLES };
  },

  async getList() {
    if (!isApiEnabled(FLAG)) return MOCK.ROLES;
    return unwrap(await apiClient.get("/roles")) || [];
  },

  async getDetails(id) {
    if (!isApiEnabled(FLAG)) return MOCK.ROLES.find((r) => r._id === id) || null;
    return unwrap(await apiClient.get(`/roles/${id}`));
  },

  async create(payload) {
    if (!isApiEnabled(FLAG)) return { ...payload };
    return unwrap(await apiClient.post("/roles", payload));
  },

  async update(id, payload) {
    if (!isApiEnabled(FLAG)) return { _id: id, ...payload };
    return unwrap(await apiClient.put(`/roles/${id}`, payload));
  },

  async duplicate(id) {
    if (!isApiEnabled(FLAG)) return { _id: id, duplicated: true };
    return unwrap(await apiClient.post(`/roles/${id}/duplicate`, {}));
  },

  async setStatus(id, status) {
    if (!isApiEnabled(FLAG)) return { _id: id, status };
    return unwrap(await apiClient.patch(`/roles/${id}/status`, { status }));
  },
  activate(id) { return this.setStatus(id, "ACTIVO"); },
  deactivate(id) { return this.setStatus(id, "INACTIVO"); },
};

export default rolesService;
