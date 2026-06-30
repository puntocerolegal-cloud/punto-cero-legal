// Servicio de Notificaciones Inteligentes — Punto Cero System OS.
import * as mock from "@/modules/notifications/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { unwrap } from "@/lib/httpUnwrap";

const FLAG = "ENABLE_NOTIFICATIONS_API";

const MOCK = {
  KPIS: mock.KPIS,
  NOTIFICATIONS: mock.NOTIFICATIONS,
  BY_CHANNEL: mock.BY_CHANNEL,
};

export const notificationsService = {
  _mock: MOCK,
  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/notifications/dashboard"));
    return { ...MOCK, ...payload, NOTIFICATIONS: payload.NOTIFICATIONS || payload.notifications || MOCK.NOTIFICATIONS };
  },
  async getList() {
    if (!isApiEnabled(FLAG)) return MOCK.NOTIFICATIONS;
    return unwrap(await apiClient.get("/notifications")) || [];
  },
};

export default notificationsService;
