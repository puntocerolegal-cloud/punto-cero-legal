import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Briefcase, TrendingUp, Users, DollarSign, Globe, Activity, Shield,
  AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Filter,
  LogOut, Scale, BarChart3, Zap, FileText, CreditCard, Mail, Link2, Eye,
  Calendar, MapPin, Sparkles, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LATAM_COUNTRIES = [
  'ALL', 'Colombia', 'México', 'Argentina', 'Chile', 'Perú', 'Venezuela', 'Ecuador',
  'España', 'Estados Unidos', 'Brasil', 'Bolivia', 'Uruguay', 'Paraguay',
  'Costa Rica', 'Panamá', 'República Dominicana', 'Guatemala', 'El Salvador'
];

const fmtMoney = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtNum = (n) => new Intl.NumberFormat('es-CO').format(n);

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [country, setCountry] = useState('ALL');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);

  const isAdminGeneral = user?.role === 'admin_general' || user?.role === 'admin';
  const isSocioComercial = user?.role === 'socio_comercial';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!['admin', 'admin_general', 'socio_comercial'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [country, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const profileRes = await axios.get(`${API}/admin/me`);
      setAdminProfile(profileRes.data);

      const endpoint = isAdminGeneral ? '/admin/dashboard/general' : '/admin/dashboard/comercial';
      const res = await axios.get(`${API}${endpoint}`, { params: { country } });
      setData(res.data);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#f97316] animate-spin" />
          <div className="text-white/60">Cargando panel administrativo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] text-white">
      {/* Ambient Glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[#f97316]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-[#3b82f6]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-6 lg:p-10 max-w-[1800px] mx-auto">
        {/* Header Bar */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8 backdrop-blur-xl bg-white/[0.03] rounded-2xl px-6 py-4 border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <Scale className="w-7 h-7 text-[#f97316]" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Panel de Control</div>
              <div className="font-bold text-lg">Punto Cero Legal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-white/60">
              <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Sistema Operativo</span>
            </div>
            <Button onClick={() => { logout(); navigate('/'); }} variant="outline" className="border-white/10 text-white/70 hover:bg-white/5" data-testid="admin-logout">
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
          </div>
        </motion.header>

        {/* Welcome Banner */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 backdrop-blur-xl"
          style={{
            background: isAdminGeneral
              ? 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(15,23,42,0.5) 50%, rgba(59,130,246,0.15) 100%)'
              : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(15,23,42,0.5) 50%, rgba(236,72,153,0.15) 100%)'
          }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#f97316]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 ${isAdminGeneral ? 'bg-gradient-to-br from-[#f97316] to-[#fb923c]' : 'bg-gradient-to-br from-[#10b981] to-[#3b82f6]'}`}>
                {isAdminGeneral ? <Crown className="w-10 h-10" /> : <Briefcase className="w-10 h-10" />}
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: isAdminGeneral ? '#f97316' : '#10b981' }}>
                  ◆ {isAdminGeneral ? 'Administrador General' : 'Socio Comercial'}
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                  {getTimeGreeting()}, <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">{adminProfile?.full_name}</span>
                </h1>
                <p className="text-white/60">
                  {isAdminGeneral
                    ? 'Dashboard ejecutivo de los 18 mercados · Salud del sistema y auditoría global'
                    : 'Pipeline comercial · Gestión de leads y enlaces de pago en tiempo real'}
                </p>
              </div>
              <div className="text-right hidden lg:block">
                <div className="text-xs text-white/40 uppercase mb-1">Fecha</div>
                <div className="font-semibold">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Country Filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Filter className="w-4 h-4" /> Filtrar por mercado:
          </div>
          <div className="flex flex-wrap gap-2">
            {LATAM_COUNTRIES.slice(0, 10).map(c => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${country === c ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}`}
                data-testid={`filter-${c.toLowerCase()}`}
              >
                {c === 'ALL' ? '🌎 Todos' : c}
              </button>
            ))}
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/60">
              <option value="" disabled>Más países...</option>
              {LATAM_COUNTRIES.slice(10).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </motion.div>

        {/* Content por Rol */}
        {isAdminGeneral ? <AdminGeneralView data={data} /> : <SocioComercialView data={data} />}
      </div>
    </div>
  );
};

// ============== ADMIN GENERAL ==============
const AdminGeneralView = ({ data }) => {
  const { kpis, countries, system_health, audit_logs } = data;
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const res = await axios.get(`${API}/admin/access-audit/pending`);
      setPendingUsers(res.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoadingPending(false); }
  };

  const approveUser = async (userId) => {
    try {
      await axios.post(`${API}/admin/access-audit/${userId}/approve`);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (e) { alert('Error al aprobar'); }
  };

  const rejectUser = async (userId) => {
    if (!window.confirm('¿Rechazar este acceso?')) return;
    try {
      await axios.post(`${API}/admin/access-audit/${userId}/reject`);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (e) { alert('Error al rechazar'); }
  };

  return (
    <div className="space-y-8">
      {/* KPIs Ejecutivos */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#f97316]" /> Centro de Comando · KPIs Globales
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'MRR Global', value: fmtMoney(kpis.mrr), icon: DollarSign, color: '#10b981', change: '+18.4%' },
            { label: 'Abogados Activos', value: fmtNum(kpis.active_users), icon: Users, color: '#3b82f6', change: '+12%' },
            { label: 'Tasa Conversión', value: `${kpis.conversion_rate}%`, icon: TrendingUp, color: '#f97316', change: '+2.3pp' },
            { label: 'Leads Totales', value: fmtNum(kpis.total_leads), icon: Sparkles, color: '#ec4899', change: '+24%' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-5 border border-white/[0.08] hover:border-white/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}20`, borderColor: `${kpi.color}40`, borderWidth: 1 }}>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981]">
                  <ArrowUpRight className="w-3 h-3" /> {kpi.change}
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
              <div className="text-xs text-white/50">{kpi.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Markets + System Health */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* Markets Map */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-[#3b82f6]" /> 18 Mercados LATAM</h3>
            <span className="text-xs text-white/40 uppercase">Ranking por revenue</span>
          </div>
          <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
            {countries.sort((a, b) => b.revenue - a.revenue).map((c, i) => (
              <motion.div key={c.country} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/5">
                <div className="text-2xl">{c.flag}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm truncate">{c.country}</div>
                    <div className="text-xs text-[#10b981] font-semibold flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> +{c.growth}%
                    </div>
                  </div>
                  <div className="text-xs text-white/40">{c.users} abogados · {c.leads} leads</div>
                  <div className="mt-1.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#f97316] to-[#fb923c]" style={{ width: `${Math.min(c.revenue / 100000, 100)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{fmtMoney(c.revenue)}</div>
                  <div className="text-xs text-white/40">mensual</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-gradient-to-br from-[#10b981]/10 to-transparent rounded-2xl p-5 border border-[#10b981]/30">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[#10b981]">
              <Shield className="w-4 h-4" /> Salud del Sistema
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">API Uptime</span>
                  <span className="font-bold text-[#10b981]">{system_health.api_uptime}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${system_health.api_uptime}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">Respuesta promedio</span>
                  <span className="font-bold">{system_health.avg_response_ms}ms</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-[#3b82f6]">{system_health.active_sessions}</div>
                  <div className="text-xs text-white/50">Sesiones</div>
                </div>
                <div className="text-center p-2 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-[#f97316]">{system_health.storage_used_gb}GB</div>
                  <div className="text-xs text-white/50">Storage</div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-5 border border-white/[0.08]">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#8b5cf6]" /> Auditoría Global
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {audit_logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-white/40">{log.user} · {log.country}</div>
                    <div className="text-xs text-white/30 mt-0.5">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ AUDITORÍA DE ACCESO ============ */}
      <section className="backdrop-blur-xl bg-gradient-to-br from-[#f97316]/[0.04] to-white/[0.02] rounded-2xl p-6 border border-[#f97316]/30">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#f97316]" /> Auditoría de Acceso · Compliance
          </h3>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#f97316]/20 text-[#f97316] text-xs font-bold">
              {pendingUsers.length} pendiente(s)
            </span>
            <button onClick={loadPending} className="p-2 rounded-lg hover:bg-white/10" title="Refrescar">
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {loadingPending ? (
          <div className="text-center py-8 text-white/40">Cargando solicitudes...</div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-[#10b981] mx-auto mb-3 opacity-60" />
            <p className="text-white/60">No hay solicitudes pendientes de verificación</p>
            <p className="text-xs text-white/30 mt-1">Todo al día con compliance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(u => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="backdrop-blur-md bg-white/[0.03] rounded-xl p-4 border border-white/10 hover:border-[#f97316]/30 transition-all">
                <div className="grid lg:grid-cols-12 gap-4 items-center">
                  {/* Avatar + Nombre */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center font-bold flex-shrink-0">
                      {(u.full_name || 'AB').split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{u.full_name}</div>
                      <div className="text-xs text-white/40 truncate">{u.email}</div>
                    </div>
                  </div>

                  {/* Datos profesionales */}
                  <div className="lg:col-span-6 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-white/40 uppercase text-[10px]">Tarjeta Prof.</div>
                      <div className="font-mono text-[#f97316]">{u.bar_number || '—'}</div>
                    </div>
                    <div>
                      <div className="text-white/40 uppercase text-[10px]">Cédula</div>
                      <div className="font-mono">{u.id_document || '—'}</div>
                    </div>
                    <div>
                      <div className="text-white/40 uppercase text-[10px]">Firma</div>
                      <div className="truncate">{u.firm_name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-white/40 uppercase text-[10px]">País · Especialidad</div>
                      <div className="truncate">{u.country} · {u.specialty}</div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="lg:col-span-3 flex gap-2 justify-end">
                    <button
                      onClick={() => rejectUser(u.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all"
                      data-testid={`reject-${u.id}`}
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => approveUser(u.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-xs font-bold hover:shadow-[0_5px_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1"
                      data-testid={`approve-${u.id}`}
                    >
                      <CheckCircle2 className="w-3 h-3" /> Aprobar Acceso
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

// ============== SOCIO COMERCIAL ==============
const SocioComercialView = ({ data }) => {
  const { kpis, pipeline, leads, payment_links, alerts } = data;
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ client_name: '', client_email: '', country: 'Colombia', amount: 99000 });

  const createLink = async () => {
    try {
      const res = await axios.post(`${API}/admin/payment-links`, linkForm);
      navigator.clipboard.writeText(res.data.link);
      alert(`✅ Enlace creado y copiado: ${res.data.link}`);
      setShowCreateLink(false);
      setLinkForm({ client_name: '', client_email: '', country: 'Colombia', amount: 99000 });
    } catch (e) {
      alert('Error al crear enlace');
    }
  };

  const statusColors = {
    paid: '#10b981', sent: '#3b82f6', pending: '#f97316', expired: '#ef4444',
    registered: '#3b82f6', no_payment: '#f97316'
  };

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#10b981]" /> Centro Comercial · KPIs en Vivo
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pipeline Total', value: fmtMoney(kpis.total_pipeline_value), icon: TrendingUp, color: '#10b981' },
            { label: 'Conversión Lead→Pago', value: `${kpis.conversion_rate}%`, icon: BarChart3, color: '#f97316' },
            { label: 'Leads Activos', value: fmtNum(kpis.active_leads), icon: Users, color: '#3b82f6' },
            { label: 'Pagos Pendientes', value: kpis.pending_payments, icon: Clock, color: '#ec4899' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-5 border border-white/[0.08]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${kpi.color}20` }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <div className="text-2xl font-bold mb-1">{kpi.value}</div>
              <div className="text-xs text-white/50">{kpi.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pipeline Visual */}
      <section className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#f97316]" /> Pipeline de Ventas
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {pipeline.map((stage, i) => (
            <motion.div key={stage.stage} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="relative backdrop-blur-md rounded-xl p-4 border" style={{ background: `${stage.color}10`, borderColor: `${stage.color}30` }}>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: stage.color }}>{stage.stage}</div>
              <div className="text-3xl font-bold mb-1">{fmtNum(stage.count)}</div>
              {stage.value > 0 && <div className="text-xs text-white/50">{fmtMoney(stage.value)}</div>}
              <div className="mt-3 w-full h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ background: stage.color, width: `${Math.min((stage.count / pipeline[0].count) * 100, 100)}%` }} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Payment Links */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#10b981]" /> Enlaces de Pago</h3>
            <Button onClick={() => setShowCreateLink(true)} className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-sm" data-testid="create-payment-link">
              <Link2 className="w-4 h-4 mr-2" /> Nuevo Enlace
            </Button>
          </div>
          <div className="space-y-2">
            {payment_links.map(link => (
              <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${statusColors[link.status]}20` }}>
                  <CreditCard className="w-5 h-5" style={{ color: statusColors[link.status] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{link.client}</div>
                  <div className="text-xs text-white/40">{link.country} · {link.created}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{fmtMoney(link.amount)}</div>
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: `${statusColors[link.status]}20`, color: statusColors[link.status] }}>
                    {link.status}
                  </span>
                </div>
                <button className="p-2 rounded-lg hover:bg-white/10" onClick={() => navigator.clipboard.writeText(link.url)}>
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial Alerts */}
        <div className="backdrop-blur-xl bg-gradient-to-br from-[#f97316]/10 to-transparent rounded-2xl p-5 border border-[#f97316]/30">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-[#f97316]">
            <AlertTriangle className="w-4 h-4" /> Alertas Comerciales
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className={`p-3 rounded-xl border ${alert.priority === 'high' ? 'bg-red-500/10 border-red-500/30' : alert.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: alert.priority === 'high' ? '#ef4444' : alert.priority === 'medium' ? '#fbbf24' : '#3b82f6' }}>
                  {alert.priority}
                </div>
                <div className="text-sm">{alert.message}</div>
                {alert.country && <div className="text-xs text-white/40 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {alert.country}</div>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-2"><Users className="w-5 h-5 text-[#3b82f6]" /> Leads Recientes (desde Landing)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-white/40 border-b border-white/10">
                <th className="pb-3">Abogado</th>
                <th className="pb-3 hidden md:table-cell">País</th>
                <th className="pb-3 hidden lg:table-cell">Especialidad</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 10).map(lead => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3">
                    <div className="font-semibold text-sm">{lead.name}</div>
                    <div className="text-xs text-white/40">{lead.email}</div>
                  </td>
                  <td className="py-3 text-sm hidden md:table-cell">{lead.country}</td>
                  <td className="py-3 text-sm hidden lg:table-cell">{lead.specialty}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ background: `${statusColors[lead.status]}20`, color: statusColors[lead.status] }}>
                      {lead.status === 'registered' ? 'Registrado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Payment Link Modal */}
      {showCreateLink && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateLink(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Crear Enlace de Pago</h2>
            <div className="space-y-3">
              <Input placeholder="Nombre del cliente" value={linkForm.client_name} onChange={(e) => setLinkForm({ ...linkForm, client_name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <Input placeholder="Email" type="email" value={linkForm.client_email} onChange={(e) => setLinkForm({ ...linkForm, client_email: e.target.value })} className="bg-white/10 border-white/20 text-white" />
              <select value={linkForm.country} onChange={(e) => setLinkForm({ ...linkForm, country: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                {LATAM_COUNTRIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
              <Input type="number" placeholder="Monto" value={linkForm.amount} onChange={(e) => setLinkForm({ ...linkForm, amount: parseFloat(e.target.value) })} className="bg-white/10 border-white/20 text-white" />
              <Button onClick={createLink} className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold">Generar y Copiar Enlace</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminPanel;
