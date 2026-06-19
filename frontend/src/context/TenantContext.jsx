import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { readTenant, writeTenant } from "@/security/tenantStorage";
import { eventBus, OS_EVENTS } from "@/core/events/eventBus";
import { auditService } from "@/security/audit/auditService";

/**
 * TenantContext / TenantProvider — Punto Cero OS.
 * Mantiene el tenant activo (organización) con persistencia en localStorage.
 * Las cabeceras X-Tenant-ID / X-Organization-ID las lee el apiClient del mismo
 * almacenamiento, garantizando aislamiento por organización.
 */
const TenantContext = createContext(null);

// Tenant de demostración por defecto (mientras no haya backend / selección real).
const DEFAULT_TENANT = {
  tenantId: "demo",
  organizationId: "demo",
  tenantName: "Organización Demo",
  vertical: "Jurídico",
  plan: "Professional",
  organization: null,
};

export function TenantProvider({ children }) {
  const [tenant, setTenantState] = useState(() => readTenant() || DEFAULT_TENANT);

  const setTenant = useCallback((next) => {
    setTenantState(next);
    writeTenant(next);
    eventBus.emit(OS_EVENTS.tenantChanged, next);
    auditService.logTenantChange("—", next?.tenantName || next?.tenantId || "—");
  }, []);

  const changeTenant = useCallback((next) => {
    // Cambia de organización aislando el contexto previo.
    setTenant(next);
  }, [setTenant]);

  const clearTenant = useCallback(() => {
    setTenantState(null);
    writeTenant(null);
    eventBus.emit(OS_EVENTS.tenantChanged, null);
  }, []);

  const value = useMemo(
    () => ({
      tenantId: tenant?.tenantId || null,
      tenantName: tenant?.tenantName || null,
      vertical: tenant?.vertical || null,
      plan: tenant?.plan || null,
      organization: tenant?.organization || null,
      tenant,
      setTenant,
      changeTenant,
      clearTenant,
    }),
    [tenant, setTenant, changeTenant, clearTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant debe usarse dentro de <TenantProvider>");
  return ctx;
}

export default TenantProvider;
