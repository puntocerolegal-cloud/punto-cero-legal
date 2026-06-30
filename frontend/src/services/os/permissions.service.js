// Servicio de Permisos (RBAC) — Punto Cero System OS.
import * as mock from "@/modules/permissions/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { unwrap } from "@/lib/httpUnwrap";
import { normalizeHTTPError } from "@/lib/osErrorHandler";

const FLAG = "ENABLE_PERMISSIONS_API";

const MOCK = {
  KPIS: mock.KPIS,
  OPERATIONS: mock.OPERATIONS,
  MATRIX: mock.MATRIX,
  PERMISSION_MODULES: mock.PERMISSION_MODULES,
  PERMISSION_ROLES: mock.PERMISSION_ROLES,
  PERMISSION_TYPES: mock.PERMISSION_TYPES,
  PERMISSIONS_BY_ROLE: mock.PERMISSIONS_BY_ROLE,
  COVERAGE_BY_MODULE: mock.COVERAGE_BY_MODULE,
};

export const permissionsService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/permissions/dashboard"));
    return { ...MOCK, ...payload, MATRIX: payload.MATRIX || MOCK.MATRIX };
  },

  async getMatrix() {
    if (!isApiEnabled(FLAG)) return MOCK.MATRIX;
    return unwrap(await apiClient.get("/permissions/matrix")) || MOCK.MATRIX;
  },

  // Alterna un permiso puntual { type, module, role, value, scope, scopeEntity }.
  async setPermission(payload) {
    if (!isApiEnabled(FLAG)) return { ...payload };
    try {
      return unwrap(await apiClient.patch("/permissions", payload));
    } catch (err) {
      normalizeHTTPError(err, {
        service: 'permissions',
        operation: 'setPermission',
        resourceType: 'permission',
      });
    }
  },

  // Persiste la matriz completa.
  async saveMatrix(matrix) {
    if (!isApiEnabled(FLAG)) return { saved: true };
    try {
      return unwrap(await apiClient.put("/permissions/matrix", { matrix }));
    } catch (err) {
      normalizeHTTPError(err, {
        service: 'permissions',
        operation: 'saveMatrix',
        resourceType: 'matrix',
      });
    }
  },
};

export default permissionsService;
