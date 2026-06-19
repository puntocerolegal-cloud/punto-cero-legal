// Servicio de Inventario — Punto Cero OS.
import * as mock from "@/modules/inventory/mockData";
import { apiClient } from "@/config/api/apiClient";
import { isApiEnabled } from "@/config/api/features";

const MOCK = {
  PRODUCTS: mock.PRODUCTS,
  CATEGORIES: mock.CATEGORIES,
  MOVEMENTS_IN: mock.MOVEMENTS_IN,
  MOVEMENTS_OUT: mock.MOVEMENTS_OUT,
};

export const inventoryService = {
  _mock: MOCK,

  async getDashboard() {
    if (!isApiEnabled("ENABLE_INVENTORY_API")) return MOCK;
    const { data } = await apiClient.get("/inventory/dashboard");
    return { ...MOCK, ...data };
  },

  async getStats() {
    if (!isApiEnabled("ENABLE_INVENTORY_API")) return { products: MOCK.PRODUCTS.length, categories: MOCK.CATEGORIES.length };
    const { data } = await apiClient.get("/inventory/stats");
    return data;
  },

  async getList() {
    if (!isApiEnabled("ENABLE_INVENTORY_API")) return MOCK.PRODUCTS;
    const { data } = await apiClient.get("/inventory/products");
    return data;
  },

  async getDetails(id) {
    if (!isApiEnabled("ENABLE_INVENTORY_API")) return MOCK.PRODUCTS.find((p) => p._id === id) || null;
    const { data } = await apiClient.get(`/inventory/products/${id}`);
    return data;
  },
};

export default inventoryService;
