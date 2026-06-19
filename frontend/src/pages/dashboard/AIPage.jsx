import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Brain, Send, Sparkles, Gavel, Shield, FileText, Mail, Search, User, Loader2, Copy, RotateCcw, X, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../contexts/AuthContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useCaseContext } from '../../contexts/CaseContext';
import { API } from '@/config/api';

// Sugerencias de upgrade (IAs premium externas) — abren en nueva pestaña
const UPGRADE_LINKS = [
  { name: 'ChatGPT Plus', url: 'https://chat.openai.com/plus', color: '#10a37f' },
  { name: 'Claude Pro', url: 'https://claude.ai/upgrade', color: '#d97757' },
  { name: 'Gemini Advanced', url: 'https://one.google.com/about/plans', color: '#4285f4' },
];

const UPGRADE_DISMISS_KEY = 'pcl_ai_upgrade_dismissed_until';
const UPGRADE_THRESHOLD = 10; // consultas en el mes para sugerir upgrade

const templates = [
  { id: 'general', name: 'Consulta General', description: 'Asistente jurídico general', icon: Brain, color: '#3b82f6' },
  { id: 'demanda', name: 'Redactar Demanda', description: 'Genera demandas completas', icon: Gavel, color: '#ef4444' },
  { id: 'tutela', name: 'Acción de Tutela', description: 'Amparo constitucional', icon: Shield, color: '#f97316' },
  { id: 'contrato', name: 'Redactar Contrato', description: 'Contratos profesionales', icon: FileText, color: '#10b981' },
  { id: 'peticion', name: 'Derecho de Petición', description: 'Solicitudes formales', icon: Mail, color: '#8b5cf6' },
  { id: 'analisis', name: 'Análisis Jurídico', description: 'Análisis de casos', icon: Search, color: '#ec4899' },
];

