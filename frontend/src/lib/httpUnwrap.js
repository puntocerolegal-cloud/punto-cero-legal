// Helper para desempaquetar respuesta estándar { success, data, message, errors }.
// Punto único para procesar respuestas de apiClient en todos los servicios.
export function unwrap(res) {
  const body = res?.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) return body.data;
  return body;
}
