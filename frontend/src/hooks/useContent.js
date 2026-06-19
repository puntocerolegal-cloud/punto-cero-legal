// Capa de Marketing (Content-as-a-Service) — Punto Cero System OS.
// Obtiene el contenido editable (titulares, precios, mensajes) desde una Google
// Sheet publicada como CSV (REACT_APP_SHEET_URL), lo parsea a un objeto plano
// key:value y lo expone vía contexto. Si el fetch falla, se usa FALLBACK_CONTENT
// para que la UI nunca se rompa.
//
// Este archivo contiene: el contexto, el hook `useContent`, los helpers de
// fetch/parse de CSV y el contenido por defecto. El Provider vive en
// 'src/contexts/ContentProvider.jsx' (evita dependencias circulares).
import { createContext, useContext } from "react";
import axios from "axios";

// URL de la Google Sheet publicada como CSV (Archivo → Compartir → Publicar en
// la web → CSV). El .env (REACT_APP_SHEET_URL) tiene prioridad; este valor por
// defecto es la hoja real ya configurada (variante /pub?output=csv).
export const SHEET_URL =
  process.env.REACT_APP_SHEET_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSO5eUmkGm4-BbR4LnOfCojx8Fx1t4rFzbbzBEPN9KDYZf34F9WTpRNI6pBsBdRv_kqk6tqayjxjQgU/pub?output=csv";

// Enlace al "dashboard de marketing" (vista publicada de la hoja para el equipo).
export const MARKETING_DASHBOARD_URL =
  process.env.REACT_APP_MARKETING_DASHBOARD_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSO5eUmkGm4-BbR4LnOfCojx8Fx1t4rFzbbzBEPN9KDYZf34F9WTpRNI6pBsBdRv_kqk6tqayjxjQgU/pubhtml";

// Contenido por defecto (objeto plano key:value). Misma forma que el CSV:
// la primera columna es la clave y la segunda el valor.
export const FALLBACK_CONTENT = {
  "marketing.heroTitle": "Gestiona tu firma con IA",
  "marketing.heroSubtitle": "CRM jurídico, casos, agenda e inteligencia artificial en un solo lugar.",
  "marketing.ctaPrimary": "Empezar ahora",
  "marketing.ctaSecondary": "Ver planes",
  "messages.upgradeTitle": "Desbloquea todas las funcionalidades",
  "messages.trialBanner": "Prueba 3 días con datos reales, sin tarjeta.",
  "messages.demoBanner": "Estás explorando en modo Demo.",
  "meta.marketingDashboardUrl": MARKETING_DASHBOARD_URL,
};

export const ContentContext = createContext(null);

// ── Parser CSV mínimo con soporte de comillas dobles ──
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // comilla escapada ""
        else inQuotes = false;
      } else cur += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur); cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Convierte el CSV (key,value por fila) en un objeto plano { key: value }. */
export function parseCsvToContent(text) {
  const obj = {};
  String(text).split(/\r?\n/).forEach((line, idx) => {
    if (!line.trim()) return;
    const cells = splitCsvLine(line);
    const key = (cells[0] || "").trim();
    if (!key) return;
    if (idx === 0 && key.toLowerCase() === "key") return; // salta encabezado
    obj[key] = (cells[1] || "").trim();
  });
  return obj;
}

/**
 * Carga ANTIFRÁGIL del contenido (blindaje de red).
 * - fetch estrictamente envuelto en try-catch.
 * - En catch: loguea y devuelve FALLBACK_CONTENT (jamás lanza → no hay pantalla roja).
 * - El resultado siempre se mezcla con FALLBACK_CONTENT (sin campos vacíos/nulos).
 * `Authorization: null` evita filtrar el JWT de la app a Google y el preflight CORS.
 */
export async function loadContent(url = SHEET_URL) {
  if (!url) return { ...FALLBACK_CONTENT };
  try {
    const response = await axios.get(url, { headers: { Authorization: null } });
    const data = parseCsvToContent(response.data);
    return { ...FALLBACK_CONTENT, ...data };
  } catch (error) {
    console.warn("[PCL] No se pudo cargar Google Sheet, usando valores por defecto:", error.message);
    return { ...FALLBACK_CONTENT };
  }
}

/** Hook de consumo: { content, loading, error, refresh, t(key, fallback) }. */
export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}

export default useContent;
