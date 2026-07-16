import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { trackEvent } from "../lib/analytics";

/**
 * Asesor Inteligente de Admisión — Punto Cero Legal (Landing).
 * Flujo conversacional guiado hacia el registro/creación de firma.
 * Estado 100% en cliente (state machine); cada rama entrega planes SOLO del perfil
 * correspondiente y termina siempre en una acción concreta (CTA).
 */

// Cada nodo: mensajes del bot, opciones (que llevan a otro nodo) y/o CTAs finales.
const NODES = {
  start: {
    bot: [
      "👋 ¡Bienvenido a Punto Cero Legal!",
      "Nos alegra tenerte aquí. Miles de profesionales buscan cada día una forma más eficiente de gestionar su ejercicio jurídico y hacer crecer su práctica.",
      "Estoy aquí para ayudarte a descubrir cómo Punto Cero Legal puede adaptarse a tus necesidades. Solo necesitaré un minuto para orientarte.",
      "Cuéntame... ¿Quién eres?",
    ],
    options: [
      { label: "⚖️ Soy abogado independiente", next: "lawyer" },
      { label: "🏢 Represento una firma jurídica", next: "firm" },
      { label: "📚 Solo quiero conocer la plataforma", next: "platform" },
      { label: "💬 Tengo otra consulta", next: "other" },
    ],
  },

  // ── FLUJO 1: ABOGADO INDEPENDIENTE ──
  lawyer: {
    bot: [
      "Excelente. Cada abogado tiene una forma distinta de ejercer su profesión.",
      "Por eso nuestra plataforma se adapta a tu forma de trabajar y te ayuda a organizar toda tu operación desde un solo lugar.",
      "¿Qué te gustaría lograr?",
    ],
    options: [
      { label: "Organizar mejor mis casos", next: "lawyer_benefit" },
      { label: "Ahorrar tiempo", next: "lawyer_benefit" },
      { label: "Tener todo en un solo lugar", next: "lawyer_benefit" },
      { label: "Conocer los planes", next: "lawyer_plans" },
    ],
  },
  lawyer_benefit: {
    bot: [
      "Perfecto. Punto Cero Legal centraliza tus casos, clientes, agenda y documentos, y suma Inteligencia Jurídica para que ganes tiempo y control.",
      "Cuando quieras, puedes crear tu cuenta y empezar hoy mismo.",
    ],
    options: [{ label: "Ver los planes para abogados", next: "lawyer_plans" }],
    cta: [
      { label: "Crear mi cuenta", to: "/register", event: "begin_registration" },
      { label: "Ya tengo cuenta · Iniciar sesión", to: "/login" },
    ],
  },
  lawyer_plans: {
    bot: [
      "Para abogados independientes tenemos dos planes:",
      "🚀 EL DESPEGUE — Ideal para abogados que desean comenzar su transformación digital.",
      "📈 EL SALTO ESTRATÉGICO — Pensado para quienes buscan automatizar procesos y aumentar su productividad.",
      "¿Te gustaría conocer cuál de estos planes se adapta mejor a tu práctica?",
    ],
    cta: [
      { label: "Sí, crear mi cuenta", to: "/register", event: "begin_registration" },
      { label: "Iniciar sesión", to: "/login" },
    ],
  },

  // ── FLUJO 2: FIRMA JURÍDICA ──
  firm: {
    bot: [
      "Excelente decisión. Firm OS fue diseñado para que una firma jurídica administre su operación completa desde una sola plataforma.",
      "Podrás gestionar abogados, clientes, expedientes, documentos, agenda y mucho más.",
      "¿En qué etapa se encuentra actualmente tu firma?",
    ],
    options: [
      { label: "Estoy creando una firma", next: "firm_plans" },
      { label: "Ya tengo una firma pequeña", next: "firm_plans" },
      { label: "Mi firma está creciendo", next: "firm_plans" },
      { label: "Solo quiero conocer la plataforma", next: "platform" },
    ],
  },
  firm_plans: {
    bot: [
      "Para firmas jurídicas tenemos dos planes empresariales:",
      "🏢 FIRMA EN CRECIMIENTO — Ideal para despachos que desean organizar y centralizar su operación.",
      "🏛️ CONSOLIDACIÓN EMPRESARIAL — Pensado para firmas que necesitan escalar su operación con mayor capacidad y control.",
      "¿Te gustaría comenzar la creación de tu firma o prefieres conocer primero todas sus funcionalidades?",
    ],
    cta: [
      { label: "Comenzar la creación de mi firma", to: "/crear-firma", event: "begin_registration" },
      { label: "Conocer las funcionalidades", next: "platform" },
    ],
  },

  // ── FLUJO 3: CONOCER LA PLATAFORMA ──
  platform: {
    bot: [
      "Perfecto. Punto Cero Legal reúne en una sola plataforma herramientas para abogados independientes y firmas jurídicas:",
      "✔ Gestión de clientes\n✔ Expedientes\n✔ Agenda\n✔ Documentos\n✔ Facturación\n✔ Inteligencia Jurídica\n✔ Trabajo colaborativo\n✔ Administración empresarial",
      "¿Qué te gustaría conocer primero?",
    ],
    options: [
      { label: "Soluciones para abogados", next: "lawyer_plans" },
      { label: "Soluciones para firmas", next: "firm_plans" },
    ],
    cta: [{ label: "Crear mi cuenta", to: "/register", event: "begin_registration" }],
  },

  // ── FLUJO 4: OTRA CONSULTA ──
  other: {
    bot: [
      "Con gusto. Cuéntame tu consulta y te oriento sobre cómo Punto Cero Legal puede ayudarte.",
    ],
    freeText: true,
    cta: [
      { label: "Ver soluciones para abogados", next: "lawyer_plans" },
      { label: "Ver soluciones para firmas", next: "firm_plans" },
    ],
  },
};

