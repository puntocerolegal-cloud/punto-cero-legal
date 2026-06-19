import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, CheckCircle2, Copy, X, Eye, Pencil, Trash2, Paperclip, Printer, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { usePageActions } from '@/components/layout/DashboardActions';
import { useCaseContext } from '../../contexts/CaseContext';
import { ContextFilterChip } from '../../components/layout/ContextFilterChip';
import { CasesChart } from '@/shared/charts';
import { API } from '@/config/api';

const statusConfig = {
  draft: { label: 'Borrador', color: '#6b7280' },
  sent: { label: 'Enviada', color: '#3b82f6' },
  paid: { label: 'Pagada', color: '#10b981' },
  overdue: { label: 'Vencida', color: '#ef4444' },
  cancelled: { label: 'Anulada', color: '#6b7280' },
};

export const InvoicesPage = () => {
  const { user } = useAuth();
  const { active } = useCaseContext();
  const activeCaseId = active?.case_id || null;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ client: '', amount: '', dueDate: '', serviceDate: '', hours: '', rate: '', description: '' });
  const [preview, setPreview] = useState(null);
  const [editInv, setEditInv] = useState(null);
  const [attachingId, setAttachingId] = useState(null);
  const fileRef = React.useRef(null);

  const loadInvoices = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${API}/invoices/?lawyer_id=${user.id}`);
      setInvoices(activeCaseId ? data.filter(i => i.case_id === activeCaseId) : data);
    } catch (e) {
      console.error('Error cargando facturas:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeCaseId]);

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
        hours: newInvoice.hours ? parseFloat(newInvoice.hours) : null,
        hourly_rate: newInvoice.rate ? parseFloat(newInvoice.rate) : null,
        service_date: newInvoice.serviceDate ? new Date(newInvoice.serviceDate).toISOString() : null,
        due_date: newInvoice.dueDate ? new Date(newInvoice.dueDate).toISOString() : null,
        description: newInvoice.description,
        status: 'draft',
      });
      setNewInvoice({ client: '', amount: '', dueDate: '', serviceDate: '', hours: '', rate: '', description: '' });
      setShowModal(false);
      loadInvoices();
    } catch (err) {
      console.error('Error creando factura:', err);
    }
  };

  const [generating, setGenerating] = useState(null);

  const handleGenerateLink = async (inv) => {
    setGenerating(inv._id);
    try {
      const { data } = await axios.post(`${API}/invoices/${inv._id}/pay-link`);
      await loadInvoices();
      // Copia el link al portapapeles y lo muestra
      try { await navigator.clipboard.writeText(data.payment_link); } catch (_) {}
      window.prompt('Link de cobro MercadoPago (copiado al portapapeles):', data.payment_link);
    } catch (err) {
      console.error('Error generando link de cobro:', err);
      alert('No se pudo generar el link de cobro.');
    } finally {
      setGenerating(null);
    }
  };

  const handleMarkPaid = async (inv) => {
    try {
      await axios.post(`${API}/invoices/${inv._id}/mark-paid`);
      loadInvoices();
    } catch (err) {
      console.error('Error marcando factura pagada:', err);
    }
  };

  const handleDelete = async (inv) => {
    if (!window.confirm(`¿Eliminar la factura ${inv.number}?`)) return;
    try { await axios.delete(`${API}/invoices/${inv._id}`); loadInvoices(); }
    catch (e) { alert('No se pudo eliminar.'); }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`${API}/invoices/${editInv._id}`, {
        client_name: editInv.client,
        amount: parseFloat(editInv.amount),
        description: editInv.description,
        status: editInv.status,
      });
      setEditInv(null);
      loadInvoices();
    } catch (e) { alert('No se pudo guardar.'); }
  };

  const handleAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !attachingId) return;
    const fd = new FormData();
    fd.append('mark_paid', 'true');
    fd.append('file', file);
    try {
      await axios.post(`${API}/invoices/${attachingId}/attach-payment`, fd);
      loadInvoices();
      alert('Comprobante adjuntado. Factura marcada como pagada.');
    } catch (err) { alert('No se pudo adjuntar el comprobante.'); }
    finally { setAttachingId(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  const triggerAttach = (inv) => { setAttachingId(inv._id); setTimeout(() => fileRef.current?.click(), 0); };

  const format = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num || 0);

  const printInvoice = (inv) => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) return;
    const row = (k, v) => v ? `<tr><td style="padding:6px 10px;color:#555">${k}</td><td style="padding:6px 10px;font-weight:600">${v}</td></tr>` : '';
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${inv.number}</title>
      <style>body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:700px;margin:auto}
      h1{color:#f97316;margin:0} .muted{color:#777;font-size:13px} table{width:100%;border-collapse:collapse;margin-top:20px;border:1px solid #eee}
      .total{font-size:22px;font-weight:800;margin-top:20px;text-align:right}</style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div><h1>Punto Cero Legal</h1><div class="muted">Factura de servicios jurídicos</div></div>
        <div style="text-align:right"><div style="font-weight:700">${inv.number}</div><div class="muted">${(inv.date||'').slice(0,10)}</div></div>
      </div>
      <table>
        ${row('Cliente', inv.client)}
        ${row('Descripción del servicio', inv.description)}
        ${row('Fecha del servicio', (inv.service_date||'').slice(0,10))}
        ${row('Horas', inv.hours)}
        ${row('Honorarios por hora', inv.hourly_rate != null ? format(inv.hourly_rate) : '')}
        ${row('Fecha de emisión', (inv.date||'').slice(0,10))}
        ${row('Vencimiento', (inv.dueDate||'').slice(0,10))}
        ${row('Estado de pago', (statusConfig[inv.status]||{}).label)}
      </table>
      <div class="total">TOTAL: ${format(inv.amount)}</div>
      <script>window.onload=()=>{window.print()}</script></body></html>`);
    w.document.close();
  };

  usePageActions({ onAdd: () => setShowModal(true) }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <ContextFilterChip />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Facturación y Contabilidad</h1>
            <p className="text-white/60">Gestión financiera de tu práctica legal</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold" data-testid="add-invoice-button">
            <Plus className="w-4 h-4 mr-2" /> Nueva Factura
          </Button>
        </div>

        {/* Gráfico de rendimiento — ingresos por estado de pago (métrica inmediata) */}
        <CasesChart
          title="Ingresos por estado de pago"
          data={[
            { label: "Pagado", value: totalRevenue, color: "#10b981" },
            { label: "Pendiente", value: pendingRevenue, color: "#f59e0b" },
            { label: "Vencido", value: overdueRevenue, color: "#ef4444" },
          ]}
        />

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
                          <button onClick={() => setPreview(inv)} className="p-1.5 rounded-lg hover:bg-white/10" title="Vista previa" data-testid={`preview-${inv._id}`}><Eye className="w-4 h-4 text-white/70" /></button>
                          <button onClick={() => printInvoice(inv)} className="p-1.5 rounded-lg hover:bg-white/10" title="Imprimir" data-testid={`print-${inv._id}`}><Printer className="w-4 h-4 text-white/70" /></button>
                          <button onClick={() => setEditInv({ ...inv, client: inv.client, amount: inv.amount, status: inv.status })} className="p-1.5 rounded-lg hover:bg-white/10" title="Editar" data-testid={`edit-${inv._id}`}><Pencil className="w-4 h-4 text-[#3b82f6]" /></button>
                          <button onClick={() => triggerAttach(inv)} className="p-1.5 rounded-lg hover:bg-white/10" title="Adjuntar comprobante de pago" data-testid={`attach-${inv._id}`}><Paperclip className="w-4 h-4 text-[#10b981]" /></button>
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <>
                              {inv.payment_link ? (
                                <button onClick={() => { navigator.clipboard.writeText(inv.payment_link); window.prompt('Link de cobro:', inv.payment_link); }} className="p-1.5 rounded-lg hover:bg-white/10" title="Copiar link de cobro" data-testid={`copy-link-${inv._id}`}><Copy className="w-4 h-4 text-[#3b82f6]" /></button>
                              ) : (
                                <button onClick={() => handleGenerateLink(inv)} disabled={generating === inv._id} className="p-1.5 rounded-lg hover:bg-white/10" title="Generar link de cobro MercadoPago" data-testid={`pay-link-${inv._id}`}><CreditCard className="w-4 h-4 text-[#f97316]" /></button>
                              )}
                              <button onClick={() => handleMarkPaid(inv)} className="p-1.5 rounded-lg hover:bg-white/10" title="Marcar como pagada" data-testid={`mark-paid-${inv._id}`}><CheckCircle2 className="w-4 h-4 text-[#10b981]" /></button>
                            </>
                          )}
                          <button onClick={() => handleDelete(inv)} className="p-1.5 rounded-lg hover:bg-white/10" title="Borrar" data-testid={`delete-${inv._id}`}><Trash2 className="w-4 h-4 text-red-400" /></button>
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
              <Input placeholder="Descripción del servicio prestado" value={newInvoice.description} onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/50">Fecha del servicio</label><Input type="date" value={newInvoice.serviceDate} onChange={(e) => setNewInvoice({ ...newInvoice, serviceDate: e.target.value })} className="bg-white/10 border-white/20 text-white" /></div>
                <div><label className="text-xs text-white/50">Vencimiento</label><Input type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} required className="bg-white/10 border-white/20 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Horas" value={newInvoice.hours} onChange={(e) => setNewInvoice({ ...newInvoice, hours: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                <Input type="number" placeholder="Honorarios/hora" value={newInvoice.rate} onChange={(e) => setNewInvoice({ ...newInvoice, rate: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              </div>
              <Input type="number" placeholder="Monto total (honorarios)" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} required className="bg-white/10 border-white/20 text-white" />
              <Button type="submit" className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Generar Factura</Button>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Input oculto para adjuntar comprobante */}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleAttach} className="hidden" />

      {/* Vista previa / reporte de factura */}
      {preview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-[#f97316]">{preview.number}</h2>
              <button onClick={() => setPreview(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-white/50 mb-4">Reporte detallado del servicio</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/40">Cliente</span><span className="font-semibold">{preview.client}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Servicio</span><span className="font-semibold text-right max-w-[60%]">{preview.description || '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Fecha del servicio</span><span>{(preview.service_date || '').slice(0, 10) || '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Horas</span><span>{preview.hours ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Honorarios/hora</span><span>{preview.hourly_rate != null ? format(preview.hourly_rate) : '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Emisión</span><span>{(preview.date || '').slice(0, 10)}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Vencimiento</span><span>{(preview.dueDate || '').slice(0, 10) || '—'}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Estado de pago</span><span className="font-semibold" style={{ color: (statusConfig[preview.status] || {}).color }}>{(statusConfig[preview.status] || {}).label}</span></div>
              {preview.has_proof && <div className="flex justify-between"><span className="text-white/40">Comprobante</span><span className="text-[#10b981]">Adjunto ✓</span></div>}
              <div className="flex justify-between pt-3 border-t border-white/10 text-lg"><span className="font-bold">TOTAL</span><span className="font-bold text-[#10b981]">{format(preview.amount)}</span></div>
            </div>
            <Button onClick={() => printInvoice(preview)} className="w-full mt-5 bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold"><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>
          </motion.div>
        </motion.div>
      )}

      {/* Editar factura */}
      {editInv && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditInv(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Editar {editInv.number}</h2>
              <button onClick={() => setEditInv(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <Input value={editInv.client} onChange={(e) => setEditInv({ ...editInv, client: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="Cliente" />
              <Input value={editInv.description || ''} onChange={(e) => setEditInv({ ...editInv, description: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="Descripción" />
              <Input type="number" value={editInv.amount} onChange={(e) => setEditInv({ ...editInv, amount: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="Monto" />
              <select value={editInv.status} onChange={(e) => setEditInv({ ...editInv, status: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k} className="bg-[#0f172a]">{v.label}</option>)}
              </select>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-bold">Guardar cambios</Button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default InvoicesPage;
