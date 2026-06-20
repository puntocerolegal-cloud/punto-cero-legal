import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "@/config/api";
import { X, Send, MessageCircle, Bot } from "lucide-react";

/**
 * Capa VISUAL del chatbot existente de Punto Cero. NO implementa lógica nueva:
 * reutiliza los endpoints del backend ya construidos:
 *   - GET  /api/chatbot/session/{case_id}  → historial real de la conversación
 *   - POST /api/chatbot/simulate           → envía el mensaje del cliente y obtiene la respuesta del bot
 *
 * Se abre automáticamente tras enviar un formulario de la landing para que el
 * flujo no quede como un "formulario muerto".
 *  - Cliente (case_id real) → conversación interactiva contra el backend.
 *  - Abogado (sin sesión backend) → muestra la confirmación del backend + WhatsApp.
 */
export function ChatWidget({ session, onClose }) {
  const { open, caseId, caseNumber, kind, message } = session || {};
  const interactive = kind === "client" && !!caseId;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  // Carga el historial real del backend al abrir (solo cliente con case_id).
  useEffect(() => {
    if (!open) return undefined;
    if (interactive) {
      let alive = true;
      axios
        .get(`${API}/chatbot/session/${caseId}`)
        .then((r) => {
          if (!alive) return;
          const hist = r.data?.session?.history || [];
          if (hist.length) {
            setMessages(hist.map((h) => ({ role: h.role === "bot" ? "bot" : "user", text: h.text })));
          } else {
            setMessages([{ role: "bot", text: message || "Hola, soy el asistente legal de Punto Cero. Hemos recibido tu caso y un especialista lo revisará en breve." }]);
          }
        })
        .catch(() => setMessages([{ role: "bot", text: message || "Hola, hemos recibido tu caso. Un especialista lo revisará en breve." }]));
      return () => { alive = false; };
    }
    // Abogado: sin sesión conversacional en backend → confirmación devuelta por el backend.
    setMessages([{ role: "bot", text: message || "¡Gracias! Hemos recibido tu solicitud. Nuestro equipo comercial te contactará en breve." }]);
    return undefined;
  }, [open, interactive, caseId, message]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    if (!interactive) return; // abogado: no hay backend conversacional
    setSending(true);
    try {
      const r = await axios.post(`${API}/chatbot/simulate`, { case_id: caseId, message: text });
      const reply = r.data?.reply;
      if (reply) setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Gracias. Continuaremos tu atención por WhatsApp en breve." }]);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[80] w-full sm:w-[380px] max-w-full">
      <div className="m-3 sm:m-0 rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "75vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#f97316] to-[#fb923c]">
          <div className="flex items-center gap-2 text-white">
            <Bot className="w-5 h-5" />
            <div>
              <div className="text-sm font-bold leading-none">Asistente Punto Cero</div>
              {caseNumber && <div className="text-[10px] text-white/80 mt-0.5">Consulta {caseNumber}</div>}
            </div>
          </div>
          <button onClick={onClose} className="text-white/90 hover:text-white" aria-label="Cerrar chat" data-testid="chat-widget-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0f172a]" style={{ minHeight: 160 }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-[#3b82f6] text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {sending && <div className="text-[11px] text-white/40 px-1">Escribiendo…</div>}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10 bg-[#0f172a]">
          {interactive ? (
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Escribe tu respuesta…"
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f97316]"
                data-testid="chat-widget-input"
              />
              <button onClick={send} disabled={sending} className="w-10 h-10 rounded-xl bg-[#f97316] flex items-center justify-center text-white disabled:opacity-50" data-testid="chat-widget-send">
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a href="https://wa.me/573028322083" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-semibold">
              <MessageCircle className="w-4 h-4" /> Continuar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatWidget;
