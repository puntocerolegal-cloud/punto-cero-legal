// Registro central de módulos — Punto Cero System Core.
// Única fuente de verdad para la navegación del System OS y el mapa de features
// de las verticales. Centraliza: ruta, icono, flag de datos (mock↔backend) y
// requisito de plan/feature (entitlement). El Sidebar y los gates lo consumen.
//
// Decisión de arquitectura: los módulos administrativos del OS están protegidos
// por ROL (ProtectedRoute), no por plan → `requiredFeature: null` (siempre
// visibles para un admin). El requisito de plan aplica a las features de las
// VERTICALES (LEGAL_MODULES), consumidas por FeatureGate/useEntitlement. Así el
// Sidebar filtra por entitlement sin ocultar secciones admin (retrocompatible).
import {
  LayoutDashboard, Building2, Handshake, CreditCard, Receipt, BarChart3,
  Boxes, Rocket, ShieldCheck, Layers, UsersRound, KeyRound, Tag, BadgeCheck,
  Gift, Bell, Bot, Sparkles, Lock, Megaphone, FolderKanban, Globe,
} from "lucide-react";

// ── Grupos del Sidebar (Flujo de Valor) con codificación de color ──
//   operaciones=Cian · negocio=Oro · red=Violeta · sistema=Gris
export const MODULE_GROUPS = [
  { key: "operaciones", label: "Operaciones",   accent: "#06b6d4" },
  { key: "negocio",     label: "Negocio",       accent: "#f59e0b" },
  { key: "red",         label: "Red y Talento", accent: "#8b5cf6" },
  { key: "sistema",     label: "Sistema",       accent: "#64748b" },
];