const IDLE_HINTS = [
  "Estoy aquí para ayudarte.",
  "Podemos encontrar la mejor opción para ti.",
  "Cada firma y cada abogado tienen necesidades diferentes.",
  "Te ayudaré a encontrar la solución adecuada.",
];

export function AdmissionChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [node, setNode] = useState(null);
  const [freeText, setFreeText] = useState("");
  const scrollRef = useRef(null);
  const idleRef = useRef(null);
  const hintIdx = useRef(0);

  const pushBot = (texts) => setMessages((m) => [...m, ...texts.map((t) => ({ from: "bot", text: t }))]);

  const goTo = (key) => {
    const n = NODES[key];
    if (!n) return;
    setNode(key);
    pushBot(n.bot || []);
  };

  const openChat = () => {
    setOpen(true);
    if (messages.length === 0) goTo("start");
    try { trackEvent("chatbot_open", { source: "landing" }); } catch (e) {}
  };

  const chooseOption = (opt) => {
    setMessages((m) => [...m, { from: "user", text: opt.label }]);
    if (opt.next) setTimeout(() => goTo(opt.next), 250);
  };

  const doCta = (c) => {
    if (c.event) { try { trackEvent(c.event, { source: "landing_chatbot" }); } catch (e) {} }
    if (c.to) navigate(c.to);
    else if (c.next) { setMessages((m) => [...m, { from: "user", text: c.label }]); setTimeout(() => goTo(c.next), 250); }
  };

  const sendFree = () => {
    if (!freeText.trim()) return;
    setMessages((m) => [...m, { from: "user", text: freeText.trim() }]);
    setFreeText("");
    setTimeout(() => pushBot(["Gracias por tu mensaje. Para darte la mejor orientación, ¿prefieres soluciones para abogados o para firmas?"]), 300);
  };

  // Autoscroll
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, open]);

  // Microinteracciones: pista amable tras inactividad (no invasiva, máx pocas veces)
  useEffect(() => {
    if (!open) return;
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      if (hintIdx.current < IDLE_HINTS.length) {
        pushBot([IDLE_HINTS[hintIdx.current]]);
        hintIdx.current += 1;
      }
    }, 18000);
    return () => clearTimeout(idleRef.current);
  }, [messages, open]);

  const current = node ? NODES[node] : null;

  return (
    <>
      {/* Lanzador flotante (abajo-izquierda para no chocar con WhatsApp) */}
      {!open && (
        <motion.button
          onClick={openChat}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.4, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
          data-testid="admission-chatbot-launcher"
          className="fixed bottom-5 left-5 z-50 flex items-center gap-3 pl-4 pr-5 py-3 rounded-full bg-gradient-to-br from-[#f97316] to-[#fb923c] text-white shadow-[0_10px_30px_rgba(249,115,22,0.5)] hover:shadow-[0_16px_48px_rgba(249,115,22,0.8)] transition-shadow"
        >
          <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/15">
            <Sparkles className="w-5 h-5" />
            <span className="absolute -inset-1 rounded-full animate-ping bg-[#f97316]/25 pointer-events-none" />
          </span>
          <span className="text-base font-bold leading-tight whitespace-nowrap">Asesor Punto Cero</span>
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.96 }}
            data-testid="admission-chatbot-panel"
            className="fixed bottom-5 left-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] flex flex-col rounded-2xl bg-[#0f172a] border border-white/15 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#f97316] to-[#fb923c]">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                <div className="leading-tight">
                  <p className="font-bold text-sm">Asesor de Admisión</p>
                  <p className="text-[11px] text-white/80">Punto Cero Legal</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white" aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>

            {/* Mensajes */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.from === "user" ? "bg-[#f97316] text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Opciones / CTAs */}
            <div className="p-3 border-t border-white/10 space-y-2 bg-white/[0.02]">
              {current?.options?.map((o, i) => (
                <button key={`o${i}`} onClick={() => chooseOption(o)} className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm border border-white/10">
                  {o.label}
                </button>
              ))}
              {current?.cta?.map((c, i) => (
                <button key={`c${i}`} onClick={() => doCta(c)} className="w-full px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-sm font-bold hover:opacity-90">
                  {c.label}
                </button>
              ))}
              {current?.freeText && (
                <div className="flex items-center gap-2">
                  <input value={freeText} onChange={(e) => setFreeText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendFree()}
                    placeholder="Escribe tu consulta…" className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40" />
                  <button onClick={sendFree} className="p-2 rounded-lg bg-[#f97316] text-white"><Send className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AdmissionChatbot;
