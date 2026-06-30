// Servicio del Centro de Suscripción — Punto Cero System OS.
import * as mock from "@/modules/subscriptionCenter/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { unwrap } from "@/lib/httpUnwrap";

const FLAG = "ENABLE_SUBSCRIPTION_CENTER_API";

const MOCK = {
  KPIS: mock.KPIS,
  HISTORY: mock.HISTORY,
  INVOICES: mock.INVOICES,
  BENEFITS: mock.BENEFITS,
};

export const subscriptionCenterService = {
  _mock: MOCK,
  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/subscription-center/dashboard"));
    return { ...MOCK, ...payload };
  },
};

export default subscriptionCenterService;