// ── Módulos del System OS (orden = orden en el Sidebar, agrupado por `group`) ──
// requiredFeature: feature de plan exigida (null = solo rol). group: ver MODULE_GROUPS.
export const MODULE_REGISTRY = [
  // OPERACIONES (Cian)
  { key: "executive",     label: "Dashboard Ejecutivo",   to: "/admin",                     icon: LayoutDashboard, end: true, area: "os", group: "operaciones", requiredFeature: null, flag: null },
  { key: "master",        label: "Control Maestro",       to: "/admin/master",              icon: ShieldCheck,     area: "os", group: "operaciones", requiredFeature: null, flag: null },
  { key: "cases-portal",  label: "Portal de Casos",       to: "/admin/cases-portal",        icon: FolderKanban,    area: "os", group: "operaciones", requiredFeature: null, flag: null },
  { key: "sales-room",    label: "Sala de Ventas",        to: "/admin/sales-room",          icon: Megaphone,       area: "os", group: "operaciones", requiredFeature: null, flag: null },
  { key: "countries",     label: "Segmentación por Países", to: "/admin/countries",         icon: Globe,           area: "os", group: "operaciones", requiredFeature: null, flag: null },
  { key: "analytics",     label: "Analytics Empresarial", to: "/admin/analytics",           icon: BarChart3,       area: "os", group: "operaciones", requiredFeature: null, flag: "ENABLE_ANALYTICS_API" },
  // NEGOCIO (Oro)
  { key: "subscriptions", label: "Suscripciones",         to: "/admin/subscriptions",       icon: CreditCard,      area: "os", group: "negocio", requiredFeature: null, flag: "ENABLE_SUBSCRIPTIONS_API" },
  { key: "plans",         label: "Planes",                to: "/admin/plans",               icon: Tag,             area: "os", group: "negocio", requiredFeature: null, flag: "ENABLE_PLANS_API" },
  { key: "subscription-center", label: "Centro de Suscripción", to: "/admin/subscription-center", icon: BadgeCheck, area: "os", group: "negocio", requiredFeature: null, flag: "ENABLE_SUBSCRIPTION_CENTER_API" },
  { key: "upgrade",       label: "Actualizar Plan",       to: "/admin/upgrade",             icon: Sparkles,        area: "os", group: "negocio", requiredFeature: null, flag: null },
  { key: "billing",       label: "Facturación y Contabilidad", to: "/admin/billing",        icon: Receipt,         area: "os", group: "negocio", requiredFeature: null, flag: "ENABLE_BILLING_API" },
  { key: "commercial-ai", label: "IA Comercial",          to: "/admin/commercial-ai",       icon: Bot,             area: "os", group: "negocio", requiredFeature: null, flag: "ENABLE_COMMERCIAL_AI_API" },
  { key: "notifications", label: "Notificaciones",        to: "/admin/notifications",       icon: Bell,            area: "os", group: "negocio", requiredFeature: null, flag: "ENABLE_NOTIFICATIONS_API" },
  // RED Y TALENTO (Violeta)
  { key: "partners",      label: "Socios Comerciales",    to: "/admin/partners",            icon: Handshake,       area: "os", group: "red", requiredFeature: null, flag: "ENABLE_PARTNERS_API" },
  { key: "organizations", label: "Organizaciones",        to: "/admin/organizations",       icon: Building2,       area: "os", group: "red", requiredFeature: null, flag: "ENABLE_ORGANIZATIONS_API" },
  { key: "users",         label: "Usuarios",              to: "/admin/users",               icon: UsersRound,      area: "os", group: "red", requiredFeature: null, flag: "ENABLE_USERS_API" },
  { key: "referrals",     label: "Referidos",             to: "/admin/referrals",           icon: Gift,            area: "os", group: "red", requiredFeature: null, flag: "ENABLE_REFERRALS_API" },
  { key: "implementations", label: "Implementaciones",    to: "/admin/implementations",     icon: Rocket,          area: "os", group: "red", requiredFeature: null, flag: "ENABLE_IMPLEMENTATIONS_API" },
  { key: "verticals",     label: "Verticales",            to: "/admin/verticals",           icon: Layers,          area: "os", group: "red", requiredFeature: null, flag: "ENABLE_VERTICALS_API" },
  // SISTEMA (Gris)
  { key: "roles",         label: "Roles",                 to: "/admin/roles",               icon: ShieldCheck,     area: "os", group: "sistema", requiredFeature: null, flag: "ENABLE_ROLES_API" },
  { key: "permissions",   label: "Permisos",              to: "/admin/permissions",         icon: KeyRound,        area: "os", group: "sistema", requiredFeature: null, flag: "ENABLE_PERMISSIONS_API" },
  { key: "inventory",     label: "Inventario SaaS",       to: "/admin/inventory",           icon: Boxes,           area: "os", group: "sistema", requiredFeature: null, flag: "ENABLE_INVENTORY_API" },
  // Ruta técnica: protegida por SupportAccessGate (requiere token de soporte).
  { key: "security",      label: "Seguridad",             to: "/admin/security",            icon: ShieldCheck,     area: "os", group: "sistema", requiredFeature: null, flag: null, requiresSupportToken: true },
  // Panel emisor de tokens (NO requiere token: es quien los genera/revoca).
  { key: "support-access", label: "Accesos de Soporte",   to: "/admin/support-access",      icon: Lock,            area: "os", group: "sistema", requiredFeature: null, flag: null },
];

// ── Features de las verticales (consumidas por FeatureGate/useEntitlement) ──
// Centraliza qué feature de plan exige cada módulo de Punto Cero Legal.
export const LEGAL_MODULES = [
  { key: "crm",       to: "/dashboard/crm",       requiredFeature: "crm" },
  { key: "clients",   to: "/dashboard/clients",   requiredFeature: "crm" },
  { key: "cases",     to: "/dashboard/cases",     requiredFeature: "cases" },
  { key: "agenda",    to: "/dashboard/agenda",    requiredFeature: "agenda" },
  { key: "ai",        to: "/dashboard/ai",        requiredFeature: "ai" },
  { key: "documents", to: "/dashboard/documents", requiredFeature: "documents" },
  { key: "invoices",  to: "/dashboard/invoices",  requiredFeature: "billing" },
  { key: "meetings",  to: "/dashboard/meetings",  requiredFeature: "video" },
];

/** Módulos del Sidebar del OS (en orden). */
export function getOsModules() {
  return MODULE_REGISTRY.filter((m) => m.area === "os");
}

/** Busca un módulo por su ruta. */
export function getModuleByPath(path) {
  return [...MODULE_REGISTRY, ...LEGAL_MODULES].find((m) => m.to === path) || null;
}
