// Datos de demostración del módulo Inventario — Punto Cero OS.
// SOLO UI: sin backend. Sustituibles por endpoints reales más adelante.

export const PRODUCTS = [
  { _id: "p1", sku: "PCL-001", name: "Licencia Plan Profesional", category: "Licencias", stock: 120, min: 20, price: 140000, status: "active" },
  { _id: "p2", sku: "PCL-002", name: "Hora de consultoría jurídica", category: "Servicios", stock: 8, min: 10, price: 90000, status: "active" },
  { _id: "p3", sku: "PCL-003", name: "Plantilla contractual premium", category: "Documentos", stock: 0, min: 5, price: 35000, status: "inactive" },
  { _id: "p4", sku: "PCL-004", name: "Membresía Partner", category: "Licencias", stock: 45, min: 15, price: 0, status: "active" },
];

export const CATEGORIES = [
  { _id: "c1", name: "Licencias", products: 2, status: "active" },
  { _id: "c2", name: "Servicios", products: 1, status: "active" },
  { _id: "c3", name: "Documentos", products: 1, status: "active" },
];

export const MOVEMENTS_IN = [
  { _id: "i1", date: "2026-06-01", product: "Licencia Plan Profesional", qty: 50, ref: "Compra inicial", user: "Admin" },
  { _id: "i2", date: "2026-06-05", product: "Membresía Partner", qty: 20, ref: "Alta partners", user: "Admin" },
];

export const MOVEMENTS_OUT = [
  { _id: "o1", date: "2026-06-07", product: "Hora de consultoría jurídica", qty: 12, ref: "Consumo clientes", user: "Sistema" },
  { _id: "o2", date: "2026-06-08", product: "Plantilla contractual premium", qty: 5, ref: "Descargas", user: "Sistema" },
];
