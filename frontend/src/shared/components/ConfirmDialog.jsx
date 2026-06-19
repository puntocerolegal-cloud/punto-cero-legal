import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Diálogo de confirmación reutilizable — Punto Cero OS.
 * Controlado: props open, onConfirm, onCancel.
 * Patrón de overlay/animación consistente con el resto de la app.
 */
export function ConfirmDialog({
  open,
  title = "¿Confirmar acción?",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger", // danger | default
  onConfirm,
  onCancel,
  loading = false,
}) {
  const confirmCls =
    tone === "danger"
      ? "bg-[#ef4444] hover:bg-[#dc2626]"
      : "bg-gradient-to-r from-[#f97316] to-[#fb923c]";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md bg-[#0f172a] border border-white/15 rounded-2xl shadow-2xl p-6"
            role="alertdialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-3">
              {tone === "danger" && (
                <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">{title}</h3>
                {description && <p className="text-sm text-white/60 mt-1">{description}</p>}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-sm font-semibold disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn("px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50", confirmCls)}
                data-testid="confirm-dialog-accept"
              >
                {loading ? "Procesando..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
