import React, { useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { answer, QUICK_PROMPTS } from "@/core/commerce/commercialAI";
import { useEntitlement } from "@/hooks/useEntitlement";

/**
 * Asistente de IA Comercial (reutilizable). Responde dudas de planes, límites,
 * trial, demo, pagos y referidos. SIN contacto humano ni formularios de venta.
 * Usa useEntitlement para conocer el plan/estado actual y ofrecer el upgrade.
 */
export function CommercialAssistant({ compact = false }) {
  const { status, plan, openUpgrade } = useEntitlement();
  const [messages, setMessages] = useState([
    { from: "ai", text: `Hola 👋 Soy tu asistente comercial. Tu estado actual es ${status}${plan ? ` (plan ${plan.name})` : ""}. Pregúntame por planes, límites, trial, demo, pagos o referidos.` },
  ]);
  const [draft, setDraft] = useState("");

  const ask = (q) => {
    const question = (q ?? draft).trim();
    if (!question) return;
    setMessages((m) => [...m, { from: "user", text: question }, { from: "ai", text: answer(question) }]);
    setDraft("");
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col ${compact ? "h-80" : "h-[28rem]"}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">Asistente Comercial IA</div>
          <div className="text-[10px] text-white/40">Respuestas automáticas · sin contacto humano</div>
        </div>
        <button onClick={() => openUpgrade({ reason: "plan" })}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#f97316]/40 bg-[#f97316]/10 text-[#fdba74] hover:bg-[#f97316]/20"
          data-testid="assistant-upgrade">
          <Sparkles className="w-3 h-3" /> Ver planes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "user" ? "bg-[#f97316]/20 text-white" : "bg-white/[0.05] text-white/80 border border-white/10"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pt-2 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((p) => (
          <button key={p} onClick={() => ask(p)} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10">{p}</button>
        ))}
      </div>

      <div className="p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Escribe tu pregunta…"
          className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#f97316]/50"
          data-testid="assistant-input"
        />
        <button onClick={() => ask()} className="px-3 rounded-xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white" data-testid="assistant-send">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CommercialAssistant;
