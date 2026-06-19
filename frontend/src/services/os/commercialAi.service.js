// Servicio de IA Comercial — Punto Cero System OS.
import * as mock from "@/modules/commercialAi/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";
import { answer } from "@/core/commerce/commercialAI";

function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}

const FLAG = "ENABLE_COMMERCIAL_AI_API";

const MOCK = { KPIS: mock.KPIS, FAQ: mock.FAQ, TOPICS: mock.TOPICS };

export const commercialAiService = {
  _mock: MOCK,
  async getDashboard() {
    if (!isApiEnabled(FLAG)) return MOCK;
    const payload = unwrap(await apiClient.get("/commercial-ai/dashboard"));
    return { ...MOCK, ...payload };
  },
  // Pregunta a la IA comercial (mock local; backend futuro).
  async ask(question) {
    if (!isApiEnabled(FLAG)) return { answer: answer(question) };
    return unwrap(await apiClient.post("/commercial-ai/ask", { question }));
  },
};

export default commercialAiService;
