// Datos de demostración del Motor de Planes — Punto Cero System OS.
// SOLO UI: sin backend. Sustituible por endpoints reales con ENABLE_PLANS_API.
//
// MONEDA BASE DEL SISTEMA: USD. Todos los planes se almacenan en USD (priceUsd);
// los precios locales se calculan multiplicando por el exchange_rate de la moneda.
// Las tarifas oficiales en COP coinciden con priceUsd × 4000 (tasa mock de COP).

// ── Planes oficiales (precio interno en USD) ──
// max_cases / max_ai_requests = -1 → ilimitado.
export const PLANS = [
  {
    _id: "plan-despegue",
    slug: "despegue",
    name: "El Despegue",
    priceUsd: 28.125, // 112.500 COP
    status: "ACTIVO",
    orgs: 9,
    limits: { max_users: 1, max_cases: 50, max_storage: 5, max_ai_requests: 100, video_enabled: false, billing_enabled: false, api_enabled: false, support_level: "basic" },
    features: ["1 abogado", "CRM Básico", "Directorio de Clientes", "Agenda Personal", "IA Redacción", "Hasta 50 casos"],
  },
  {
    _id: "plan-salto",
    slug: "salto-estrategico",
    name: "El Salto Estratégico",
    priceUsd: 52.5, // 210.000 COP
    status: "ACTIVO",
    orgs: 7,
    limits: { max_users: 1, max_cases: 150, max_storage: 20, max_ai_requests: 500, video_enabled: true, billing_enabled: true, api_enabled: false, support_level: "standard" },
    features: ["1 abogado", "CRM Avanzado", "Agenda Bidireccional", "IA Documental", "Sala de Conferencias HD", "Facturación Automática", "Hasta 150 casos"],
  },
  {
    _id: "plan-crecimiento",
    slug: "firma-crecimiento",
    name: "Firma en Crecimiento",
    priceUsd: 140.625, // 562.500 COP
    status: "ACTIVO",
    orgs: 4,
    limits: { max_users: 5, max_cases: -1, max_storage: 100, max_ai_requests: 2000, video_enabled: true, billing_enabled: true, api_enabled: false, support_level: "priority" },
    features: ["Hasta 5 abogados", "Procesos ilimitados", "CRM Pro Automatizado", "Multi Agenda", "IA Pro Jurisprudencia", "Conferencias HD Grabables", "Inteligencia Financiera"],
  },
  {
    _id: "plan-consolidacion",
    slug: "consolidacion-empresarial",
    name: "Consolidación Empresarial",
    priceUsd: 525, // 2.100.000 COP
    status: "ACTIVO",
    orgs: 2,
    limits: { max_users: 10, max_cases: -1, max_storage: 500, max_ai_requests: -1, video_enabled: true, billing_enabled: true, api_enabled: true, support_level: "dedicated" },
    features: ["Hasta 10 abogados", "Procesos ilimitados", "CRM Empresarial", "API Empresarial", "IA Ilimitada", "SLA Garantizado", "Soporte Dedicado"],
  },
];