export const AIPage = () => {
  const { user } = useAuth();
  // Motor de entitlements: límite de consultas IA (Demo = 10).
  const { requirePerform } = useEntitlement();
  // Contexto global: la IA trabaja automáticamente sobre el expediente activo.
  const { active } = useCaseContext();
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpId, setSelectedExpId] = useState(active?.expediente_id || '');
  const [expCtx, setExpCtx] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('general');
  const [sessionId, setSessionId] = useState(null);
  const [usage, setUsage] = useState(null);
  const [forceUpgrade, setForceUpgrade] = useState(false); // por error de límite de Gemini
  const [dismissed, setDismissed] = useState(() => {
    const until = parseInt(localStorage.getItem(UPGRADE_DISMISS_KEY) || '0', 10);
    return Date.now() < until;
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadUsage = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/ai/usage/${user.id}`);
      setUsage(data);
    } catch (e) {
      // Sin datos de uso aún
    }
  }, [user?.id]);

  useEffect(() => { loadUsage(); }, [loadUsage]);

  // Conexión IA → Expediente: lista para el selector + contexto (materia/resumen).
  useEffect(() => {
    if (!user?.id) return;
    axios.get(`${API}/integration/expedientes?lawyer_id=${user.id}`)
      .then(r => setExpedientes(r.data?.expedientes || [])).catch(() => {});
  }, [user?.id]);
  useEffect(() => { if (active?.expediente_id) setSelectedExpId(active.expediente_id); }, [active?.expediente_id]);
  useEffect(() => {
    if (!selectedExpId) { setExpCtx(null); return; }
    axios.get(`${API}/integration/expediente/${selectedExpId}`)
      .then(r => setExpCtx(r.data?.ai_context || null)).catch(() => setExpCtx(null));
  }, [selectedExpId]);

  // Banner de upgrade: tras 10 consultas en el mes o si Gemini reporta límite de tasa
  const showUpgrade = !dismissed && (forceUpgrade || (usage?.used || 0) >= UPGRADE_THRESHOLD);

  const dismissUpgrade = () => {
    localStorage.setItem(UPGRADE_DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setDismissed(true);
    setForceUpgrade(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    // Guardia de cuota IA: valida las consultas del usuario contra el plan/Demo
    // antes de llamar a la API. Sin cupo, abre el UpgradeModal y detiene aquí.
    if (!requirePerform('ai', messages.filter((m) => m.role === 'user').length)) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/ai/chat`, {
        message: input,
        session_id: sessionId,
        template: template,
        lawyer_id: user?.id || null,
        country: user?.country || null,
        // Contexto automático del expediente seleccionado/activo (sin pedirlo).
        expediente_id: expCtx?.expediente_id || active?.expediente_id || null,
        case_id: expCtx?.case_id || active?.case_id || null,
        client_id: expCtx?.client_id || active?.client_id || null,
        materia: expCtx?.materia || null,
        resumen: expCtx?.resumen || null,
      });
      setSessionId(data.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.usage) setUsage(prev => ({ ...prev, ...data.usage }));
    } catch (err) {
      if (err.response?.status === 429) {
        // Límite de tasa de Gemini → invita a potenciar con IAs premium
        if (!dismissed) setForceUpgrade(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Gemini está recibiendo muchas consultas en este momento. Intenta de nuevo en unos segundos o potencia tu IA con una opción premium.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Error al conectar con el asistente. Verifique la configuración.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
  }, []);

  const selectTemplate = useCallback((id) => {
    setTemplate(id);
    handleNewChat();
  }, [handleNewChat]);

  const currentTemplate = templates.find(t => t.id === template);

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0 h-[calc(100vh-3rem)] lg:h-screen flex flex-col -m-6 lg:-m-10 p-6 lg:p-10">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              IA Jurídica <Sparkles className="w-6 h-6 text-[#f97316]" />
            </h1>
            <p className="text-white/60">Tu asistente legal inteligente potenciado por IA avanzada</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-gradient-to-r from-[#4285f4]/15 to-[#10b981]/15 border-[#4285f4]/30 text-white/80" data-testid="ai-powered-badge">
              <Sparkles className="w-3.5 h-3.5 text-[#4285f4]" />
              Powered by Gemini Flash <span className="text-[#10b981]">✨ Gratis</span>
            </div>
            <Button onClick={handleNewChat} variant="outline" className="border-white/20 text-white hover:bg-white/10" data-testid="new-chat-button">
              <RotateCcw className="w-4 h-4 mr-2" /> Nueva Consulta
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 flex-1 min-h-0">
          {/* Templates Sidebar */}
          <div className="space-y-2 lg:max-h-full lg:overflow-y-auto">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-2 px-2">Plantillas</div>
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${template === t.id ? 'border-[#f97316]/40 bg-[#f97316]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                data-testid={`template-${t.id}`}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${t.color}20` }}>
                    <t.icon className="w-4 h-4" style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-white/50 mt-0.5">{t.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 flex flex-col overflow-hidden">
            {/* Active Template Bar */}
            <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${currentTemplate.color}20` }}>
                <currentTemplate.icon className="w-5 h-5" style={{ color: currentTemplate.color }} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{currentTemplate.name}</div>
                <div className="text-xs text-white/50">{currentTemplate.description}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select value={selectedExpId} onChange={(e) => setSelectedExpId(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white max-w-[180px]" data-testid="ai-expediente-select">
                  <option value="" className="bg-[#0f172a]">Sin expediente</option>
                  {expedientes.map((e) => (
                    <option key={e.expediente_id} value={e.expediente_id} className="bg-[#0f172a]">{e.expediente_id} · {e.client_name || e.case_number}</option>
                  ))}
                </select>
                {selectedExpId && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#06b6d4]/40 bg-[#06b6d4]/10 text-[#67e8f9] text-xs font-semibold" data-testid="ai-context-banner">
                    Trabajando sobre {selectedExpId}
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">¿En qué puedo ayudarte hoy?</h3>
                  <p className="text-white/60 max-w-md mx-auto">Pregúntame sobre cualquier tema jurídico. Puedo redactar documentos, analizar casos y brindar asesoría especializada.</p>
                  <div className="grid sm:grid-cols-2 gap-2 max-w-lg mx-auto mt-6">
                    {['Redacta una demanda por incumplimiento contractual', 'Resume jurisprudencia sobre tutela laboral', 'Genera un contrato de prestación de servicios', 'Analiza riesgos en estipulaciones'].map((suggestion) => (
                      <button key={`suggestion-${suggestion.substring(0, 20).replace(/\s+/g, '-')}`} onClick={() => setInput(suggestion)} className="p-3 text-left text-sm rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-white/80">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div key={`msg-${msg.role}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6]' : 'bg-gradient-to-br from-[#f97316] to-[#fb923c]'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 border border-[#3b82f6]/30' : 'bg-white/5 border border-white/10'}`}>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                    {msg.role === 'assistant' && (
                      <button onClick={() => navigator.clipboard.writeText(msg.content)} className="mt-2 text-xs text-white/40 hover:text-white/80 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copiar
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-sm text-white/60">Pensando...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Banner de upgrade no intrusivo */}
            {showUpgrade && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-[#f97316]/10 to-[#8b5cf6]/10 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3"
                data-testid="ai-upgrade-banner"
              >
                <div className="flex-1 text-sm text-white/80">
                  <Sparkles className="w-4 h-4 inline mr-1 text-[#f97316]" />
                  ¿Necesitas más velocidad y precisión? Potencia tu IA jurídica:
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {UPGRADE_LINKS.map(link => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/15 hover:bg-white/10 transition-colors flex items-center gap-1"
                      style={{ color: link.color }}
                      data-testid={`upgrade-${link.name.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                      {link.name} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                  <button onClick={dismissUpgrade} className="p-1 rounded-lg hover:bg-white/10 text-white/50" title="No mostrar por 7 días" data-testid="dismiss-upgrade">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 p-4 flex-shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={`Escriba su consulta de ${currentTemplate.name.toLowerCase()}...`}
                  className="flex-1 bg-white/10 border-white/20 text-white resize-none min-h-[60px]"
                  data-testid="ai-input"
                />
                <Button type="submit" disabled={loading || !input.trim()} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white self-end" data-testid="ai-send">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIPage;
