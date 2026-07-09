import React from "react";
import { MessageCircle, FolderKanban, Users, BookOpen, Building2 } from "lucide-react";

// NOTA: El Centro de Comunicación aún no tiene backend de mensajería real
// (sin API, sin WebSockets). Para no mostrar elementos interactivos que no
// hacen nada, el módulo se presenta claramente como "En desarrollo".
// Los canales previstos se muestran de forma informativa (no interactiva).
const PLANNED_CHANNELS = [
  { label: "Por Caso", icon: FolderKanban, color: "text-cyan-400" },
  { label: "Por Cliente", icon: Users, color: "text-purple-400" },
  { label: "Por Abogado", icon: BookOpen, color: "text-amber-400" },
  { label: "Por Departamento", icon: Building2, color: "text-emerald-400" },
  { label: "Anuncios Generales", icon: MessageCircle, color: "text-red-400" },
];

export function CommunicationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Centro de Comunicación Empresarial</h1>
        <p className="text-white/60 mt-2">Conversaciones organizadas por contexto: casos, clientes, abogados, departamentos y anuncios</p>
      </div>

      {/* Estado del módulo: En desarrollo */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <MessageCircle className="h-8 w-8 text-white/30" />
        </div>
        <span className="mt-6 inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
          En desarrollo
        </span>
        <h2 className="mt-4 text-xl font-semibold text-white">Módulo en construcción</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/50">
          La mensajería empresarial aún no está disponible. Esta sección se habilitará
          cuando la funcionalidad de comunicación esté implementada.
        </p>

        {/* Canales previstos (informativo, no interactivo) */}
        <div className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {PLANNED_CHANNELS.map((ch) => (
            <div
              key={ch.label}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/50"
            >
              <ch.icon className={`h-4 w-4 ${ch.color}`} />
              {ch.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommunicationPage;
