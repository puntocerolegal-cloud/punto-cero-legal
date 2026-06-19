// Datos de demostración del módulo Permisos (motor de control de acceso) — Punto Cero System OS.
// SOLO UI: sin backend. Sustituible por endpoints reales con ENABLE_PERMISSIONS_API.
import { ROLES as ROLE_DEFS } from "@/modules/roles/mockData";

// Módulos configurables.
export const PERMISSION_MODULES = [
  { key: "USUARIOS", label: "Usuarios" },
  { key: "ROLES", label: "Roles" },
  { key: "PERMISOS", label: "Permisos" },
  { key: "ORGANIZACIONES", label: "Organizaciones" },
  { key: "SOCIOS", label: "Socios" },
  { key: "IMPLEMENTACIONES", label: "Implementaciones" },
  { key: "SUSCRIPCIONES", label: "Suscripciones" },
  { key: "ANALYTICS", label: "Analytics" },
  { key: "VERTICALES", label: "Verticales" },
  { key: "FACTURACION", label: "Facturación" },
  { key: "CONFIGURACION", label: "Configuración" },
  { key: "SEGURIDAD", label: "Seguridad" },
];

// Tipos de permiso.
export const PERMISSION_TYPES = ["VER", "CREAR", "EDITAR", "ELIMINAR", "ADMINISTRAR"];

// Roles (columnas de la matriz) — reutiliza la definición del módulo Roles.
export const PERMISSION_ROLES = ROLE_DEFS.map((r) => ({ key: r.key, name: r.name }));

// ── Reglas por rol para sembrar la matriz por defecto ──
const COMMERCIAL = ["SOCIOS", "IMPLEMENTACIONES", "SUSCRIPCIONES", "ANALYTICS", "VERTICALES", "ORGANIZACIONES", "FACTURACION"];
const ORG_WRITE = ["USUARIOS", "ANALYTICS", "FACTURACION", "SUSCRIPCIONES"];
const GERENTE_VIEW = ["USUARIOS", "ANALYTICS", "FACTURACION", "ORGANIZACIONES", "IMPLEMENTACIONES"];

function allowed(roleKey, moduleKey, type) {
  switch (roleKey) {
    case "SUPER_ADMIN":
    case "ADMIN_GENERAL":
      return true;
    case "SOCIO_COMERCIAL":
      if (!COMMERCIAL.includes(moduleKey)) return false;
      return ["VER", "CREAR", "EDITAR"].includes(type);
    case "ADMIN_ORGANIZACION":
      if (ORG_WRITE.includes(moduleKey)) return ["VER", "CREAR", "EDITAR"].includes(type);
      return type === "VER";
    case "GERENTE":
      if (moduleKey === "USUARIOS") return ["VER", "EDITAR"].includes(type);
      if (GERENTE_VIEW.includes(moduleKey)) return type === "VER";
      return false;
    case "ABOGADO":
    case "ASISTENTE":
      return moduleKey === "ANALYTICS" && type === "VER";
    case "CLIENTE":
    default:
      return false;
  }
}

// Matriz por defecto: MATRIX[type][moduleKey][roleKey] = boolean.
export function buildDefaultMatrix() {
  const matrix = {};
  PERMISSION_TYPES.forEach((type) => {
    matrix[type] = {};
    PERMISSION_MODULES.forEach((m) => {
      matrix[type][m.key] = {};
      PERMISSION_ROLES.forEach((r) => {
        matrix[type][m.key][r.key] = allowed(r.key, m.key, type);
      });
    });
  });
  return matrix;
}

export const MATRIX = buildDefaultMatrix();

// ── Métricas derivadas del matrix por defecto ──
function countActive(matrix) {
  let active = 0;
  PERMISSION_TYPES.forEach((t) =>
    PERMISSION_MODULES.forEach((m) =>
      PERMISSION_ROLES.forEach((r) => { if (matrix[t][m.key][r.key]) active += 1; })
    )
  );
  return active;
}

const TOTAL = PERMISSION_TYPES.length * PERMISSION_MODULES.length * PERMISSION_ROLES.length;
const ACTIVE = countActive(MATRIX);

export const KPIS = {
  totalPermissions: TOTAL,
  activePermissions: ACTIVE,
  configuredRoles: PERMISSION_ROLES.length,
  securityCoverage: Math.round((ACTIVE / TOTAL) * 100),
};

export const OPERATIONS = {
  configuredRoles: PERMISSION_ROLES.length,
  coveredModules: PERMISSION_MODULES.length,
  adminPermissions: PERMISSION_MODULES.length * PERMISSION_ROLES.filter((r) => ["SUPER_ADMIN", "ADMIN_GENERAL"].includes(r.key)).length,
  rolesWithoutAccess: PERMISSION_ROLES.filter((r) => r.key === "CLIENTE").length,
};

// Permisos activos por rol (suma sobre tipos × módulos).
export const PERMISSIONS_BY_ROLE = PERMISSION_ROLES.map((r) => {
  let v = 0;
  PERMISSION_TYPES.forEach((t) => PERMISSION_MODULES.forEach((m) => { if (MATRIX[t][m.key][r.key]) v += 1; }));
  return { label: r.name, value: v };
});

// Cobertura por módulo (% de celdas activas sobre tipos × roles).
export const COVERAGE_BY_MODULE = PERMISSION_MODULES.map((m) => {
  let v = 0;
  PERMISSION_TYPES.forEach((t) => PERMISSION_ROLES.forEach((r) => { if (MATRIX[t][m.key][r.key]) v += 1; }));
  return { label: m.label, value: Math.round((v / (PERMISSION_TYPES.length * PERMISSION_ROLES.length)) * 100) };
});
