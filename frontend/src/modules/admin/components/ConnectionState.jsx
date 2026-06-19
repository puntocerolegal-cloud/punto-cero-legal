import React from "react";
import { Loader2, PlugZap, Inbox } from "lucide-react";

/**
 * ConnectionState — manejadores de estado para módulos conectados a backend.
 *  - loading        → "Cargando…"
 *  - error          → "Error de conexión" + diagnóstico (Auth/CORS) para depurar
 *  - empty          → "Estado Cero": Sistema en espera (sin datos aún)
 * Si ninguno aplica, no renderiza nada (la página muestra sus datos reales).
 *
 * Devuelve `null` cuando el estado es "ok" para permitir: `return <ConnectionState/> || contenido`.
 * En la práctica los dashboards hacen un early-return cuando hay estado.
 */
export function ConnectionState({ loading, error, empty, title = "Módulo" }) {
  if (loading) {
    return (
      <Wrapper>
        <Loader2 className="w-7 h-7 text-[#06b6d4] animate-spin" />
        <h3 className="mt-4 text-lg font-bold text-white">Cargando {title}…</h3>
        <p className="mt-1 text-sm text-white/50">Conectando con el backend (MongoDB).</p>
      </Wrapper>
    );
  }

  if (error) {
    const status = error?.response?.status;
    const diag =
      status === 401 ? "Auth: token ausente o inválido (inicia sesión como admin)."
      : status === 400 ? "Falta cabecera de tenant (X-Tenant-ID)."
      : status === 403 ? "Auth: rol sin permiso o tenant no autorizado."
      : status ? `HTTP ${status}.`
      : "Posible CORS o backend no disponible (puerto 8000).";
    return (
      <Wrapper tone="#ef4444">
        <PlugZap className="w-7 h-7 text-[#ef4444]" />
        <h3 className="mt-4 text-lg font-bold text-white">Error de conexión · {title}</h3>
        <p className="mt-1 text-sm text-white/50">{diag}</p>
        <p className="mt-1 text-[11px] text-white/30">{error?.message || "Sin detalle"}</p>
      </Wrapper>
    );
  }

  if (empty) {
    return (
      <Wrapper>
        <Inbox className="w-7 h-7 text-white/40" />
        <h3 className="mt-4 text-lg font-bold text-white">Sistema en espera</h3>
        <p className="mt-1 text-sm text-white/50">Sin datos aún. Listo para recibir información de {title}.</p>
      </Wrapper>
    );
  }

  return null;
}

function Wrapper({ children, tone }) {
  return (
    <div
      className="min-h-[45vh] flex flex-col items-center justify-center text-center rounded-2xl border bg-white/[0.03] p-10"
      style={{ borderColor: tone ? `${tone}40` : "rgba(255,255,255,0.1)" }}
    >
      {children}
    </div>
  );
}

export default ConnectionState;
