import React, { useState } from "react";
import { Copy, Check, MessageCircle, Facebook, Linkedin, Send, Mail, Twitter } from "lucide-react";
import { buildLink, buildQrUrl, shareTargets } from "@/core/commerce/referralsEngine";

/**
 * Tarjeta de compartición de referido: código + link + QR únicos,
 * copiar y compartir en WhatsApp/Facebook/LinkedIn/Telegram/X/Email.
 */
export function ReferralShareCard({ code }) {
  const link = buildLink(code);
  const qr = buildQrUrl(link);
  const targets = shareTargets(link, "Te invito a Punto Cero — gestiona tu firma con IA");
  const [copied, setCopied] = useState(null);

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const SHARE = [
    { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "#25d366", url: targets.whatsapp },
    { key: "facebook", icon: Facebook, label: "Facebook", color: "#1877f2", url: targets.facebook },
    { key: "linkedin", icon: Linkedin, label: "LinkedIn", color: "#0a66c2", url: targets.linkedin },
    { key: "telegram", icon: Send, label: "Telegram", color: "#229ed9", url: targets.telegram },
    { key: "x", icon: Twitter, label: "X", color: "#ffffff", url: targets.x },
    { key: "email", icon: Mail, label: "Email", color: "#f97316", url: targets.email },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-shrink-0 flex flex-col items-center">
          <img src={qr} alt="QR de referido" width={140} height={140} className="rounded-xl bg-white p-2" />
          <span className="text-[11px] text-white/40 mt-2">Tu QR único</span>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Tu código</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-[#f97316] font-mono">{code}</code>
              <button onClick={() => copy(code, "code")} className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10" title="Copiar código">
                {copied === "code" ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Tu enlace</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 font-mono truncate">{link}</code>
              <button onClick={() => copy(link, "link")} className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10" title="Copiar enlace">
                {copied === "link" ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-white/40">Compartir en</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SHARE.map((s) => (
                <a key={s.key} href={s.url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-xs text-white/80 hover:bg-white/10"
                  data-testid={`share-${s.key}`}>
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} /> {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferralShareCard;
