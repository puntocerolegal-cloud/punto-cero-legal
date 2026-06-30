// Servicio del Motor de Referidos — Punto Cero System OS.
import * as mock from "@/modules/referrals/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { unwrap } from "@/lib/httpUnwrap";

const FLAG = "ENABLE_REFERRALS_API";

const MOCK = {
  KPIS: mock.KPIS,
  OPERATIONS: mock.OPERATIONS,
  REFERRALS: mock.REFERRALS,
  TIMELINE: mock.TIMELINE,
  MY_REFERRAL: mock.MY_REFERRAL,
  REFERRALS_BY_STATUS: mock.REFERRALS_BY_STATUS,
};

export const referralsService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/referrals/dashboard"));
    return { ...MOCK, ...payload, REFERRALS: payload.REFERRALS || payload.referrals || MOCK.REFERRALS };
  },

  async getList() {
    if (!isApiEnabled(FLAG)) return MOCK.REFERRALS;
    return unwrap(await apiClient.get("/referrals")) || [];
  },

  async getMyCode() {
    if (!isApiEnabled(FLAG)) return MOCK.MY_REFERRAL;
    return unwrap(await apiClient.get("/referrals/me")) || MOCK.MY_REFERRAL;
  },
};

export default referralsService;
