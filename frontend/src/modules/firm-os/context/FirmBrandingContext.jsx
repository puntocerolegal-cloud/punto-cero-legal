import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * White Label — fuente única de la identidad visual de la firma en Firm OS.
 * Carga /firm-os/settings (datos ya persistidos) y los aplica globalmente:
 *  - Nombre comercial (nunca IDs ni textos genéricos)
 *  - Color primario -> variable CSS --firm-primary
 *  - Favicon + título del documento
 * No toca Lawyer OS / Admin / Portal (sólo se monta dentro de FirmShell).
 */
const FirmBrandingContext = createContext(null);

const DEFAULT_NAME = "Mi Oficina Jurídica";

export function FirmBrandingProvider({ children }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState({
    name: DEFAULT_NAME, legal_name: "", primary_color: "", logo_url: "", avatar_url: "",
    cover_url: "", favicon_url: "", public_name: "", domain: "", loaded: false,
  });

  const authHeaders = () => {
    const t = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const load = useCallback(async () => {
    if (!user?.firm_id) { setBranding((b) => ({ ...b, loaded: true })); return; }
    try {
      const r = await axios.get(`${API}/firm-os/settings`, { headers: authHeaders() });
      const d = r.data?.data || {};
      setBranding({
        name: d.commercial_name || d.legal_name || d.public_name || DEFAULT_NAME,
        legal_name: d.legal_name || "",
        primary_color: d.primary_color || "",
        logo_url: d.logo_url || "",
        avatar_url: d.avatar_url || "",
        cover_url: d.cover_url || "",
        favicon_url: d.favicon_url || "",
        public_name: d.public_name || "",
        domain: d.domain || "",
        loaded: true,
      });
    } catch (e) {
      setBranding((b) => ({ ...b, loaded: true }));
    }
  }, [user?.firm_id]);

  useEffect(() => { load(); }, [load]);

  // Aplica la identidad visual al documento (color, favicon, título).
  useEffect(() => {
    if (!branding.loaded) return;
    if (branding.primary_color) {
      document.documentElement.style.setProperty("--firm-primary", branding.primary_color);
    }
    if (branding.name && branding.name !== DEFAULT_NAME) {
      document.title = `${branding.name} · Firm OS`;
    }
    if (branding.favicon_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.href = branding.favicon_url;
    }
  }, [branding]);

  return (
    <FirmBrandingContext.Provider value={{ ...branding, reloadBranding: load }}>
      {children}
    </FirmBrandingContext.Provider>
  );
}

export function useFirmBranding() {
  const ctx = useContext(FirmBrandingContext);
  return ctx || { name: DEFAULT_NAME, loaded: false, reloadBranding: () => {} };
}

export default FirmBrandingContext;
