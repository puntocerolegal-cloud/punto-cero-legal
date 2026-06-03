import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FolderKanban, Calendar, Receipt, TrendingUp, AlertCircle,
  Clock, MapPin, Briefcase, Phone, Mail, Award, IdCard, Building2,
  ArrowUpRight, Activity, Bell, CheckCircle2, Gift, Share2, Copy, MessageCircle, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatDate = (date) => {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (date) => {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const StatCard = ({ icon: Icon, label, value, change, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
  >
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: `${color}20`, borderColor: `${color}40`, borderWidth: 1, borderStyle: 'solid' }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      {change && (
        <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981]">
          <TrendingUp className="w-3 h-3" />
          {change}
        </div>
      )}
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-white/60">{label}</div>
  </motion.div>
);

export const DashboardHome = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [referralData, setReferralData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [apiAlerts, setApiAlerts] = useState([]);

  const loadReferralData = useCallback(async () => {
    try {
      const [codeRes, notifRes] = await Promise.all([
        axios.get(`${API}/referrals/my-code`),
        axios.get(`${API}/referrals/notifications`)
      ]);
      setReferralData(codeRes.data);
      setNotifications(notifRes.data.notifications || []);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('No referral data', e);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [kpiRes, alertRes] = await Promise.all([
        axios.get(`${API}/dashboard/kpis/${user.id}`),
        axios.get(`${API}/dashboard/alerts/${user.id}`)
      ]);
      setKpis(kpiRes.data);
      setApiAlerts(alertRes.data || []);
    } catch (e) {
      // Backend puede no tener datos aún — se mantienen valores por defecto
    }
  }, [user?.id]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    loadReferralData();
    loadDashboardData();
    return () => clearInterval(timer);
  }, [loadReferralData, loadDashboardData]);

  const shareWhatsApp = () => {
    if (referralData) {
      window.open(`https://wa.me/?text=${encodeURIComponent(referralData.whatsapp_message)}`, '_blank');
    }
  };

  const copyLink = () => {
    if (referralData) {
      navigator.clipboard.writeText(referralData.share_url);
    }
  };

  const stats = [
    { icon: Users, label: 'Leads Totales', value: kpis ? String(kpis.total_leads) : '—', color: '#3b82f6' },
    { icon: FolderKanban, label: 'Casos Activos', value: kpis ? String(kpis.active_cases) : '—', color: '#f97316' },
    { icon: Calendar, label: 'Citas Programadas', value: kpis ? String(kpis.upcoming_appointments) : '—', color: '#8b5cf6' },
    { icon: AlertCircle, label: 'Facturas Pendientes', value: kpis ? String(kpis.pending_invoices) : '—', color: '#ec4899' },
    { icon: Receipt, label: 'Casos Cerrados', value: kpis ? String(kpis.closed_cases) : '—', color: '#10b981' },
    { icon: TrendingUp, label: 'Facturación Total', value: kpis ? fmtCurrency(kpis.total_revenue) : '—', color: '#14b8a6' },
  ];

  const recentActivity = [
    { type: 'case', text: 'Nuevo caso registrado: Divorcio Express', time: 'Hace 5 min', color: '#3b82f6' },
    { type: 'meeting', text: 'Reunión completada con cliente Juan Pérez', time: 'Hace 1 hora', color: '#10b981' },
    { type: 'invoice', text: 'Factura #INV-2025-00342 pagada', time: 'Hace 2 horas', color: '#f97316' },
    { type: 'document', text: 'Documento firmado: Contrato de servicios', time: 'Hace 3 horas', color: '#8b5cf6' },
  ];

  const priorityIcon = { high: Calendar, medium: Receipt, low: Users };
  const alerts = apiAlerts.length > 0
    ? apiAlerts.slice(0, 5).map(a => ({
        priority: a.priority,
        text: a.message,
        icon: priorityIcon[a.priority] || AlertCircle
      }))
    : [
        { priority: 'high', text: 'Audiencia mañana 9:00 AM - Caso López', icon: Calendar },
        { priority: 'medium', text: '3 facturas próximas a vencer', icon: Receipt },
        { priority: 'low', text: '5 nuevos leads sin contactar', icon: Users },
      ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pt-12 lg:pt-0">
        {/* Welcome Section */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl lg:text-5xl font-bold mb-2">
            {getGreeting()}, <span className="bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">{user?.full_name || 'Doctor'}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/60 mt-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#3b82f6]" />
              <span>{user?.country || 'Colombia'}</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#10b981]" />
              <span className="capitalize">{formatDate(currentTime)}</span>
            </div>
            <span className="text-white/30">•</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#f97316]" />
              <span className="font-semibold text-white">{formatTime(currentTime)}</span>
            </div>
          </div>
        </motion.div>

        {/* Referral Rewards Banner */}
        {referralData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-gradient-to-r from-[#10b981]/15 via-[#f97316]/10 to-[#10b981]/15 rounded-2xl p-5 border border-[#10b981]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center flex-shrink-0">
                <Gift className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">Programa de Referidos</h3>
                  {referralData.free_months_credits > 0 && (
                    <span className="text-xs bg-[#10b981] text-white px-2 py-0.5 rounded-full font-bold">
                      🎉 {referralData.free_months_credits} mes(es) gratis acumulados
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70">
                  Invita colegas y obtén <strong className="text-[#10b981]">1 mes gratis</strong> por cada referido que pague.
                  Has referido a <strong>{referralData.total_referrals}</strong> abogados.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setShowShareModal(true)} className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white" data-testid="share-referral">
                  <Share2 className="w-4 h-4 mr-2" /> Compartir
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications de Recompensa */}
        {notifications.filter(n => !n.read && n.type === 'referral_reward').slice(0, 1).map(notif => (
          <motion.div key={notif._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-gradient-to-r from-[#f97316]/20 to-[#fb923c]/20 rounded-2xl p-4 border border-[#f97316]/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-[#f97316]">{notif.title}</div>
              <div className="text-sm text-white/70">{notif.message}</div>
            </div>
          </motion.div>
        ))}

        {/* Professional Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/[0.02] to-white/5 rounded-3xl p-6 lg:p-8 border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3b82f6]/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#f97316] via-[#fb923c] to-[#ec4899] flex items-center justify-center text-3xl font-bold border-2 border-white/20">
                {(user?.full_name || 'A B').split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Nombre Completo</div>
                <div className="font-semibold">{user?.full_name || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Especialidad</div>
                <div className="font-semibold flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-[#3b82f6]" />
                  {user?.specialty || 'Derecho General'}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Tarjeta Profesional</div>
                <div className="font-semibold flex items-center gap-1">
                  <IdCard className="w-4 h-4 text-[#10b981]" />
                  {user?.bar_number || 'Sin registrar'}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Correo</div>
                <div className="font-semibold flex items-center gap-1 truncate">
                  <Mail className="w-4 h-4 text-[#f97316]" />
                  <span className="truncate">{user?.email || '—'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Teléfono</div>
                <div className="font-semibold flex items-center gap-1">
                  <Phone className="w-4 h-4 text-[#ec4899]" />
                  {user?.phone || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">País</div>
                <div className="font-semibold flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#8b5cf6]" />
                  {user?.country || '—'}
                </div>
              </div>
            </div>

            {/* Plan Badge */}
            <div className="lg:flex-shrink-0">
              <div className="bg-gradient-to-r from-[#f97316] to-[#fb923c] rounded-2xl p-4 text-center">
                <Award className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs font-bold uppercase tracking-wider">Plan Profesional</div>
                <div className="text-xs opacity-80 mt-1">7 días gratis</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#f97316]" />
            Resumen Ejecutivo
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} {...stat} delay={0.2 + i * 0.05} />
            ))}
          </div>
        </div>

        {/* Activity & Alerts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#3b82f6]" />
                Actividad Reciente
              </h3>
              <button className="text-xs text-[#f97316] hover:underline flex items-center gap-1">
                Ver todo <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <ul className="space-y-3">
              {recentActivity.map((activity, i) => (
                <li key={`${activity.type}-${i}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ background: activity.color }}
                  />
                  <div className="flex-1">
                    <div className="text-sm">{activity.text}</div>
                    <div className="text-xs text-white/40 mt-0.5">{activity.time}</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-white/30 flex-shrink-0 mt-1" />
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-[#f97316]" />
              Alertas Inteligentes
            </h3>
            <ul className="space-y-3">
              {alerts.map((alert, i) => (
                <li
                  key={`alert-${alert.priority}-${i}`}
                  className={`p-3 rounded-xl border ${
                    alert.priority === 'high'
                      ? 'bg-red-500/10 border-red-500/30'
                      : alert.priority === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <alert.icon
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        alert.priority === 'high'
                          ? 'text-red-400'
                          : alert.priority === 'medium'
                          ? 'text-yellow-400'
                          : 'text-blue-400'
                      }`}
                    />
                    <span className="text-sm">{alert.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Share Referral Modal */}
      {showShareModal && referralData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}
            className="bg-[#0f172a] border border-white/20 rounded-3xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Gift className="w-6 h-6 text-[#10b981]" /> Tu Código de Referido</h2>
              <button onClick={() => setShowShareModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#10b981]/10 to-[#f97316]/10 border border-[#10b981]/30 text-center">
                <div className="text-xs text-white/60 mb-2">CÓDIGO</div>
                <div className="text-3xl font-bold tracking-wider text-[#f97316]">{referralData.code}</div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-2">ENLACE DE INVITACIÓN</div>
                <div className="flex gap-2">
                  <input value={referralData.share_url} readOnly className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-white/80" />
                  <Button onClick={copyLink} variant="outline" className="border-white/20"><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
              <Button onClick={shareWhatsApp} className="w-full bg-gradient-to-r from-[#25d366] to-[#128c7e] text-white font-bold py-4">
                <MessageCircle className="w-4 h-4 mr-2" /> Compartir por WhatsApp
              </Button>
              <p className="text-xs text-white/40 text-center">Cada vez que un referido pague, recibirás 1 mes gratis automáticamente.</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default DashboardHome;
