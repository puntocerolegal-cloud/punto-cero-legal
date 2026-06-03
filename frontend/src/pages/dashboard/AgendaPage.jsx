import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Clock, MapPin, Users, Bell, Video, FileText, Gavel, X, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const eventTypeConfig = {
  meeting: { label: 'Reunión', color: '#3b82f6', icon: Users },
  hearing: { label: 'Audiencia', color: '#ef4444', icon: Gavel },
  deadline: { label: 'Vencimiento', color: '#f97316', icon: Bell },
  reminder: { label: 'Recordatorio', color: '#10b981', icon: Clock },
};

// Mapea un appointment del backend (start_time ISO) al formato visual del calendario
const toDisplayEvent = (a) => {
  const start = a.start_time ? new Date(a.start_time) : null;
  return {
    _id: a._id,
    title: a.title,
    type: a.event_type || 'meeting',
    date: start ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}` : '',
    time: start ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}` : '',
    location: a.location || '—',
    client: a.description || '',
    start,
  };
};

export const AgendaPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({ title: '', type: 'meeting', date: '', time: '', location: '', client: '' });

  const loadEvents = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/appointments/?lawyer_id=${user.id}`);
      setEvents(data.map(toDisplayEvent));
    } catch (e) {
      console.error('Error cargando agenda:', e);
    }
  }, [user?.id]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const startIso = `${newEvent.date}T${newEvent.time || '00:00'}:00`;
      const start = new Date(startIso);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      await axios.post(`${API}/appointments/`, {
        lawyer_id: user.id,
        title: newEvent.title,
        event_type: newEvent.type,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        location: newEvent.location || null,
        description: newEvent.client || null,
        status: 'scheduled',
      });
      setNewEvent({ title: '', type: 'meeting', date: '', time: '', location: '', client: '' });
      setShowModal(false);
      loadEvents();
    } catch (err) {
      console.error('Error creando evento:', err);
    }
  };

  const upcomingEvents = [...events]
    .filter(e => e.start && e.start >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agenda Inteligente</h1>
            <p className="text-white/60">Audiencias, reuniones y recordatorios sincronizados</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="add-event-button">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Evento
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">{monthNames[month]} {year}</h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-white/10">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => <div key={d} className="text-center text-xs font-bold text-white/40 py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dateStr);
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                return (
                  <div key={day} className={`aspect-square p-1.5 rounded-lg ${isToday ? 'bg-gradient-to-br from-[#f97316]/20 to-[#fb923c]/20 border border-[#f97316]/40' : 'hover:bg-white/5'}`}>
                    <div className={`text-xs ${isToday ? 'font-bold text-[#f97316]' : 'text-white/80'}`}>{day}</div>
                    <div className="flex gap-0.5 mt-1 flex-wrap">
                      {dayEvents.slice(0, 3).map(e => (
                        <div key={e._id} className="w-1.5 h-1.5 rounded-full" style={{ background: eventTypeConfig[e.type]?.color || '#3b82f6' }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#f97316]" />
              Próximos Eventos
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 && <div className="text-sm text-white/40">No tienes eventos próximos.</div>}
              {upcomingEvents.map(event => {
                const config = eventTypeConfig[event.type] || eventTypeConfig.meeting;
                const Icon = config.icon;
                return (
                  <motion.div key={event._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl backdrop-blur-md bg-white/5 border-l-4 hover:bg-white/10 transition-all" style={{ borderColor: config.color }}>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{event.title}</div>
                        <div className="text-xs text-white/60 mt-1">{event.date} · {event.time}</div>
                        <div className="text-xs text-white/40 mt-0.5 truncate">{event.location}</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Integration Hint */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-[#3b82f6]/10 to-[#10b981]/10 border border-[#3b82f6]/30 rounded-2xl p-4 flex items-center gap-4">
          <Calendar className="w-8 h-8 text-[#3b82f6]" />
          <div className="flex-1">
            <div className="font-semibold">Sincroniza tu agenda externa</div>
            <div className="text-xs text-white/60">Conecta Google Calendar y Outlook para nunca perder un evento</div>
          </div>
          <Button variant="outline" className="border-[#3b82f6]/40 text-[#3b82f6] hover:bg-[#3b82f6]/10">Conectar</Button>
        </div>
      </div>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nuevo Evento</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input placeholder="Título" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                <option value="meeting">Reunión</option><option value="hearing">Audiencia</option><option value="deadline">Vencimiento</option><option value="reminder">Recordatorio</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
                <Input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              </div>
              <Input placeholder="Ubicación" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Cliente" value={newEvent.client} onChange={(e) => setNewEvent({ ...newEvent, client: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Crear Evento</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default AgendaPage;
