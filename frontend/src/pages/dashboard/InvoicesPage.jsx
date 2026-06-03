import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, TrendingUp, TrendingDown, DollarSign, FileText, Download, Eye, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  draft: { label: 'Borrador', color: '#6b7280' },
  sent: { label: 'Enviada', color: '#3b82f6' },
  paid: { label: 'Pagada', color: '#10b981' },
  overdue: { label: 'Vencida', color: '#ef4444' },
  cancelled: { label: 'Anulada', color: '#6b7280' },
};

export const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ client: '', amount: '', dueDate: '', description: '' });

  const loadInvoices = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/invoices/?lawyer_id=${user.id}`);
      setInvoices(data);
    } catch (e) {
      console.error('Error cargando facturas:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.amount, 0);
  const overdueRevenue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/invoices/`, {
        lawyer_id: user.id,
        client_name: newInvoice.client,
        amount: parseFloat(newInvoice.amount),
        due_date: newInvoice.dueDate ? new Date(newInvoice.dueDate).toISOString() : null,
        description: newInvoice.description,
        status: 'draft',
      });
      setNewInvoice({ client: '', amount: '', dueDate: '', description: '' });
      setShowModal(false);
      loadInvoices();
    } catch (err) {
      console.error('Error creando factura:', err);
    }
  };

  const format = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Facturación</h1>
            <p className="text-white/60">Gestión financiera de tu práctica legal</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="add-invoice-button">
            <Plus className="w-4 h-4 mr-2" /> Nueva Factura
          </Button>
        </div>

        {/* Financial Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="backdrop-blur-xl bg-gradient-to-br from-[#10b981]/10 to-transparent rounded-2xl p-6 border border-[#10b981]/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#10b981]" />
              </div>
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
            </div>
            <div className="text-3xl font-bold text-[#10b981]">{format(totalRevenue)}</div>
            <div className="text-sm text-white/60 mt-1">Ingresos del mes</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="backdrop-blur-xl bg-gradient-to-br from-[#3b82f6]/10 to-transparent rounded-2xl p-6 border border-[#3b82f6]/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-[#3b82f6]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-[#3b82f6]">{format(pendingRevenue)}</div>
            <div className="text-sm text-white/60 mt-1">Por cobrar</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-red-400">{format(overdueRevenue)}</div>
            <div className="text-sm text-white/60 mt-1">Vencidas</div>
          </motion.div>
        </div>

        {/* Invoices Table */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-left text-xs uppercase text-white/60">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 hidden md:table-cell">Fecha</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const config = statusConfig[inv.status] || statusConfig.draft;
                  return (
                    <tr key={inv._id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-sm font-mono text-[#f97316]">{inv.number}</td>
                      <td className="px-4 py-3">{inv.client}</td>
                      <td className="px-4 py-3 text-sm hidden md:table-cell">{inv.date}</td>
                      <td className="px-4 py-3 font-bold">{format(inv.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${config.color}20`, color: config.color }}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-white/10"><Eye className="w-4 h-4 text-[#3b82f6]" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-[#10b981]" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && <div className="text-center py-8 text-white/50">Cargando facturas...</div>}
            {!loading && invoices.length === 0 && <div className="text-center py-8 text-white/50">Aún no has emitido facturas.</div>}
          </div>
        </div>
      </div>

      {showModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nueva Factura</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input placeholder="Cliente" value={newInvoice.client} onChange={(e) => setNewInvoice({ ...newInvoice, client: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input type="number" placeholder="Monto" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Descripción de servicios" value={newInvoice.description} onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Generar Factura</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default InvoicesPage;
