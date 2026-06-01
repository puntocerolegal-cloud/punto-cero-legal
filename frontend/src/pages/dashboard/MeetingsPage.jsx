import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Mic, MicOff, VideoOff, Phone, Plus, Users, Calendar, Copy, Link2, X, Share2, MessageSquare, FileText } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const upcomingMeetings = [
  { id: 1, title: 'Audiencia Caso González', date: '2025-12-13', time: '09:00', participants: ['Dra. M. González', 'Juez Civil 5'], room: 'PCL-A8F2' },
  { id: 2, title: 'Reunión Cliente Mendoza', date: '2025-12-13', time: '14:30', participants: ['C. Mendoza'], room: 'PCL-B9K3' },
  { id: 3, title: 'Mediación Familiar Torres', date: '2025-12-14', time: '10:00', participants: ['L. Torres', 'Mediador'], room: 'PCL-C7M5' },
];

export const MeetingsPage = () => {
  const [meetings, setMeetings] = useState(upcomingMeetings);
  const [showModal, setShowModal] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', participants: '' });

  const createMeeting = (e) => {
    e.preventDefault();
    const room = `PCL-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    setMeetings([...meetings, { id: Date.now(), ...newMeeting, room, participants: newMeeting.participants.split(',') }]);
    setNewMeeting({ title: '', date: '', time: '', participants: '' });
    setShowModal(false);
  };

  const startInstantMeeting = () => {
    const room = `PCL-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    setActiveMeeting({ id: 'instant', title: 'Reunión Instantánea', room, participants: ['Tú'] });
  };

  if (activeMeeting) {
    return (
      <DashboardLayout>
        <div className="pt-12 lg:pt-0">
          <div className="bg-black rounded-3xl p-6 min-h-[70vh] relative overflow-hidden border border-white/10">
            <div className="absolute top-4 left-4 z-10 backdrop-blur-md bg-black/50 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold">En vivo</span>
              <span className="text-xs text-white/60">· {activeMeeting.room}</span>
            </div>

            {/* Main Video */}
            <div className="grid lg:grid-cols-4 gap-4 h-full">
              <div className="lg:col-span-3 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl flex items-center justify-center relative aspect-video lg:aspect-auto">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center text-4xl font-bold">
                  TÚ
                </div>
                <div className="absolute bottom-4 left-4 backdrop-blur-md bg-black/50 rounded-lg px-3 py-1 text-sm">
                  Usted {!micOn && '🔇'}
                </div>
              </div>
              <div className="space-y-3">
                <div className="aspect-video bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl flex items-center justify-center relative">
                  <Users className="w-8 h-8 text-white/40" />
                  <div className="absolute bottom-2 left-2 text-xs">Cliente</div>
                </div>
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Chat
                  </h4>
                  <div className="text-xs text-white/40 text-center py-4">Sin mensajes</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-xl bg-black/70 rounded-2xl p-3 flex items-center gap-3 border border-white/20">
              <button onClick={() => setMicOn(!micOn)} className={`w-12 h-12 rounded-xl flex items-center justify-center ${micOn ? 'bg-white/10' : 'bg-red-500'}`} data-testid="toggle-mic">
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button onClick={() => setVideoOn(!videoOn)} className={`w-12 h-12 rounded-xl flex items-center justify-center ${videoOn ? 'bg-white/10' : 'bg-red-500'}`} data-testid="toggle-video">
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
              <button className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveMeeting(null)} className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center hover:bg-red-600" data-testid="end-call">
                <Phone className="w-5 h-5 rotate-[135deg]" />
              </button>
            </div>
          </div>
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
            <p className="text-white/60">Videollamadas seguras y cifradas extremo a extremo</p>
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-gradient-to-br from-[#f97316]/10 to-transparent rounded-2xl p-6 border border-[#f97316]/30 cursor-pointer" onClick={startInstantMeeting}>
            <Video className="w-10 h-10 text-[#f97316] mb-3" />
            <h3 className="font-bold text-lg mb-1">Iniciar Reunión</h3>
            <p className="text-sm text-white/60">Comienza una videollamada instantánea</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-gradient-to-br from-[#3b82f6]/10 to-transparent rounded-2xl p-6 border border-[#3b82f6]/30 cursor-pointer" onClick={() => setShowModal(true)}>
            <Calendar className="w-10 h-10 text-[#3b82f6] mb-3" />
            <h3 className="font-bold text-lg mb-1">Programar</h3>
            <p className="text-sm text-white/60">Agenda una reunión futura</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} className="backdrop-blur-xl bg-gradient-to-br from-[#10b981]/10 to-transparent rounded-2xl p-6 border border-[#10b981]/30 cursor-pointer">
            <Link2 className="w-10 h-10 text-[#10b981] mb-3" />
            <h3 className="font-bold text-lg mb-1">Unirse con Código</h3>
            <p className="text-sm text-white/60">Entra a una reunión existente</p>
          </motion.div>
        </div>

        {/* Upcoming Meetings */}
        <div>
          <h2 className="text-xl font-bold mb-4">Próximas Reuniones</h2>
          <div className="space-y-3">
            {meetings.map(m => (
              <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center">
                  <Video className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{m.title}</div>
                  <div className="text-sm text-white/60">{m.date} · {m.time} · Sala {m.room}</div>
                  <div className="text-xs text-white/40 mt-1">{Array.isArray(m.participants) ? m.participants.join(', ') : m.participants}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10" title="Copiar enlace">
                    <Copy className="w-4 h-4" />
                  </button>
                  <Button onClick={() => setActiveMeeting(m)} className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white" size="sm" data-testid={`join-meeting-${m.id}`}>
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
