import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Trash2, Mail, Phone, MapPin, X, MessageCircle, Send, Clock, PhoneCall } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '@/config/api';

const telLink = (phone) => `tel:${(phone || '').replace(/[^\d+]/g, '')}`;
const waLink = (phone) => `https://wa.me/${(phone || '').replace(/\D/g, '')}`;
const mailLink = (email) => `mailto:${email || ''}`;

const PRIORITY_STYLE = {
  alta: { label: 'Alta', cls: 'bg-red-500/15 text-red-300 border-red-500/40' },
  media: { label: 'Media', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40' },
  baja: { label: 'Baja', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/40' },
};

export const ClientsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState('');
  const [newClient, setNewClient] = useState({ name: '', document: '', email: '', phone: '', city: '', country: 'Colombia', address: '', status: 'active', observations: '' });
  const [clientCases, setClientCases] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [sendMsg, setSendMsg] = useState('');

  // Al abrir un cliente: carga sus casos y la línea de tiempo del más reciente.
  useEffect(() => {
    setTimeline(null); setClientCases([]); setSendMsg('');
    if (!selectedClient?._id) return;
    (async () => {
      try {
        const { data: cases } = await axios.get(`${API}/cases/`, { params: { client_id: selectedClient._id } });
        setClientCases(cases || []);
        if (cases && cases.length) {
          const { data: tl } = await axios.get(`${API}/cases/${cases[0]._id}/timeline`);
          setTimeline(tl);
        }
      } catch (e) { /* sin casos */ }
    })();
  }, [selectedClient]);

  const clientPriority = (() => {
    if (!clientCases.length) return null;
    const order = { alta: 3, media: 2, baja: 1 };
    return clientCases.reduce((max, c) => (order[c.priority_label] || 0) > (order[max] || 0) ? c.priority_label : max, 'baja');
  })();

  const sendTimeline = async (channel) => {
    if (!timeline?.case_id) return;
    try {
      const { data } = await axios.post(`${API}/cases/${timeline.case_id}/send-timeline`, { channel });
      if (data.link) window.open(data.link, '_blank');
      setSendMsg(data.api?.sent ? 'Enviado automáticamente.' : 'Abriendo tu app para enviar…');
    } catch (e) { setSendMsg('No se pudo enviar.'); }
  };

  const loadClients = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/clients/?lawyer_id=${user.id}`);
      setClients(data);
    } catch (e) {
      console.error('Error cargando clientes:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filtered = clients.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.document || '').includes(search));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/clients/`, { ...newClient, lawyer_id: user.id });
      setNewClient({ name: '', document: '', email: '', phone: '', city: '', country: 'Colombia', address: '', status: 'active', observations: '' });
      setShowModal(false);
      loadClients();
    } catch (e) {
      console.error('Error creando cliente:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/clients/${id}`);
      setClients(prev => prev.filter(c => c._id !== id));
      setSelectedClient(null);
    } catch (e) {
      console.error('Error eliminando cliente:', e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Directorio de Clientes</h1>
            <p className="text-white/60">Base de datos centralizada de todos tus clientes</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="add-client-button">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Cliente
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o documento..." className="bg-white/10 border-white/20 text-white pl-10" data-testid="search-client" />
        </div>

        {loading && <div className="text-center py-8 text-white/50">Cargando clientes...</div>}
        {!loading && filtered.length === 0 && <div className="text-center py-8 text-white/50">Aún no tienes clientes registrados.</div>}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <motion.div
              key={client._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedClient(client)}
              className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all cursor-pointer"
              data-testid={`client-card-${client._id}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center font-bold">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{client.name}</div>
                  <div className="text-xs text-white/60">{client.document}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-3.5 h-3.5" /> <span>{client.city}, {client.country}</span>
                </div>
                {/* Acciones de contacto directas */}
                <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {client.phone && (
                    <>
                      <a href={telLink(client.phone)} title="Llamar" className="w-8 h-8 rounded-lg bg-[#3b82f6]/15 hover:bg-[#3b82f6]/30 flex items-center justify-center" data-testid={`call-${client._id}`}><PhoneCall className="w-4 h-4 text-[#3b82f6]" /></a>
                      <a href={waLink(client.phone)} target="_blank" rel="noreferrer" title="WhatsApp" className="w-8 h-8 rounded-lg bg-[#25d366]/15 hover:bg-[#25d366]/30 flex items-center justify-center" data-testid={`wa-${client._id}`}><MessageCircle className="w-4 h-4 text-[#25d366]" /></a>
                    </>
                  )}
                  {client.email && (
                    <a href={mailLink(client.email)} title="Email" className="w-8 h-8 rounded-lg bg-[#f97316]/15 hover:bg-[#f97316]/30 flex items-center justify-center" data-testid={`mail-${client._id}`}><Mail className="w-4 h-4 text-[#f97316]" /></a>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-xs text-white/40">Casos</div>
                  <div className="font-bold text-[#f97316]">{client.cases}</div>
                </div>
                <div>
                  <div className="text-xs text-white/40">Documentos</div>
                  <div className="font-bold text-[#3b82f6]">{client.documents}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal Crear Cliente */}
      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nuevo Cliente</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input placeholder="Nombre completo" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Documento de identidad" value={newClient.document} onChange={(e) => setNewClient({ ...newClient, document: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Email" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Teléfono" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ciudad" value={newClient.city} onChange={(e) => setNewClient({ ...newClient, city: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                <select value={newClient.country} onChange={(e) => setNewClient({ ...newClient, country: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                  <option>Colombia</option><option>Venezuela</option><option>México</option><option>Argentina</option><option>Chile</option>
                </select>
              </div>
              <Input placeholder="Dirección" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Textarea placeholder="Observaciones" value={newClient.observations} onChange={(e) => setNewClient({ ...newClient, observations: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Crear Cliente</Button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Modal Detalle */}
      {selectedClient && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedClient(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                {clientPriority && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[clientPriority]?.cls}`}>
                    Prioridad {PRIORITY_STYLE[clientPriority]?.label}
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedClient(null)}><X className="w-5 h-5" /></button>
            </div>

            {/* Acciones de contacto directas */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedClient.phone && (
                <>
                  <a href={telLink(selectedClient.phone)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#3b82f6]/15 hover:bg-[#3b82f6]/30 text-[#3b82f6] text-sm font-semibold"><PhoneCall className="w-4 h-4" /> Llamar</a>
                  <a href={waLink(selectedClient.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25d366]/15 hover:bg-[#25d366]/30 text-[#25d366] text-sm font-semibold"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
                </>
              )}
              {selectedClient.email && (
                <a href={mailLink(selectedClient.email)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f97316]/15 hover:bg-[#f97316]/30 text-[#f97316] text-sm font-semibold"><Mail className="w-4 h-4" /> Email</a>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div><span className="text-white/40">Documento:</span> {selectedClient.document}</div>
              <div><span className="text-white/40">Email:</span> {selectedClient.email}</div>
              <div><span className="text-white/40">Teléfono:</span> {selectedClient.phone}</div>
              <div><span className="text-white/40">Ubicación:</span> {selectedClient.city}, {selectedClient.country}</div>
              <div><span className="text-white/40">Dirección:</span> {selectedClient.address}</div>
              {selectedClient.observations && <div><span className="text-white/40">Observaciones:</span> {selectedClient.observations}</div>}

              {/* Línea de tiempo del caso */}
              {timeline && (
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-[#f97316]" /> Línea de tiempo · {timeline.case_number}</h3>
                  </div>
                  <div className="relative pl-5 space-y-3 max-h-48 overflow-y-auto">
                    <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/15" />
                    {timeline.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[14px] top-1 w-3 h-3 rounded-full bg-[#f97316] border-2 border-[#0f172a]" />
                        <div className="text-xs text-white/40">{(t.date || '').slice(0, 10)}</div>
                        <div className="text-sm font-semibold">{t.stage}</div>
                        <div className="text-xs text-white/60">{t.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => sendTimeline('whatsapp')} className="bg-[#25d366]/20 text-[#25d366] hover:bg-[#25d366]/30"><MessageCircle className="w-4 h-4 mr-1" /> Enviar por WhatsApp</Button>
                    <Button size="sm" onClick={() => sendTimeline('email')} className="bg-[#f97316]/20 text-[#f97316] hover:bg-[#f97316]/30"><Send className="w-4 h-4 mr-1" /> Enviar por correo</Button>
                  </div>
                  {sendMsg && <div className="text-xs text-white/50 mt-2">{sendMsg}</div>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                <div className="backdrop-blur-md bg-[#f97316]/10 rounded-xl p-3 border border-[#f97316]/30">
                  <div className="text-xs text-white/60">Casos Vinculados</div>
                  <div className="text-2xl font-bold text-[#f97316]">{selectedClient.cases}</div>
                </div>
                <div className="backdrop-blur-md bg-[#3b82f6]/10 rounded-xl p-3 border border-[#3b82f6]/30">
                  <div className="text-xs text-white/60">Documentos</div>
                  <div className="text-2xl font-bold text-[#3b82f6]">{selectedClient.documents}</div>
                </div>
              </div>
              <Button onClick={() => handleDelete(selectedClient._id)} variant="outline" className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 mt-2" data-testid={`delete-client-${selectedClient._id}`}>
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar Cliente
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default ClientsPage;
