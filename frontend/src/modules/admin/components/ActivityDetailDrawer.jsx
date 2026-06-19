import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Mail, MapPin, Scale, User, Phone, Clock } from "lucide-react";

/**
 * ActivityDetailDrawer — detalle premium de una actividad/caso del System OS.
 * Sustituye la navegación al "Panel Legacy": el detalle se despliega como panel
 * lateral dentro del mismo entorno. Consume el objeto `activity` (caso real de
 * MongoDB cargado vía /admin-ops); no cambia de ruta ni de entorno.
 */
const PRIORITY = {
  alta: { label: "Alta", cls: "bg-[#ef4444]/15 text-[#fca5a5] border-[#ef4444]/40" },
  high: { label: "Alta", cls: "bg-[#ef4444]/15 text-[#fca5a5] border-[#ef4444]/40" },
  urgente: { label: "Urgente", cls: "bg-[#ef4444]/15 text-[#fca5a5] border-[#ef4444]/40" },
  media: { label: "Media", cls: "bg-[#f59e0b]/15 text-[#fcd34d] border-[#f59e0b]/40" },
  medium: { label: "Media", cls: "bg-[#f59e0b]/15 text-[#fcd34d] border-[#f59e0b]/40" },
  baja: { label: "Baja", cls: "bg-[#10b981]/15 text-[#6ee7b7] border-[#10b981]/40" },
  low: { label: "Baja", cls: "bg-[#10b981]/15 text-[#6ee7b7] border-[#10b981]/40" },
};
const ASSIGN = {
  sin_asignar: { label: "Sin asignar", cls: "bg-[#ef4444]/15 text-[#fca5a5]" },
  asignado: { label: "Asignado", cls: "bg-[#3b82f6]/15 text-[#93c5fd]" },
  atendido: { label: "Atendido", cls: "bg-[#10b981]/15 text-[#6ee7b7]" },
};
const fmtDate = (d) => (d ? new Date(d).toLocaleString("es-CO") : "—");

function Field({ icon: Icon, label, value, mono }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className={`text-sm ${mono ? "font-mono text-[#f97316]" : "text-white/90"}`}>{value || "—"}</div>
    </div>
  );
}

export function ActivityDetailDrawer({ activity, onClose }) {
  const c = activity || {};
  const prio = PRIORITY[(c.priority_label || c.priority || "media").toLowerCase()] || PRIORITY.media;
  const assign = ASSIGN[c.assignment_status] || ASSIGN.sin_asignar;
  const waLink = c.client_phone
    ? `https://wa.me/${String(c.client_phone).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, le escribo de Punto Cero Legal sobre su caso ${c.case_number || ""}`)}`
    : null;
  const timeline = Array.isArray(c.status_timeline) ? c.status_timeline : [];

  return (
    <AnimatePresence>
      {activity && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-2xl z-50 bg-[#0a0e1a] border-l border-white/10 overflow-y-auto"
            data-testid="activity-detail-drawer"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0e1a]/80 border-b border-white/10 px-6 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${prio.cls}`}>Prioridad {prio.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${assign.cls}`}>{assign.label}</span>
                </div>
                <h2 className="text-lg font-bold text-white truncate">{c.title || `Consulta ${c.legal_area || ""}`}</h2>
                <div className="text-xs font-mono text-white/40">{c.case_number || c.consultation_number || ""}</div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60" data-testid="activity-detail-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Descripción */}
              <section>
                <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Descripción</div>
                <div className="text-sm text-white/80 bg-white/[0.03] border border-white/10 rounded-xl p-3 leading-relaxed">
                  {c.description || "—"}
                </div>
              </section>

              {/* Datos del caso */}
              <section className="grid grid-cols-2 gap-4">
                <Field icon={Scale} label="Área legal" value={c.legal_area} />
                <Field icon={User} label="Cliente" value={c.client_name} />
                <Field icon={Phone} label="Teléfono" value={c.client_phone} mono />
                <Field icon={Mail} label="Email" value={c.client_email} />
                <Field icon={MapPin} label="País / Ciudad" value={[c.client_country, c.client_city].filter(Boolean).join(" · ")} />
                <Field icon={User} label="Abogado" value={c.lawyer_name || "— sin asignar —"} />
                <Field icon={Clock} label="Creado" value={fmtDate(c.created_at)} />
                <Field icon={Clock} label="Actualizado" value={fmtDate(c.updated_at)} />
              </section>

              {/* Contacto rápido */}
              {(waLink || c.client_email) && (
                <section className="flex gap-2">
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white text-xs font-bold inline-flex items-center justify-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp directo
                    </a>
                  )}
                  {c.client_email && (
                    <a href={`mailto:${c.client_email}`} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  )}
                </section>
              )}

              {/* Línea de tiempo del estado */}
              {timeline.length > 0 && (
                <section>
                  <div className="text-xs uppercase tracking-wider text-white/50 mb-3">Línea de tiempo</div>
                  <ul className="space-y-3">
                    {timeline.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${step.done || step.completed ? "bg-[#10b981]" : "bg-white/20"}`} />
                        <div>
                          <div className="text-sm text-white/80">{step.label || step.status || step.name || `Etapa ${i + 1}`}</div>
                          {step.date && <div className="text-[11px] text-white/40">{fmtDate(step.date)}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default ActivityDetailDrawer;