// ── Catálogo maestro de monedas (tabla `currencies`) ──
// exchange_rate = unidades de moneda local por 1 USD (mock; sin API de tasas aún).
export const CURRENCIES = [
  // Sudamérica
  { id: "cur-ar", country: "Argentina", currency_code: "ARS", currency_name: "Peso argentino", symbol: "$", exchange_rate: 1000, active: true },
  { id: "cur-bo", country: "Bolivia", currency_code: "BOB", currency_name: "Boliviano", symbol: "Bs.", exchange_rate: 6.9, active: true },
  { id: "cur-br", country: "Brasil", currency_code: "BRL", currency_name: "Real brasileño", symbol: "R$", exchange_rate: 5.4, active: true },
  { id: "cur-cl", country: "Chile", currency_code: "CLP", currency_name: "Peso chileno", symbol: "$", exchange_rate: 950, active: true },
  { id: "cur-co", country: "Colombia", currency_code: "COP", currency_name: "Peso colombiano", symbol: "$", exchange_rate: 4000, active: true },
  { id: "cur-ec", country: "Ecuador", currency_code: "USD", currency_name: "Dólar estadounidense", symbol: "$", exchange_rate: 1, active: true },
  { id: "cur-gy", country: "Guyana", currency_code: "GYD", currency_name: "Dólar guyanés", symbol: "$", exchange_rate: 209, active: true },
  { id: "cur-py", country: "Paraguay", currency_code: "PYG", currency_name: "Guaraní", symbol: "₲", exchange_rate: 7300, active: true },
  { id: "cur-pe", country: "Perú", currency_code: "PEN", currency_name: "Sol", symbol: "S/", exchange_rate: 3.75, active: true },
  { id: "cur-sr", country: "Surinam", currency_code: "SRD", currency_name: "Dólar surinamés", symbol: "$", exchange_rate: 38, active: true },
  { id: "cur-uy", country: "Uruguay", currency_code: "UYU", currency_name: "Peso uruguayo", symbol: "$", exchange_rate: 39, active: true },
  { id: "cur-ve", country: "Venezuela", currency_code: "VES", currency_name: "Bolívar", symbol: "Bs.", exchange_rate: 40, active: true },
  // Centroamérica
  { id: "cur-bz", country: "Belice", currency_code: "BZD", currency_name: "Dólar beliceño", symbol: "$", exchange_rate: 2.0, active: true },
  { id: "cur-cr", country: "Costa Rica", currency_code: "CRC", currency_name: "Colón", symbol: "₡", exchange_rate: 510, active: true },
  { id: "cur-sv", country: "El Salvador", currency_code: "USD", currency_name: "Dólar estadounidense", symbol: "$", exchange_rate: 1, active: true },
  { id: "cur-gt", country: "Guatemala", currency_code: "GTQ", currency_name: "Quetzal", symbol: "Q", exchange_rate: 7.8, active: true },
  { id: "cur-hn", country: "Honduras", currency_code: "HNL", currency_name: "Lempira", symbol: "L", exchange_rate: 24.7, active: true },
  { id: "cur-ni", country: "Nicaragua", currency_code: "NIO", currency_name: "Córdoba", symbol: "C$", exchange_rate: 36.8, active: true },
  { id: "cur-pa", country: "Panamá", currency_code: "USD", currency_name: "Dólar estadounidense", symbol: "$", exchange_rate: 1, active: true },
  // Caribe
  { id: "cur-do", country: "República Dominicana", currency_code: "DOP", currency_name: "Peso dominicano", symbol: "RD$", exchange_rate: 60, active: true },
  { id: "cur-pr", country: "Puerto Rico", currency_code: "USD", currency_name: "Dólar estadounidense", symbol: "$", exchange_rate: 1, active: true },
  { id: "cur-jm", country: "Jamaica", currency_code: "JMD", currency_name: "Dólar jamaiquino", symbol: "J$", exchange_rate: 156, active: true },
  { id: "cur-tt", country: "Trinidad y Tobago", currency_code: "TTD", currency_name: "Dólar de Trinidad y Tobago", symbol: "TT$", exchange_rate: 6.8, active: true },
  { id: "cur-bs", country: "Bahamas", currency_code: "BSD", currency_name: "Dólar bahameño", symbol: "$", exchange_rate: 1.0, active: true },
  { id: "cur-bb", country: "Barbados", currency_code: "BBD", currency_name: "Dólar de Barbados", symbol: "$", exchange_rate: 2.0, active: true },
  { id: "cur-aw", country: "Aruba", currency_code: "AWG", currency_name: "Florín arubeño", symbol: "ƒ", exchange_rate: 1.79, active: true },
  { id: "cur-cw", country: "Curazao", currency_code: "ANG", currency_name: "Florín antillano", symbol: "ƒ", exchange_rate: 1.79, active: true },
  { id: "cur-cu", country: "Cuba", currency_code: "CUP", currency_name: "Peso cubano", symbol: "$", exchange_rate: 24, active: true },
  // Europa
  { id: "cur-es", country: "España", currency_code: "EUR", currency_name: "Euro", symbol: "€", exchange_rate: 0.92, active: true },
  // Norteamérica (referenciada en ejemplos de organización)
  { id: "cur-mx", country: "México", currency_code: "MXN", currency_name: "Peso mexicano", symbol: "$", exchange_rate: 17, active: true },
  { id: "cur-us", country: "Estados Unidos", currency_code: "USD", currency_name: "Dólar estadounidense", symbol: "$", exchange_rate: 1, active: true },
];

// País/moneda por defecto del sistema para la vista de planes.
export const DEFAULT_CURRENCY_CODE = "COP";

// ── Ejemplo de configuración regional por organización ──
// (Estructura preparada para usarse luego en el módulo Organizaciones; NO se
//  modifica dicho módulo aquí.) Cada org tendrá: country, currency_code, timezone, language.
export const ORGANIZATION_LOCALE_EXAMPLE = [
  { organization: "Punto Cero Legal Colombia", country: "Colombia", currency_code: "COP", timezone: "America/Bogota", language: "es" },
  { organization: "Punto Cero Legal España", country: "España", currency_code: "EUR", timezone: "Europe/Madrid", language: "es" },
  { organization: "Punto Cero Medicina México", country: "México", currency_code: "MXN", timezone: "America/Mexico_City", language: "es" },
];

// ── KPIs / analítica (la UI recalcula en vivo en la moneda seleccionada) ──
export const KPIS = {
  activePlans: 4,
  totalOrgs: 22,
  monthlyRevenueUsd: 2233.125,
  annualRevenueUsd: 26797.5,
  growth: 14.2,
};

export const OPERATIONS = {
  activePlans: 4,
  inactivePlans: 0,
  topPlanOrgs: 9,
  enterpriseOrgs: 2,
};

export const REVENUE_BY_PLAN = PLANS.map((p) => ({ label: p.name.split(" ").slice(-1)[0], value: Math.round(p.priceUsd * p.orgs) }));
export const ORGS_BY_PLAN = PLANS.map((p) => ({ label: p.name.split(" ").slice(-1)[0], value: p.orgs }));
