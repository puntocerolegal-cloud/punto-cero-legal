import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, MapPin, FileText, Briefcase, Calendar, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ClientsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [search, setSearch] = useState('');
  const [newClient, setNewClient] = useState({ name: '', document: '', email: '', phone: '', city: '', country: 'Colombia', address: '', status: 'active', observations: '' });

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
                  <Mail className="w-3.5 h-3.5" /> <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Phone className="w-3.5 h-3.5" /> <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-3.5 h-3.5" /> <span>{client.city}, {client.country}</span>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
              <button onClick={() => setSelectedClient(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-white/40">Documento:</span> {selectedClient.document}</div>
              <div><span className="text-white/40">Email:</span> {selectedClient.email}</div>
              <div><span className="text-white/40">Teléfono:</span> {selectedClient.phone}</div>
              <div><span className="text-white/40">Ubicación:</span> {selectedClient.city}, {selectedClient.country}</div>
              <div><span className="text-white/40">Dirección:</span> {selectedClient.address}</div>
              <div><span className="text-white/40">Registro:</span> {selectedClient.registerDate}</div>
              {selectedClient.observations && <div><span className="text-white/40">Observaciones:</span> {selectedClient.observations}</div>}
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
