import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageCircle, Scale, Briefcase, IdCard, Globe, Phone, BadgeCheck } from "lucide-react";

/**
 * SalesCandidateDrawer — ficha premium de un candidato/socio (Sala de Ventas).
 * Panel lateral dentro del System OS (sin cambiar de entorno). Consume el objeto
 * `candidate` cargado desde /admin-ops/sales/candidates (datos reales de Mongo).
 */
const withDr = (name) => {
  if (!name) return "—";
  const n = String(name).trim();
  return /^dr\.?\s|^dra\.?\s/i.test(n) ? n : `Dr. ${n}`;
};

const STATUS = {
  ACTIVE: { label: "Activo", cls: "bg-[#10b981]/15 text-[#6ee7b7]" },
  PENDING_VERIFICATION: { label: "Pendiente verif.", cls: "bg-[#f59e0b]/15 text-[#fcd34d]" },
  PENDING_PAYMENT: { label: "Pendiente pago", cls: "bg-[#f59e0b]/15 text-[#fcd34d]" },
  REJECTED: { label: "Rechazado", cls: "bg-[#ef4444]/15 text-[#fca5a5]" },
  suspended: { label: "Suspendido", cls: "bg-[#ef4444]/15 text-[#fca5a5]" },
};

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

export function SalesCandidateDrawer({ candidate, onClose }) {
  const c = candidate || {};
  const st = STATUS[c.status] || { label: c.status || "—", cls: "bg-white/10 text-white/60" };
  const waLink = c.phone ? `https://wa.me/${String(c.phone).replace(/\D/g, "")}` : null;

  return (
    <AnimatePresence>
      {candidate && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-xl z-50 bg-[#0a0e1a] border-l border-white/10 overflow-y-auto"
            data-testid="sales-candidate-drawer"
          >
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#0a0e1a]/80 border-b border-white/10 px-6 py-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(withDr(c.full_name) || "Dr").replace(/^Dr\.\s?/i, "").split(" ").map((x) => x[0]).slice(0, 2).join("") || "DR"}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{withDr(c.full_name)}</h2>
                  <div className="text-xs text-white/40 truncate">{c.email}</div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60" data-testid="sales-candidate-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${st.cls}`}>{st.label}</span></div>

              <section className="grid grid-cols-2 gap-4">
                <Field icon={Scale} label="Especialidad" value={c.specialty} />
                <Field icon={Briefcase} label="Experiencia" value={c.experience_years ? `${c.experience_years} años` : "—"} />
                <Field icon={IdCard} label="Tarjeta profesional" value={c.bar_number} mono />
                <Field icon={IdCard} label="Cédula" value={c.id_document} mono />
                <Field icon={Briefcase} label="Firma / Bufete" value={c.firm_name} />
                <Field icon={Globe} label="País" value={c.country} />
                <Field icon={Phone} label="Teléfono" value={c.phone} mono />
                <Field icon={BadgeCheck} label="Verificado" value={c.is_verified ? "Sí" : "No"} />
              </section>

              {c.description && (
                <section>
                  <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Descripción profesional</div>
                  <div className="text-sm text-white/80 bg-white/[0.03] border border-white/10 rounded-xl p-3 leading-relaxed">{c.description}</div>
                </section>
              )}

              {(waLink || c.email) && (
                <section className="flex gap-2">
                  {waLink && (
                    <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white text-xs font-bold inline-flex items-center justify-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Email
                    </a>
                  )}
                </section>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default SalesCandidateDrawer;
