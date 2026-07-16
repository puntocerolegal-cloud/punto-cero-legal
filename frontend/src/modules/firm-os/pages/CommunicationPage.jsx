import React, { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Loader2, Mail, RefreshCw } from "lucide-react";
import axios from "axios";
import { API } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Centro de Comunicaciones — Firm OS.
 * Usa el backend real de mensajería (/api/messages): listar, enviar, marcar leído.
 */
export function CommunicationPage() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const firmId = user?.firm_id;

  const [messages, setMessages] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ recipient_id: "", subject: "", message: "" });

  const authHeaders = () => {
    const t = localStorage.getItem("pcl_token") || localStorage.getItem("access_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const loadMessages = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await axios.get(`${API}/messages/`, {
        params: { user_id: userId },
        headers: authHeaders(),
      });
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadTeam = useCallback(async () => {
    if (!firmId) return;
    try {
      const res = await axios.get(`${API}/rbac/team/${firmId}`, { headers: authHeaders() });
      const members = (res.data?.team || []).filter((m) => m.id !== userId);
      setTeam(members);
    } catch (e) {
      setTeam([]);
    }
  }, [firmId, userId]);

  useEffect(() => { loadMessages(); loadTeam(); }, [loadMessages, loadTeam]);

  const handleSelect = async (msg) => {
    setSelected(msg);
    if (!msg.read && msg.recipient_id === userId) {
      try {
        await axios.patch(`${API}/messages/${msg._id}/mark-read`, {}, { headers: authHeaders() });
        setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, read: true } : m)));
      } catch (e) { /* noop */ }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.recipient_id || !form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API}/messages/`, {
        sender_id: userId,
        recipient_id: form.recipient_id,
        subject: form.subject.trim(),
        message: form.message.trim(),
      }, { headers: authHeaders() });
      setForm({ recipient_id: "", subject: "", message: "" });
      await loadMessages();
    } catch (err) {
      alert(err.response?.data?.detail || "Error al enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const nameOf = (id) => team.find((m) => m.id === id)?.name || team.find((m) => m.id === id)?.full_name || (id === userId ? "Yo" : id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Comunicaciones</h1>
        </div>
        <button onClick={loadMessages} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de mensajes */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-white/60 uppercase">Bandeja ({messages.length})</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-white/60 p-4"><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</div>
          ) : messages.length === 0 ? (
            <p className="text-white/50 text-sm p-4 rounded-lg bg-white/5">No hay mensajes.</p>
          ) : (
            messages.map((m) => (
              <div key={m._id} onClick={() => handleSelect(m)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selected?._id === m._id ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white text-sm truncate">{m.subject}</p>
                      {!m.read && m.recipient_id === userId && <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      {m.sender_id === userId ? `Para: ${nameOf(m.recipient_id)}` : `De: ${nameOf(m.sender_id)}`}
                    </p>
                    <p className="text-xs text-white/50 mt-1 truncate">{m.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detalle + Redacción */}
        <div className="lg:col-span-2 space-y-6">
          {selected && (
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <p className="text-lg font-bold text-white">{selected.subject}</p>
              <p className="text-xs text-white/50 mt-1">De {nameOf(selected.sender_id)} · Para {nameOf(selected.recipient_id)}</p>
              <p className="text-white/80 mt-4 whitespace-pre-wrap">{selected.message}</p>
            </div>
          )}

          <form onSubmit={handleSend} className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <h2 className="text-lg font-bold text-white">Nuevo mensaje</h2>
            <select value={form.recipient_id} onChange={(e) => setForm({ ...form, recipient_id: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white">
              <option value="">Seleccionar destinatario…</option>
              {team.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-800">{m.name || m.full_name || m.email}</option>
              ))}
            </select>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Asunto" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40" />
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Escribe tu mensaje…" rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40" />
            <button type="submit" disabled={sending || !form.recipient_id || !form.subject.trim() || !form.message.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar
            </button>
            {!firmId && <p className="text-xs text-amber-400">Los destinatarios se cargan desde el equipo de la firma.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default CommunicationPage;
