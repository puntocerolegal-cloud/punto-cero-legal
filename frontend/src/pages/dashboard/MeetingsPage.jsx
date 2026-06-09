import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Video, Plus, Users, Calendar, Copy, Link2, X, Share2, FileText, Disc, MessageSquare, PhoneOff } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '@/config/api';

const JITSI_DOMAIN = 'meet.jit.si';

// Carga el script de la Jitsi External API una sola vez.
const loadJitsiScript = () => new Promise((resolve, reject) => {
  if (window.JitsiMeetExternalAPI) return resolve();
  const existing = document.getElementById('jitsi-external-api');
  if (existing) { existing.addEventListener('load', () => resolve()); return; }
  const s = document.createElement('script');
  s.id = 'jitsi-external-api';
  s.src = `https://${JITSI_DOMAIN}/external_api.js`;
  s.async = true;
  s.onload = () => resolve();
  s.onerror = () => reject(new Error('No se pudo cargar Jitsi'));
  document.body.appendChild(s);
});

const roomFromMeeting = (m) => m.room_id || (m.meeting_link ? m.meeting_link.split('/').pop() : `PCL-${Date.now()}`);

export const MeetingsPage = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [canRecord, setCanRecord] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', participants: '' });

  const jitsiRef = useRef(null);
  const apiRef = useRef(null);

  const loadMeetings = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/meetings/`, { params: { host_id: user.id } });
      setMeetings(data || []);
    } catch (e) { /* sin datos aún */ }
  }, [user?.id]);

  useEffect(() => {
    loadMeetings();
    // Grabación según el plan (elite / ilimitado)
    axios.get(`${API}/payment/my-plan`).then(r => {
      setCanRecord(['elite', 'ilimitado'].includes(r.data?.plan_id));
    }).catch(() => {});
  }, [loadMeetings]);

  // Monta Jitsi cuando hay una reunión activa
  useEffect(() => {
    if (!activeMeeting) return;
    let disposed = false;
    (async () => {
      try {
        await loadJitsiScript();
        if (disposed || !jitsiRef.current) return;
        const toolbar = [
          'microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview',
          'whiteboard', 'fullscreen', 'settings', 'hangup',
        ];
        if (canRecord) toolbar.push('recording');
        apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: roomFromMeeting(activeMeeting),
          parentNode: jitsiRef.current,
          userInfo: { displayName: user?.full_name || 'Abogado' },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableThirdPartyRequests: true,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: toolbar,
            SHOW_JITSI_WATERMARK: false,
            DEFAULT_BACKGROUND: '#0f172a',
          },
        });
        apiRef.current.addEventListener('readyToClose', () => setActiveMeeting(null));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      disposed = true;
      if (apiRef.current) { apiRef.current.dispose(); apiRef.current = null; }
    };
  }, [activeMeeting, canRecord, user?.full_name]);

  const persistMeeting = async (payload) => {
    if (!user?.id) return null;
    try {
      const { data } = await axios.post(`${API}/meetings/`, {
        host_id: user.id, title: payload.title || 'Reunión',
        participants: payload.participants || [user.id],
        scheduled_time: payload.scheduled_time || new Date().toISOString(),
        status: payload.status || 'scheduled',
        case_id: payload.case_id || null,
      });
      return data;
    } catch (e) { return null; }
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    const iso = new Date(`${newMeeting.date}T${newMeeting.time || '09:00'}`).toISOString();
    await persistMeeting({
      title: newMeeting.title, scheduled_time: iso,
      participants: newMeeting.participants ? newMeeting.participants.split(',').map(s => s.trim()) : [user.id],
    });
    setNewMeeting({ title: '', date: '', time: '', participants: '' });
    setShowModal(false);
    loadMeetings();
  };

  const startInstantMeeting = async () => {
    const created = await persistMeeting({ title: 'Reunión Instantánea', status: 'in_progress' });
    setActiveMeeting(created || { title: 'Reunión Instantánea', room_id: `PCL-${Math.random().toString(36).slice(2, 8).toUpperCase()}` });
  };

  // Controles personalizados (además de la barra de Jitsi)
  const cmd = (command, ...args) => apiRef.current?.executeCommand(command, ...args);

  if (activeMeeting) {
    return (
      <DashboardLayout>
        <div className="pt-12 lg:pt-0 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold">En vivo</span>
              <span className="text-xs text-white/60">· Sala {roomFromMeeting(activeMeeting)}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => cmd('toggleShareScreen')} className="bg-white/10 hover:bg-white/20" data-testid="share-screen"><Share2 className="w-4 h-4 mr-1" /> Compartir pantalla</Button>
              <Button size="sm" onClick={() => cmd('toggleWhiteboard')} className="bg-white/10 hover:bg-white/20" data-testid="whiteboard"><FileText className="w-4 h-4 mr-1" /> Pizarra</Button>
              <Button size="sm" onClick={() => cmd('toggleChat')} className="bg-white/10 hover:bg-white/20"><MessageSquare className="w-4 h-4 mr-1" /> Chat</Button>
              {canRecord && (
                <Button size="sm" onClick={() => cmd('startRecording', { mode: 'local' })} className="bg-white/10 hover:bg-white/20" data-testid="record"><Disc className="w-4 h-4 mr-1" /> Grabar</Button>
              )}
              <Button size="sm" onClick={() => setActiveMeeting(null)} className="bg-red-500 hover:bg-red-600 text-white" data-testid="end-call"><PhoneOff className="w-4 h-4 mr-1" /> Salir</Button>
            </div>
          </div>
          <div ref={jitsiRef} className="rounded-3xl overflow-hidden border border-white/10 bg-black" style={{ height: '72vh' }} />
          {!canRecord && <p className="text-xs text-white/40">La grabación está disponible en los planes Firma en Crecimiento e Consolidación Empresarial.</p>}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sala de Conferencias</h1>
            <p className="text-white/60">Videollamadas seguras con Jitsi Meet · video, audio, chat, pantalla, pizarra</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={startInstantMeeting} className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold" data-testid="instant-meeting">
              <Video className="w-4 h-4 mr-2" /> Reunión Ahora
            </Button>
            <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="schedule-meeting">
              <Plus className="w-4 h-4 mr-2" /> Programar
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-gradient-to-br from-[#f97316]/10 to-transparent rounded-2xl p-6 border border-[#f97316]/30 cursor-pointer" onClick={startInstantMeeting}>
            <Video className="w-10 h-10 text-[#f97316] mb-3" />
            <h3 className="font-bold text-lg mb-1">Iniciar Reunión</h3>
            <p className="text-sm text-white/60">Videollamada instantánea con Jitsi</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-gradient-to-br from-[#3b82f6]/10 to-transparent rounded-2xl p-6 border border-[#3b82f6]/30 cursor-pointer" onClick={() => setShowModal(true)}>
            <Calendar className="w-10 h-10 text-[#3b82f6] mb-3" />
            <h3 className="font-bold text-lg mb-1">Programar</h3>
            <p className="text-sm text-white/60">Agenda una reunión futura</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-gradient-to-br from-[#10b981]/10 to-transparent rounded-2xl p-6 border border-[#10b981]/30 cursor-pointer" onClick={startInstantMeeting}>
            <Link2 className="w-10 h-10 text-[#10b981] mb-3" />
            <h3 className="font-bold text-lg mb-1">Unirse a Sala</h3>
            <p className="text-sm text-white/60">Entra a una reunión segura</p>
          </motion.div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Próximas Reuniones</h2>
          <div className="space-y-3">
            {meetings.length === 0 && <div className="text-white/40 text-sm">Aún no tienes reuniones programadas.</div>}
            {meetings.map(m => (
              <motion.div key={m._id || m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
                  <Video className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{m.title}</div>
                  <div className="text-sm text-white/60">{(m.scheduled_time || '').slice(0, 16).replace('T', ' · ')} · Sala {roomFromMeeting(m)}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => navigator.clipboard.writeText(`https://${JITSI_DOMAIN}/${roomFromMeeting(m)}`)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10" title="Copiar enlace">
                    <Copy className="w-4 h-4" />
                  </button>
                  <Button onClick={() => setActiveMeeting(m)} className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white" size="sm" data-testid={`join-meeting-${m._id || m.id}`}>
                    Unirse
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Programar Reunión</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createMeeting} className="space-y-3">
              <Input placeholder="Título" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={newMeeting.date} onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                <Input type="time" value={newMeeting.time} onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              </div>
              <Input placeholder="Participantes (separar con coma)" value={newMeeting.participants} onChange={(e) => setNewMeeting({ ...newMeeting, participants: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Programar</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default MeetingsPage;
