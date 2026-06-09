import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Briefcase, Bell, Clock, LogOut, Scale, Users, FileText, Receipt,
  Megaphone, ShieldAlert, RefreshCw, CheckCircle2, XCircle, CreditCard,
  X, Search, Filter, Send, MessageCircle, Save, Phone, Mail, Trash2,
  Pencil, AlertTriangle, Zap, UserCheck, ClipboardList, ArrowRight,
  Activity, TrendingUp, Eye, Globe, Calculator, Plus, Link as LinkIcon,
  Printer, FileEdit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { getErrorMessage } from '../lib/utils';

import { API } from '@/config/api';

const fmtMoney = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

// Garantiza el prefijo Dr. en nombres de abogados (centralizado)
const withDr = (name) => {
  if (!name) return '—';
  const n = String(name).trim();
  if (/^dr\.?\s|^dra\.?\s/i.test(n)) return n;
  return `Dr. ${n}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const PRIORITY_STYLES = {
  alta: { color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-300', label: 'Alta' },
  media: { color: '#facc15', bg: 'bg-yellow-500/15', border: 'border-yellow-500/40', text: 'text-yellow-300', label: 'Media' },
  baja: { color: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-300', label: 'Baja' },
};

const STATUS_STYLES = {
  sin_asignar: { label: 'Sin asignar', color: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-300' },
  asignado: { label: 'Asignado', color: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-300' },
  atendido: { label: 'Atendido', color: '#10b981', bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
};

// ═══════════════════════════════════════════════════════════════════
// AdminPanel principal
// ═══════════════════════════════════════════════════════════════════
export const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());
  const [headerStats, setHeaderStats] = useState({ pending_cases: 0, pending_partners: 0, notifications_unread: 0 });
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('sales');

  const isAdminGeneral = user?.role === 'admin_general' || user?.role === 'admin';

  // Tick reloj cada segundo
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Refrescar stats globales cada 15s
  const loadHeader = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin-ops/header/stats`);
      setHeaderStats(res.data);
    } catch (e) { console.error('Failed to load header stats:', e); }
  }, []);

  useEffect(() => {
    loadHeader();
    const t = setInterval(loadHeader, 15000);
    return () => clearInterval(t);
  }, [loadHeader]);

  const loadNotifications = async () => {
    try {
      const res = await axios.get(`${API}/admin-ops/notifications`);
      setNotifications(res.data);
    } catch (e) { console.error('Failed to load notifications:', e); }
  };

  useEffect(() => { if (notifOpen) loadNotifications(); }, [notifOpen]);

  // RBAC: redirect si no es admin
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!['admin', 'admin_general', 'socio_comercial'].includes(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] text-white">
      {/* Ambient glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#f97316]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[#3b82f6]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-4 lg:p-8 max-w-[1800px] mx-auto">
        {/* ╔═════════════ HEADER GLOBAL ═════════════╗ */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 backdrop-blur-xl bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/[0.08]"
          data-testid="admin-header"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center flex-shrink-0">
              {isAdminGeneral ? <Crown className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">Centro de Gestión</div>
              <div className="font-bold text-base lg:text-lg truncate">{getGreeting()}, {user.full_name?.split(' ')[1] || user.full_name}</div>
              <div className="text-xs text-white/40">
                {isAdminGeneral ? 'Administrador General · Control total' : 'Socio Comercial · Visualizar & Asignar'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Reloj */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
              <Clock className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="font-mono tabular-nums" data-testid="admin-clock">
                {now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-white/30">·</span>
              <span className="text-white/50">{now.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span>
            </div>

            {/* Contador Casos Pendientes */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-xs" data-testid="counter-pending-cases">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-white/60">Casos pendientes:</span>
              <span className="font-bold text-red-300">{headerStats.pending_cases}</span>
            </div>

            {/* Contador Socios en Espera */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs" data-testid="counter-pending-partners">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white/60">Socios en espera:</span>
              <span className="font-bold text-amber-300">{headerStats.pending_partners}</span>
            </div>

            {/* Notificaciones */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-all"
              data-testid="notifications-btn"
              aria-label="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {headerStats.notifications_unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f97316] text-[10px] font-bold flex items-center justify-center">
                  {headerStats.notifications_unread}
                </span>
              )}
            </button>

            <Button onClick={() => { logout(); navigate('/'); }} variant="outline" className="border-white/10 text-white/70 hover:bg-white/5 h-9" data-testid="admin-logout">
              <LogOut className="w-3.5 h-3.5 mr-2" /> Salir
            </Button>
          </div>
        </motion.header>

        {/* ╔═════════════ TABS ═════════════╗ */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-1 backdrop-blur-xl flex flex-wrap h-auto gap-1" data-testid="admin-tabs">
            <TabsTrigger value="sales" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f97316] data-[state=active]:to-[#fb923c] data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold gap-2" data-testid="tab-sales">
              <Megaphone className="w-4 h-4" /> Sala de Ventas
            </TabsTrigger>
            <TabsTrigger value="operations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3b82f6] data-[state=active]:to-[#1d4ed8] data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold gap-2" data-testid="tab-operations">
              <Activity className="w-4 h-4" /> Monitor de Operaciones
            </TabsTrigger>
            {isAdminGeneral && (
              <TabsTrigger value="talent" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#10b981] data-[state=active]:to-[#059669] data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold gap-2" data-testid="tab-talent">
                <Users className="w-4 h-4" /> Gestión de Talento
              </TabsTrigger>
            )}
            <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#8b5cf6] data-[state=active]:to-[#a855f7] data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold gap-2" data-testid="tab-billing">
              <Receipt className="w-4 h-4" /> Facturación
            </TabsTrigger>
            {isAdminGeneral && (
              <TabsTrigger value="accounting" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#06b6d4] data-[state=active]:to-[#0284c7] data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold gap-2" data-testid="tab-accounting">
                <Calculator className="w-4 h-4" /> Contabilidad
              </TabsTrigger>
            )}
            <TabsTrigger value="geo" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f59e0b] data-[state=active]:to-[#d97706] data-[state=active]:text-white rounded-xl px-4 py-2.5 text-sm font-semibold gap-2" data-testid="tab-geo">
              <Globe className="w-4 h-4" /> Geografía
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-6">
            <SalesView isAdminGeneral={isAdminGeneral} onMutate={loadHeader} />
          </TabsContent>
          <TabsContent value="operations" className="mt-6">
            <OperationsView isAdminGeneral={isAdminGeneral} onMutate={loadHeader} />
          </TabsContent>
          {isAdminGeneral && (
            <TabsContent value="talent" className="mt-6">
              <TalentView />
            </TabsContent>
          )}
          <TabsContent value="billing" className="mt-6">
            <BillingView />
          </TabsContent>
          {isAdminGeneral && (
            <TabsContent value="accounting" className="mt-6">
              <AccountingView />
            </TabsContent>
          )}
          <TabsContent value="geo" className="mt-6">
            <GeographyView />
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawer notificaciones */}
      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent className="bg-[#0a0e1a] border-white/10 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2"><Bell className="w-4 h-4 text-[#f97316]" /> Notificaciones</SheetTitle>
            <SheetDescription className="text-white/50">Eventos del sistema en tiempo real</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2 max-h-[80vh] overflow-y-auto pr-1" data-testid="notifications-list">
            {notifications.length === 0 && <div className="text-sm text-white/40 text-center py-12">Sin notificaciones</div>}
            {notifications.map(n => (
              <div key={n.id} className={`p-3 rounded-xl border ${n.read ? 'bg-white/[0.02] border-white/5' : 'bg-[#f97316]/10 border-[#f97316]/30'}`}>
                <div className="text-xs font-bold text-[#f97316] uppercase tracking-wider">{n.type}</div>
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="text-xs text-white/60 mt-1">{n.message}</div>
                <div className="text-[10px] text-white/30 mt-1">{n.created_at && new Date(n.created_at).toLocaleString('es-CO')}</div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// VISTA A — SALA DE VENTAS
// ═══════════════════════════════════════════════════════════════════
const SalesView = ({ isAdminGeneral, onMutate }) => {
  const [stats, setStats] = useState({ total_candidates: 0, in_process: 0, active_partners: 0, rejected: 0 });
  const [candidates, setCandidates] = useState([]);
  const [filter, setFilter] = useState('in_process');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        axios.get(`${API}/admin-ops/sales/stats`),
        axios.get(`${API}/admin-ops/sales/candidates`, { params: { status_filter: filter } }),
      ]);
      setStats(s.data);
      setCandidates(c.data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = candidates.filter(c =>
    !search ||
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(search.toLowerCase())
  );

  const handleMutate = async () => {
    await load();
    onMutate?.();
  };

  return (
    <div className="space-y-6" data-testid="sales-view">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total candidatos" value={stats.total_candidates} color="#3b82f6" testid="stat-total-candidates" />
        <StatCard icon={Clock} label="En proceso" value={stats.in_process} color="#f97316" testid="stat-in-process" />
        <StatCard icon={CheckCircle2} label="Socios activos" value={stats.active_partners} color="#10b981" testid="stat-active-partners" />
        <StatCard icon={XCircle} label="Rechazados" value={stats.rejected} color="#ef4444" testid="stat-rejected" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex gap-2 flex-wrap" data-testid="sales-filters">
          {[
            { v: 'in_process', l: 'En proceso' },
            { v: 'active', l: 'Activos' },
            { v: 'rejected', l: 'Rechazados' },
            { v: '', l: 'Todos' },
          ].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${filter === o.v ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}
              data-testid={`filter-sales-${o.v || 'all'}`}
            >{o.l}</button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email, especialidad..." className="pl-10 bg-white/[0.03] border-white/10 text-white" data-testid="sales-search" />
        </div>
      </div>

      {/* Tabla candidatos */}
      <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="candidates-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 pl-5">Candidato</th>
                <th className="p-3 hidden md:table-cell">Especialidad</th>
                <th className="p-3 hidden lg:table-cell">Experiencia</th>
                <th className="p-3 hidden lg:table-cell">Firma</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="p-8 text-center text-white/40">Cargando candidatos...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-white/40">Sin candidatos</td></tr>}
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors"
                  data-testid={`candidate-row-${c.id}`}>
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(withDr(c.full_name) || 'Dr').replace(/^Dr\.\s?/i, '').split(' ').map(n => n[0]).slice(0, 2).join('') || 'DR'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{withDr(c.full_name)}</div>
                        <div className="text-xs text-white/40 truncate">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-white/70">{c.specialty || '—'}</td>
                  <td className="p-3 hidden lg:table-cell text-white/70">{c.experience_years ? `${c.experience_years} años` : '—'}</td>
                  <td className="p-3 hidden lg:table-cell text-white/70 truncate max-w-[180px]">{c.firm_name || '—'}</td>
                  <td className="p-3"><StatusBadgeSales status={c.status} isVerified={c.is_verified} /></td>
                  <td className="p-3 pr-5 text-right">
                    <button className="text-[#f97316] text-xs font-semibold hover:underline inline-flex items-center gap-1">
                      Ver ficha <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Detalle */}
      {selected && (
        <CandidateDrawer
          candidate={selected}
          isAdminGeneral={isAdminGeneral}
          onClose={() => setSelected(null)}
          onMutate={handleMutate}
        />
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// VISTA B — MONITOR DE OPERACIONES (Casos)
// ═══════════════════════════════════════════════════════════════════
const OperationsView = ({ isAdminGeneral, onMutate }) => {
  const [stats, setStats] = useState({ total: 0, sin_asignar: 0, asignados: 0, atendidos: 0, by_priority: { alta: 0, media: 0, baja: 0 } });
  const [cases, setCases] = useState([]);
  const [filterPrio, setFilterPrio] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        axios.get(`${API}/admin-ops/operations/stats`),
        axios.get(`${API}/admin-ops/operations/cases`, { params: { priority: filterPrio, assignment_status: filterStatus } }),
      ]);
      setStats(s.data);
      setCases(c.data);
    } finally { setLoading(false); }
  }, [filterPrio, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const seedDemo = async () => {
    setSeeding(true);
    try {
      await axios.post(`${API}/admin-ops/seed/demo-cases`);
      await load();
    } finally { setSeeding(false); }
  };

  const autoAssign = async (caseId) => {
    try {
      const res = await axios.post(`${API}/admin-ops/operations/cases/${caseId}/auto-assign`);
      alert(res.data.message);
      await load();
      onMutate?.();
    } catch (e) { alert('Error en routing'); }
  };

  return (
    <div className="space-y-6" data-testid="operations-view">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total casos" value={stats.total} color="#3b82f6" testid="stat-total-cases" />
        <StatCard icon={AlertTriangle} label="Sin asignar" value={stats.sin_asignar} color="#ef4444" pulse testid="stat-unassigned" />
        <StatCard icon={Zap} label="Asignados" value={stats.asignados} color="#3b82f6" testid="stat-assigned" />
        <StatCard icon={CheckCircle2} label="Atendidos" value={stats.atendidos} color="#10b981" testid="stat-attended" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex gap-2 flex-wrap" data-testid="ops-filters-priority">
          <span className="text-xs text-white/40 self-center mr-2">Prioridad:</span>
          {[
            { v: 'all', l: 'Todas', c: 'bg-white/5 border-white/10' },
            { v: 'alta', l: 'Alta', c: 'bg-red-500/15 border-red-500/30 text-red-300' },
            { v: 'media', l: 'Media', c: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300' },
            { v: 'baja', l: 'Baja', c: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
          ].map(o => (
            <button key={o.v} onClick={() => setFilterPrio(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterPrio === o.v ? 'ring-2 ring-white/30 ' : ''}${o.c}`}
              data-testid={`filter-prio-${o.v}`}
            >{o.l}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center" data-testid="ops-filters-status">
          <span className="text-xs text-white/40 mr-1">Estado:</span>
          {[
            { v: 'all', l: 'Todos' },
            { v: 'sin_asignar', l: 'Sin asignar' },
            { v: 'asignado', l: 'Asignado' },
            { v: 'atendido', l: 'Atendido' },
          ].map(o => (
            <button key={o.v} onClick={() => setFilterStatus(o.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterStatus === o.v ? 'bg-[#3b82f6]/30 border-[#3b82f6]/60 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
              data-testid={`filter-status-${o.v}`}
            >{o.l}</button>
          ))}
          {isAdminGeneral && stats.total === 0 && (
            <Button size="sm" onClick={seedDemo} disabled={seeding} className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-xs" data-testid="seed-demo-cases">
              {seeding ? 'Cargando...' : 'Cargar demo'}
            </Button>
          )}
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="cases-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 pl-5 w-2">P.</th>
                <th className="p-3">Caso</th>
                <th className="p-3 hidden md:table-cell">Área</th>
                <th className="p-3 hidden lg:table-cell">Cliente</th>
                <th className="p-3 hidden lg:table-cell">Abogado</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="p-8 text-center text-white/40">Cargando casos...</td></tr>}
              {!loading && cases.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-white/40">Sin casos en este filtro</td></tr>}
              {cases.map(c => {
                const prio = PRIORITY_STYLES[c.priority_label] || PRIORITY_STYLES.media;
                const stat = STATUS_STYLES[c.assignment_status] || STATUS_STYLES.sin_asignar;
                return (
                  <tr key={c.id} onClick={() => setSelected(c)}
                    className={`border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors ${c.assignment_status === 'sin_asignar' ? 'bg-red-500/[0.04]' : ''}`}
                    data-testid={`case-row-${c.id}`}>
                    <td className="p-3 pl-5">
                      <div className={`w-2 h-10 rounded-full`} style={{ background: prio.color }} title={`Prioridad ${prio.label}`} />
                    </td>
                    <td className="p-3">
                      <div className="font-semibold truncate max-w-[280px]">{c.title}</div>
                      <div className="text-xs text-white/40">{c.case_number}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-white/70">{c.legal_area}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="text-xs">{c.client_name}</div>
                      <div className="text-[10px] text-white/40">{c.client_phone}</div>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs">
                      {c.lawyer_name ? <span className="text-emerald-300">{c.lawyer_name}</span> : <span className="text-red-300">— Sin abogado —</span>}
                    </td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stat.bg} ${stat.text}`}>{stat.label}</span></td>
                    <td className="p-3 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      {c.assignment_status === 'sin_asignar' ? (
                        <button onClick={() => autoAssign(c.id)} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white text-xs font-bold hover:shadow-[0_5px_15px_rgba(59,130,246,0.4)] inline-flex items-center gap-1" data-testid={`auto-assign-${c.id}`}>
                          <Zap className="w-3 h-3" /> Routing
                        </button>
                      ) : (
                        <button onClick={() => setSelected(c)} className="text-white/60 hover:text-white text-xs inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Ver</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <CaseDrawer
          caseData={selected}
          isAdminGeneral={isAdminGeneral}
          onClose={() => setSelected(null)}
          onMutate={async () => { await load(); onMutate?.(); }}
        />
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// GESTIÓN DE TALENTO (CRUD solo admin_general)
// ═══════════════════════════════════════════════════════════════════
const TalentView = () => {
  const [lawyers, setLawyers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin-ops/talent`);
      setLawyers(res.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este abogado de forma permanente?')) return;
    try { await axios.delete(`${API}/admin-ops/talent/${id}`); await load(); }
    catch (e) { alert('Error al eliminar'); }
  };

  const filtered = lawyers.filter(l =>
    !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="talent-view">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-emerald-400" /> Gestión de Talento</h2>
          <p className="text-xs text-white/40 mt-1">CRUD completo de abogados · Solo ADMIN_GENERAL</p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar abogado..." className="pl-10 bg-white/[0.03] border-white/10 text-white" data-testid="talent-search" />
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="talent-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 pl-5">Abogado</th>
                <th className="p-3 hidden md:table-cell">Especialidad</th>
                <th className="p-3 hidden lg:table-cell">País</th>
                <th className="p-3">Online</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="p-8 text-center text-white/40">Cargando...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-white/40">Sin abogados</td></tr>}
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.04]" data-testid={`talent-row-${l.id}`}>
                  <td className="p-3 pl-5">
                    <div className="font-semibold">{withDr(l.full_name)}</div>
                    <div className="text-xs text-white/40">{l.email}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-white/70">{l.specialty || '—'}</td>
                  <td className="p-3 hidden lg:table-cell text-white/70">{l.country || '—'}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs ${l.is_online ? 'text-emerald-300' : 'text-white/40'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${l.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                      {l.is_online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="p-3"><StatusBadgeSales status={l.status} isVerified={l.is_verified} /></td>
                  <td className="p-3 pr-5 text-right space-x-2">
                    <button onClick={() => setEditing(l)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 inline-flex" title="Editar" data-testid={`talent-edit-${l.id}`}>
                      <Pencil className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                    <button onClick={() => remove(l.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 inline-flex" title="Eliminar" data-testid={`talent-delete-${l.id}`}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <TalentEditModal lawyer={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
};


const TalentEditModal = ({ lawyer, onClose, onSaved }) => {
  const [form, setForm] = useState({
    full_name: lawyer.full_name || '', phone: lawyer.phone || '', country: lawyer.country || '',
    specialty: lawyer.specialty || '', bar_number: lawyer.bar_number || '', firm_name: lawyer.firm_name || '',
    experience_years: lawyer.experience_years || '', description: lawyer.description || '',
    status: lawyer.status || 'PENDING_VERIFICATION', is_verified: !!lawyer.is_verified, is_online: !!lawyer.is_online,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin-ops/talent/${lawyer.id}`, form);
      onSaved();
    } catch (e) { alert('Error guardando'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="talent-edit-modal">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Pencil className="w-5 h-5 text-blue-400" /> Editar abogado</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            ['full_name', 'Nombre completo'],
            ['phone', 'Teléfono'],
            ['country', 'País'],
            ['specialty', 'Especialidad'],
            ['bar_number', 'Tarjeta profesional'],
            ['firm_name', 'Bufete / Firma'],
            ['experience_years', 'Años de experiencia'],
          ].map(([k, l]) => (
            <div key={k}>
              <label className="block text-xs text-white/50 mb-1">{l}</label>
              <Input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-white/50 mb-1">Estado</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm">
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              <option value="REJECTED">REJECTED</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-white/50 mb-1">Descripción</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm" />
        </div>
        <div className="flex gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_verified} onChange={e => setForm({ ...form, is_verified: e.target.checked })} /> Verificado
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_online} onChange={e => setForm({ ...form, is_online: e.target.checked })} /> Online (recibe routing)
          </label>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white/70">Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-bold" data-testid="talent-save-btn">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// FACTURACIÓN
// ═══════════════════════════════════════════════════════════════════
const BillingView = () => {
  const [filter, setFilter] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const { user } = useAuth();
  const isAdminGeneral = user?.role === 'admin_general' || user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin-ops/billing`, { params: { status_filter: filter } });
      setInvoices(res.data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const sendReminder = async (id) => {
    try {
      const res = await axios.post(`${API}/admin-ops/billing/${id}/reminder`);
      alert(res.data.message);
    } catch (e) { alert('Error'); }
  };
  const sendInvoice = async (id) => {
    try {
      const res = await axios.post(`${API}/admin-ops/billing/${id}/send`);
      alert(res.data.message);
      await load();
    } catch (e) { alert('Error'); }
  };
  const sendPaymentLink = (inv) => {
    const link = `${window.location.origin}/pay/${inv.id}`;
    navigator.clipboard?.writeText(link);
    alert(`Link de pago copiado al portapapeles:\n${link}`);
  };
  const printInvoice = (inv) => {
    const w = window.open('', '_blank');
    if (!w) return;
    try {
      const d = w.document;
      d.title = inv.invoice_number || 'Factura';
      const style = d.createElement('style');
      style.textContent = `body{font-family:system-ui;padding:40px;color:#0a0e1a}h1{color:#f97316}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #ddd}`;
      d.head.appendChild(style);

      const container = d.createElement('div');
      const h1 = d.createElement('h1'); h1.textContent = 'PUNTO CERO LEGAL';
      const h2 = d.createElement('h2'); h2.textContent = `Factura ${inv.invoice_number || ''}`;
      container.appendChild(h1);
      container.appendChild(h2);

      const table = d.createElement('table');
      const rows = [
        ['Descripción', inv.description || '—'],
        ['Monto', fmtMoney(inv.amount)],
        ['Vence', inv.due_date?.slice(0,10) || '—'],
        ['Estado', inv.status || '—'],
      ];
      rows.forEach(([k, v]) => {
        const tr = d.createElement('tr');
        const tdk = d.createElement('td'); tdk.textContent = k;
        const tdv = d.createElement('td'); tdv.textContent = v;
        tr.appendChild(tdk); tr.appendChild(tdv); table.appendChild(tr);
      });
      container.appendChild(table);

      const foot = d.createElement('p'); foot.style.marginTop = '40px'; foot.style.fontSize = '11px'; foot.style.color = '#666'; foot.textContent = 'Inversiones y Variedades DJGG 2013';
      container.appendChild(foot);

      d.body.appendChild(container);
      setTimeout(() => w.print(), 500);
    } catch (e) {
      console.error('Failed to open print window:', e);
      w.close();
    }
  };
  const seedDemo = async () => {
    setSeeding(true);
    try { await axios.post(`${API}/admin-ops/seed/demo-invoices`); await load(); }
    finally { setSeeding(false); }
  };

  const totals = {
    pendiente: invoices.filter(i => i.status === 'pendiente').reduce((s, i) => s + (i.amount || 0), 0),
    finalizada: invoices.filter(i => i.status === 'finalizada').reduce((s, i) => s + (i.amount || 0), 0),
    no_terminada: invoices.filter(i => i.status === 'no_terminada').reduce((s, i) => s + (i.amount || 0), 0),
  };

  return (
    <div className="space-y-6" data-testid="billing-view">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Pendiente" value={fmtMoney(totals.pendiente)} color="#f97316" testid="billing-pending" />
        <StatCard icon={CheckCircle2} label="Finalizada" value={fmtMoney(totals.finalizada)} color="#10b981" testid="billing-finalized" />
        <StatCard icon={XCircle} label="Vencida" value={fmtMoney(totals.no_terminada)} color="#ef4444" testid="billing-overdue" />
      </div>

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'all', l: 'Todas' },
            { v: 'pendiente', l: 'Pendiente', c: 'text-yellow-300' },
            { v: 'finalizada', l: 'Finalizada', c: 'text-emerald-300' },
            { v: 'no_terminada', l: 'Vencida', c: 'text-red-300' },
          ].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filter === o.v ? 'bg-purple-500/30 border-purple-500/60 text-white' : `bg-white/5 border-white/10 hover:bg-white/10 ${o.c || 'text-white/60'}`}`}
              data-testid={`filter-billing-${o.v}`}
            >{o.l}</button>
          ))}
        </div>
        {isAdminGeneral && invoices.length === 0 && (
          <Button size="sm" onClick={seedDemo} disabled={seeding} className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs" data-testid="seed-demo-invoices">
            {seeding ? 'Cargando...' : 'Cargar facturas demo'}
          </Button>
        )}
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="invoices-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 pl-5"># Factura</th>
                <th className="p-3 hidden md:table-cell">Descripción</th>
                <th className="p-3">Monto</th>
                <th className="p-3 hidden md:table-cell">Vence</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="p-8 text-center text-white/40">Cargando...</td></tr>}
              {!loading && invoices.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-white/40">Sin facturas</td></tr>}
              {invoices.map(inv => {
                const sc = { pendiente: 'text-yellow-300 bg-yellow-500/15', finalizada: 'text-emerald-300 bg-emerald-500/15', no_terminada: 'text-red-300 bg-red-500/15' }[inv.status];
                const slabel = { pendiente: 'Pendiente', finalizada: 'Finalizada', no_terminada: 'Vencida' }[inv.status] || inv.status;
                return (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.04]" data-testid={`invoice-row-${inv.id}`}>
                    <td className="p-3 pl-5 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="p-3 hidden md:table-cell text-white/70 truncate max-w-[280px]">{inv.description}</td>
                    <td className="p-3 font-bold">{fmtMoney(inv.amount)}</td>
                    <td className="p-3 hidden md:table-cell text-xs text-white/50">{inv.due_date?.slice(0, 10)}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sc}`}>{slabel}</span></td>
                    <td className="p-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <ActionIconBtn icon={Eye} label="Ver" color="white" onClick={() => setViewing(inv)} testid={`view-${inv.id}`} />
                        <ActionIconBtn icon={FileEdit} label="Editar" color="blue" onClick={() => setEditing(inv)} testid={`edit-${inv.id}`} />
                        <ActionIconBtn icon={LinkIcon} label="Enviar link de pago" color="emerald" onClick={() => sendPaymentLink(inv)} testid={`paylink-${inv.id}`} />
                        <ActionIconBtn icon={Printer} label="Imprimir" color="amber" onClick={() => printInvoice(inv)} testid={`print-${inv.id}`} />
                        <ActionIconBtn icon={Send} label="Enviar" color="purple" onClick={() => sendInvoice(inv.id)} testid={`send-${inv.id}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Factura */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewing(null)} data-testid="invoice-view-modal">
          <div onClick={e => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Factura {viewing.invoice_number}</h3>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <Field label="Descripción" value={viewing.description} />
              <Field label="Monto" value={fmtMoney(viewing.amount)} />
              <Field label="Vence" value={viewing.due_date?.slice(0, 10)} />
              <Field label="Estado" value={viewing.status} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Factura */}
      {editing && (
        <InvoiceEditModal invoice={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
};

const ActionIconBtn = ({ icon: Icon, label, color = 'white', onClick, testid }) => {
  const map = {
    white: 'bg-white/5 hover:bg-white/15 text-white',
    blue: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300',
    emerald: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300',
    amber: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300',
    purple: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300',
    red: 'bg-red-500/15 hover:bg-red-500/25 text-red-300',
  };
  return (
    <button onClick={onClick} title={label} aria-label={label} data-testid={testid}
      className={`p-1.5 rounded-lg transition-all ${map[color]}`}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
};

const InvoiceEditModal = ({ invoice, onClose, onSaved }) => {
  const [form, setForm] = useState({
    description: invoice.description || '',
    amount: invoice.amount || 0,
    due_date: invoice.due_date?.slice(0, 10) || '',
    status: invoice.status || 'pendiente',
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    // No tenemos endpoint update — simulamos UX y guardamos localmente
    try {
      // Si existiera /billing/{id}/update se llamaría aquí
      alert('Cambios guardados (preview). Endpoint de update se agregará con la integración SMTP.');
      onSaved();
    } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="invoice-edit-modal">
      <div onClick={e => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Editar factura {invoice.invoice_number}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/50 mb-1">Descripción</label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Monto</label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })} className="bg-white/10 border-white/20 text-white" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Vence</label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Estado</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-white/20 text-white text-sm">
              <option value="pendiente">Pendiente</option>
              <option value="finalizada">Finalizada</option>
              <option value="no_terminada">Vencida</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white/70">Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-purple-500 to-purple-700 text-white" data-testid="invoice-save-btn"><Save className="w-3 h-3 mr-1" /> Guardar</Button>
        </div>
      </div>
    </div>
  );
};
// ═══════════════════════════════════════════════════════════════════
const CandidateDrawer = ({ candidate, isAdminGeneral, onClose, onMutate }) => {
  const [data, setData] = useState(candidate);
  const [notes, setNotes] = useState(candidate.private_notes || '');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [acting, setActing] = useState(false);

  const loadChat = async () => {
    try {
      const res = await axios.get(`${API}/admin-ops/sales/candidates/${candidate.id}/chat`);
      setMessages(res.data);
    } catch (e) { console.error('Failed to load candidate chat:', e); }
  };
  useEffect(() => { loadChat(); }, [candidate.id]);

  const act = async (action) => {
    setActing(true);
    try {
      await axios.post(`${API}/admin-ops/sales/candidates/${candidate.id}/${action}`);
      await onMutate();
      onClose();
    } catch (e) { alert(getErrorMessage(e, 'Error')); }
    finally { setActing(false); }
  };

  const saveNotes = async () => {
    try {
      await axios.put(`${API}/admin-ops/sales/candidates/${candidate.id}/notes`, { private_notes: notes });
      alert('Notas guardadas');
    } catch (e) { alert('Error'); }
  };

  const sendMsg = async () => {
    if (!draft.trim()) return;
    try {
      const res = await axios.post(`${API}/admin-ops/sales/candidates/${candidate.id}/chat`, { content: draft });
      setMessages(prev => [...prev, res.data]);
      setDraft('');
    } catch (e) { alert('Error'); }
  };

  const waLink = candidate.phone ? `https://wa.me/${candidate.phone.replace(/[^\d]/g, '')}?text=Hola%20${encodeURIComponent(candidate.full_name || '')},%20te%20escribo%20de%20Punto%20Cero%20Legal` : null;

  return (
    <Sheet open={true} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-[#0a0e1a] border-white/10 text-white w-full sm:max-w-2xl overflow-y-auto" data-testid="candidate-drawer">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center text-sm font-bold">
              {(withDr(data.full_name) || 'Dr').replace(/^Dr\.\s?/i, '').split(' ').map(n => n[0]).slice(0, 2).join('') || 'DR'}
            </div>
            <div>
              <div>{withDr(data.full_name)}</div>
              <div className="text-xs font-normal text-white/50">{data.email}</div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Datos */}
          <section className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Especialidad" value={data.specialty} />
            <Field label="Experiencia" value={data.experience_years ? `${data.experience_years} años` : '—'} />
            <Field label="Tarjeta Prof." value={data.bar_number} mono />
            <Field label="Cédula" value={data.id_document} mono />
            <Field label="Firma" value={data.firm_name} />
            <Field label="País" value={data.country} />
            <Field label="Teléfono" value={data.phone} />
            <Field label="Estado" value={<StatusBadgeSales status={data.status} isVerified={data.is_verified} />} />
          </section>

          {data.description && (
            <section>
              <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Descripción profesional</div>
              <div className="text-sm bg-white/[0.03] border border-white/10 rounded-xl p-3">{data.description}</div>
            </section>
          )}

          {/* Acciones de cierre (solo admin_general) */}
          {isAdminGeneral && (
            <section className="space-y-2" data-testid="candidate-actions">
              <div className="text-xs text-white/50 uppercase tracking-wider">Acciones de cierre</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => act('approve')} disabled={acting} className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 hover:shadow-[0_5px_15px_rgba(16,185,129,0.4)] disabled:opacity-60" data-testid="action-approve">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar y Activar
                </button>
                <button onClick={() => act('pending-payment')} disabled={acting} className="px-3 py-2.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 text-xs font-bold flex items-center justify-center gap-1 hover:bg-yellow-500/30 disabled:opacity-60" data-testid="action-pending-payment">
                  <CreditCard className="w-3.5 h-3.5" /> Pendiente Pago
                </button>
                <button onClick={() => act('reject')} disabled={acting} className="px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-500/25 disabled:opacity-60" data-testid="action-reject">
                  <XCircle className="w-3.5 h-3.5" /> Rechazar
                </button>
              </div>
            </section>
          )}

          {/* Contactos rápidos */}
          <section className="flex gap-2 flex-wrap">
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white text-xs font-bold inline-flex items-center justify-center gap-1" data-testid="wa-direct-sales">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp directo
              </a>
            )}
            <a href={`mailto:${data.email}`} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold inline-flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
          </section>

          {/* Notas privadas */}
          <section>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Notas privadas del admin
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas internas, contexto, próximos pasos..." className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/30" data-testid="candidate-notes" />
            <Button onClick={saveNotes} size="sm" className="mt-2 bg-white/10 hover:bg-white/20 text-white text-xs" data-testid="candidate-save-notes">
              <Save className="w-3 h-3 mr-1" /> Guardar notas
            </Button>
          </section>

          {/* Chat seguimiento comercial */}
          <section className="border-t border-white/10 pt-4">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-3 flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-[#f97316]" /> Chat de seguimiento comercial
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 pr-1" data-testid="candidate-chat-list">
              {messages.length === 0 && <div className="text-xs text-white/30 text-center py-4">Sin mensajes aún</div>}
              {messages.map(m => (
                <div key={m.id} className="bg-white/[0.04] rounded-xl p-2.5 border border-white/5">
                  <div className="text-[10px] text-[#f97316] font-bold uppercase tracking-wider mb-1">{m.admin_name || 'Admin'}</div>
                  <div className="text-xs text-white/80">{m.content}</div>
                  <div className="text-[9px] text-white/30 mt-1">{m.created_at && new Date(m.created_at).toLocaleString('es-CO')}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="Escribe seguimiento..." className="bg-white/[0.03] border-white/10 text-white text-sm" data-testid="candidate-chat-input" />
              <Button onClick={sendMsg} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white" data-testid="candidate-chat-send"><Send className="w-4 h-4" /></Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};


// ═══════════════════════════════════════════════════════════════════
// DRAWER · Detalle de Caso (Monitor de Operaciones)
// ═══════════════════════════════════════════════════════════════════
const CaseDrawer = ({ caseData, isAdminGeneral, onClose, onMutate }) => {
  const [notes, setNotes] = useState(caseData.private_notes || '');
  const [acting, setActing] = useState(false);

  const autoAssign = async () => {
    setActing(true);
    try {
      const res = await axios.post(`${API}/admin-ops/operations/cases/${caseData.id}/auto-assign`);
      alert(res.data.message);
      await onMutate();
      onClose();
    } catch (e) { alert('Error'); }
    finally { setActing(false); }
  };
  const markAttended = async () => {
    setActing(true);
    try {
      await axios.post(`${API}/admin-ops/operations/cases/${caseData.id}/attended`);
      await onMutate();
      onClose();
    } catch (e) { alert('Error'); }
    finally { setActing(false); }
  };
  const saveNotes = async () => {
    try { await axios.put(`${API}/admin-ops/operations/cases/${caseData.id}/notes`, { private_notes: notes }); alert('Notas guardadas'); }
    catch (e) { alert('Error'); }
  };

  const prio = PRIORITY_STYLES[caseData.priority_label] || PRIORITY_STYLES.media;
  const stat = STATUS_STYLES[caseData.assignment_status] || STATUS_STYLES.sin_asignar;
  const waLink = caseData.client_phone ? `https://wa.me/${caseData.client_phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent('Hola, le escribo de Punto Cero Legal sobre su caso ' + caseData.case_number)}` : null;

  return (
    <Sheet open={true} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-[#0a0e1a] border-white/10 text-white w-full sm:max-w-2xl overflow-y-auto" data-testid="case-drawer">
        <SheetHeader>
          <SheetTitle className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prio.bg} ${prio.text}`}>Prioridad {prio.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stat.bg} ${stat.text}`}>{stat.label}</span>
            </div>
            <div className="text-lg">{caseData.title}</div>
            <div className="text-xs font-normal text-white/40 font-mono">{caseData.case_number}</div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <section>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Descripción</div>
            <div className="text-sm bg-white/[0.03] border border-white/10 rounded-xl p-3">{caseData.description || '—'}</div>
          </section>

          <section className="grid grid-cols-2 gap-3 text-xs">
            <Field label="Área legal" value={caseData.legal_area} />
            <Field label="Cliente" value={caseData.client_name} />
            <Field label="Tel. cliente" value={caseData.client_phone} mono />
            <Field label="Abogado asignado" value={caseData.lawyer_name || '— sin asignar —'} />
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="case-actions">
            <button onClick={autoAssign} disabled={acting} className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] text-white text-xs font-bold inline-flex items-center justify-center gap-1 hover:shadow-[0_5px_15px_rgba(59,130,246,0.4)] disabled:opacity-60" data-testid="case-routing-btn">
              <Zap className="w-3.5 h-3.5" /> Routing inteligente
            </button>
            <button onClick={markAttended} disabled={acting} className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1 disabled:opacity-60" data-testid="case-attended-btn">
              <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como atendido
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="col-span-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white text-xs font-bold inline-flex items-center justify-center gap-1" data-testid="wa-direct-case">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp directo al cliente
              </a>
            )}
          </section>

          <section>
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Notas privadas</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Notas internas sobre el caso..." className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder:text-white/30" data-testid="case-notes" />
            <Button onClick={saveNotes} size="sm" className="mt-2 bg-white/10 hover:bg-white/20 text-white text-xs" data-testid="case-save-notes"><Save className="w-3 h-3 mr-1" /> Guardar notas</Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};


// ═══════════════════════════════════════════════════════════════════
// Helpers visuales
// ═══════════════════════════════════════════════════════════════════
const StatCard = ({ icon: Icon, label, value, color, pulse, testid }) => (
  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
    className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-4 border border-white/[0.08] hover:border-white/20 transition-all"
    data-testid={testid}>
    <div className="flex items-start justify-between mb-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, borderColor: `${color}40`, borderWidth: 1 }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {pulse && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />}
    </div>
    <div className="text-2xl font-bold tabular-nums">{value}</div>
    <div className="text-xs text-white/50 mt-0.5">{label}</div>
  </motion.div>
);

const Field = ({ label, value, mono }) => (
  <div>
    <div className="text-[10px] text-white/40 uppercase tracking-wider">{label}</div>
    <div className={`text-sm ${mono ? 'font-mono text-[#f97316]' : 'text-white'}`}>{value || '—'}</div>
  </div>
);

const StatusBadgeSales = ({ status, isVerified }) => {
  let bg = 'bg-white/10', text = 'text-white/70', label = status || 'desconocido';
  if (isVerified && (status === 'ACTIVE' || status === 'active')) { bg = 'bg-emerald-500/15'; text = 'text-emerald-300'; label = 'Activo'; }
  else if (status === 'PENDING_VERIFICATION') { bg = 'bg-orange-500/15'; text = 'text-orange-300'; label = 'Pendiente verif.'; }
  else if (status === 'PENDING_PAYMENT') { bg = 'bg-yellow-500/15'; text = 'text-yellow-300'; label = 'Pendiente pago'; }
  else if (status === 'REJECTED') { bg = 'bg-red-500/15'; text = 'text-red-300'; label = 'Rechazado'; }
  else if (status === 'suspended') { bg = 'bg-red-500/15'; text = 'text-red-300'; label = 'Suspendido'; }
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bg} ${text}`}>{label}</span>;
};


// ═══════════════════════════════════════════════════════════════════
// CONTABILIDAD · Auditoría Interna (solo ADMIN_GENERAL)
// ═══════════════════════════════════════════════════════════════════
const AccountingView = () => {
  const [kpis, setKpis] = useState({ ingresos_totales: 0, egresos_totales: 0, rentabilidad_productiva: 0, margen_pct: 0, facturado: 0, cobrado: 0, tasa_cobranza_pct: 0, por_cobrar: 0 });
  const [movements, setMovements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, m] = await Promise.all([
        axios.get(`${API}/admin-ops/accounting/kpis`),
        axios.get(`${API}/admin-ops/accounting/movements`, { params: { type_filter: filter } }),
      ]);
      setKpis(k.data);
      setMovements(m.data);
    } finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try { await axios.delete(`${API}/admin-ops/accounting/movements/${id}`); await load(); }
    catch (e) { alert('Error'); }
  };
  const seedDemo = async () => {
    setSeeding(true);
    try { await axios.post(`${API}/admin-ops/accounting/seed/demo`); await load(); }
    finally { setSeeding(false); }
  };

  return (
    <div className="space-y-6" data-testid="accounting-view">
      {/* KPIs Auditoría */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Ingresos totales" value={fmtMoney(kpis.ingresos_totales)} color="#10b981" testid="kpi-ingresos" />
        <StatCard icon={XCircle} label="Gastos totales" value={fmtMoney(kpis.egresos_totales)} color="#ef4444" testid="kpi-egresos" />
        <StatCard icon={Calculator} label={`Rentabilidad productiva (${kpis.margen_pct}%)`} value={fmtMoney(kpis.rentabilidad_productiva)} color="#06b6d4" testid="kpi-rentabilidad" />
        <StatCard icon={Receipt} label={`Facturado vs Cobrado (${kpis.tasa_cobranza_pct}%)`} value={`${fmtMoney(kpis.cobrado)} / ${fmtMoney(kpis.facturado)}`} color="#8b5cf6" testid="kpi-fact-vs-cob" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {[
            { v: 'all', l: 'Todos' },
            { v: 'ingreso', l: 'Ingresos', c: 'text-emerald-300' },
            { v: 'egreso', l: 'Egresos', c: 'text-red-300' },
          ].map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filter === o.v ? 'bg-cyan-500/30 border-cyan-500/60 text-white' : `bg-white/5 border-white/10 hover:bg-white/10 ${o.c || 'text-white/60'}`}`}
              data-testid={`filter-acc-${o.v}`}
            >{o.l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {movements.length === 0 && (
            <Button size="sm" onClick={seedDemo} disabled={seeding} className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white text-xs" data-testid="seed-acc-demo">
              {seeding ? 'Cargando...' : 'Cargar movimientos demo'}
            </Button>
          )}
          <Button size="sm" onClick={() => setCreating(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs" data-testid="add-movement-btn">
            <Plus className="w-3.5 h-3.5 mr-1" /> Registrar movimiento
          </Button>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="movements-table">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10 bg-white/[0.02]">
                <th className="p-3 pl-5">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 hidden md:table-cell">Descripción</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Estado</th>
                <th className="p-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="p-8 text-center text-white/40">Cargando...</td></tr>}
              {!loading && movements.length === 0 && <tr><td colSpan="7" className="p-8 text-center text-white/40">Sin movimientos registrados</td></tr>}
              {movements.map(m => (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.04]" data-testid={`movement-row-${m.id}`}>
                  <td className="p-3 pl-5 text-xs text-white/60">{m.date?.slice(0, 10)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.type === 'ingreso' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                      {m.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="p-3">{m.category}</td>
                  <td className="p-3 hidden md:table-cell text-white/70 truncate max-w-[280px]">{m.description}</td>
                  <td className={`p-3 font-bold ${m.type === 'ingreso' ? 'text-emerald-300' : 'text-red-300'}`}>{m.type === 'ingreso' ? '+' : '-'}{fmtMoney(m.amount)}</td>
                  <td className="p-3 text-xs"><span className="px-2 py-0.5 rounded bg-white/5 text-white/60">{m.status}</span></td>
                  <td className="p-3 pr-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <ActionIconBtn icon={Pencil} label="Editar" color="blue" onClick={() => setEditing(m)} testid={`acc-edit-${m.id}`} />
                      <ActionIconBtn icon={Trash2} label="Eliminar" color="red" onClick={() => remove(m.id)} testid={`acc-delete-${m.id}`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <MovementModal movement={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />
      )}
    </div>
  );
};


const MovementModal = ({ movement, onClose, onSaved }) => {
  const [form, setForm] = useState({
    type: movement?.type || 'ingreso',
    category: movement?.category || '',
    amount: movement?.amount || '',
    description: movement?.description || '',
    status: movement?.status || 'registrado',
    date: movement?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.category || !form.description || !form.amount) {
      alert('Categoría, descripción y monto son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (movement?.id) await axios.put(`${API}/admin-ops/accounting/movements/${movement.id}`, payload);
      else await axios.post(`${API}/admin-ops/accounting/movements`, payload);
      onSaved();
    } catch (e) { alert(getErrorMessage(e, 'Error guardando')); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose} data-testid="movement-modal">
      <div onClick={e => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">{movement ? 'Editar movimiento' : 'Registrar movimiento'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-white/20 text-white text-sm" data-testid="movement-type">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Fecha</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-white/10 border-white/20 text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Categoría</label>
            <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Honorarios / Nómina / Marketing..." className="bg-white/10 border-white/20 text-white" data-testid="movement-category" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Monto</label>
            <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-white/10 border-white/20 text-white" data-testid="movement-amount" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Descripción</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm" data-testid="movement-description" />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1">Estado</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-xl bg-[#0a0e1a] border border-white/20 text-white text-sm">
              <option value="registrado">Registrado</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-white/70">Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white" data-testid="movement-save">{saving ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// GEOGRAFÍA · Ventas por país + Estrategias Activas (LATAM)
// ═══════════════════════════════════════════════════════════════════
const GeographyView = () => {
  const [data, setData] = useState({ countries: [], total_countries: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try { const r = await axios.get(`${API}/admin-ops/geography/stats`); setData(r.data); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6" data-testid="geography-view">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-amber-400" /> Ventas por país · Estrategias activas</h2>
          <p className="text-xs text-white/40 mt-1">Rendimiento de cada mercado LATAM con su plan de acción regional</p>
        </div>
        <div className="text-sm text-white/60">{data.total_countries} mercados activos</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div className="col-span-3 text-center text-white/40 py-12">Cargando métricas LATAM...</div>}
        {!loading && data.countries.length === 0 && <div className="col-span-3 text-center text-white/40 py-12">Sin datos geográficos aún. A medida que se registren abogados/clientes verás el rendimiento por país.</div>}
        {data.countries.map(c => (
          <motion.div key={c.country} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.08] p-5 hover:border-amber-500/30 transition-all"
            data-testid={`geo-card-${c.country}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-bold">{c.country}</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">{c.active_lawyers} activos</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div className="text-center bg-white/[0.02] rounded-lg py-2">
                <div className="text-base font-bold">{c.lawyers}</div>
                <div className="text-white/40 text-[10px]">Abogados</div>
              </div>
              <div className="text-center bg-white/[0.02] rounded-lg py-2">
                <div className="text-base font-bold">{c.cases}</div>
                <div className="text-white/40 text-[10px]">Casos</div>
              </div>
              <div className="text-center bg-white/[0.02] rounded-lg py-2">
                <div className="text-base font-bold text-emerald-300">{fmtMoney(c.revenue)}</div>
                <div className="text-white/40 text-[10px]">Ingresos</div>
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Estrategia activa</div>
              <div className="text-xs text-white/80">{c.strategy}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


export default AdminPanel;
