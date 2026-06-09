import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FolderKanban, Calendar, Receipt, TrendingUp, AlertCircle,
  Clock, MapPin, Briefcase, Phone, Mail, Award, IdCard, Building2,
  ArrowUpRight, Activity, Bell, CheckCircle2, Gift, Share2, Copy, MessageCircle, X,
  Crown, Sparkles, Zap, Check, ChevronRight, ArrowUpCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { API } from '@/config/api';

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

// Formatea un importe en cualquier moneda local (USD, ARS, MXN, EUR, …).
const fmtMoney = (value, currency = 'COP', decimals = 0) => {
  try {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value || 0);
  } catch (e) {
    return `${(value || 0).toLocaleString('es')} ${currency}`;
  }
};

// Precio localizado de un plan (con su bandera).
const planPrice = (plan) =>
  plan ? fmtMoney(plan.price_local ?? plan.price_cop, plan.currency || 'COP', plan.decimals ?? 0) : '';

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

// Iconos por plan (según su id en el catálogo).
const PLAN_ICONS = {
  esencial: Briefcase,
  profesional: Award,
  elite: Sparkles,
  ilimitado: Crown,
};

export const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [referralData, setReferralData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [apiAlerts, setApiAlerts] = useState([]);
  const [planInfo, setPlanInfo] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const loadPlan = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/payment/my-plan`);
      setPlanInfo(res.data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') console.error('No plan data', e);
    }
  }, []);

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
    loadPlan();
    return () => clearInterval(timer);
  }, [loadReferralData, loadDashboardData, loadPlan]);

  const goToCheckout = (planId) => {
    setShowPlanModal(false);
    navigate(`/checkout?plan=${planId}&cycle=monthly`);
  };

  const activePlan = planInfo?.has_plan ? planInfo.plan : null;
  const planCatalog = planInfo?.catalog || [];
  const locale = planInfo?.locale || {
    term: 'abogado', term_cap: 'Abogado', term_plural: 'abogados',
    honorific: 'Dr.', flag: '🇨🇴', country: 'Colombia', currency: 'COP',
  };

  // Cuenta regresiva de la prueba gratuita (7 días desde el registro).
  const trial = planInfo?.trial;
  const trialMs = trial?.ends_at ? new Date(trial.ends_at).getTime() - currentTime.getTime() : null;
  const trialLeft = trialMs == null ? null : {
    expired: trialMs <= 0,
    d: Math.max(0, Math.floor(trialMs / 86400000)),
    h: Math.max(0, Math.floor((trialMs % 86400000) / 3600000)),
    m: Math.max(0, Math.floor((trialMs % 3600000) / 60000)),
    s: Math.max(0, Math.floor((trialMs % 60000) / 1000)),
  };
  const showTrial = !activePlan && trialLeft && !trialLeft.expired;
  const pad = (n) => String(n).padStart(2, '0');

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
            {getGreeting()}, <span className="bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">{user?.full_name || locale.honorific}</span>
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
                  Has referido a <strong>{referralData.total_referrals}</strong> {locale.term_plural}.
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
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: activePlan ? `linear-gradient(135deg, ${activePlan.color}, ${activePlan.color}cc)` : 'linear-gradient(135deg, #f97316, #fb923c)' }}
              >
                {(() => { const I = activePlan ? (PLAN_ICONS[activePlan.id] || Award) : Award; return <I className="w-6 h-6 mx-auto mb-1" />; })()}
                <div className="text-xs font-bold uppercase tracking-wider">{activePlan ? activePlan.name : 'Plan de Prueba'}</div>
                <div className="text-xs opacity-80 mt-1">
                  {activePlan
                    ? `${activePlan.flag} ${planPrice(activePlan)}/mes`
                    : (showTrial
                        ? `${trialLeft.d}d ${pad(trialLeft.h)}:${pad(trialLeft.m)}:${pad(trialLeft.s)}`
                        : (trialLeft?.expired ? 'Prueba finalizada' : '7 días gratis'))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mi Plan Contratado */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#f97316]" />
            Mi Plan
          </h2>

          {activePlan ? (
            <div
              className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative"
              data-testid="active-plan-card"
            >
              <div
                className="absolute top-0 left-0 w-full h-1.5"
                style={{ background: `linear-gradient(90deg, ${activePlan.color}, transparent)` }}
              />
              <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl opacity-20" style={{ background: activePlan.color }} />

              <div className="relative z-10 p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Identidad del plan */}
                  <div className="flex items-start gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${activePlan.color}22`, border: `1px solid ${activePlan.color}55` }}
                    >
                      {(() => { const I = PLAN_ICONS[activePlan.id] || Award; return <I className="w-7 h-7" style={{ color: activePlan.color }} />; })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-2xl font-bold">{activePlan.name}</h3>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: `${activePlan.color}22`, color: activePlan.color }}
                        >
                          {planInfo?.subscription_status === 'active' ? 'Activo' : (planInfo?.subscription_status || 'Activo')}
                        </span>
                      </div>
                      {activePlan.description && (
                        <p className="text-sm text-white/50 mt-1">{activePlan.description}</p>
                      )}
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl">{activePlan.flag}</span>
                        <span className="text-3xl font-bold" style={{ color: activePlan.color }}>{planPrice(activePlan)}</span>
                        <span className="text-sm text-white/50">/mes</span>
                      </div>
                      <div className="text-xs text-white/50 mt-1 flex items-center gap-1">
                        <FolderKanban className="w-3.5 h-3.5" /> {activePlan.processes}
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        Precio en {activePlan.currency} para tu ejercicio como {locale.term} en {locale.flag} {locale.country}
                      </div>
                    </div>
                  </div>

                  {/* Acción */}
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => setShowPlanModal(true)}
                      className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold"
                      data-testid="change-plan-btn"
                    >
                      <ArrowUpCircle className="w-4 h-4 mr-2" /> Cambiar o mejorar plan
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3">Incluido en tu plan</div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activePlan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${activePlan.color}22` }}
                        >
                          <Check className="w-3 h-3" style={{ color: activePlan.color }} />
                        </span>
                        <span className="text-white/80">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="backdrop-blur-xl bg-gradient-to-br from-[#f97316]/10 to-[#3b82f6]/10 rounded-3xl border border-white/10 p-6 lg:p-8"
              data-testid="no-plan-card"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#f97316]/20 border border-[#f97316]/40 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-7 h-7 text-[#f97316]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {trialLeft?.expired ? 'Tu prueba gratuita finalizó' : 'Estás en tu prueba gratuita de 7 días'}
                    </h3>
                    <p className="text-sm text-white/60 mt-1 max-w-xl">
                      {trialLeft?.expired
                        ? 'Elige un plan para reactivar todas las herramientas de tu oficina jurídica digital.'
                        : 'Aún no tienes un plan contratado. Aprovecha tu prueba y elige un plan cuando quieras.'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPlanModal(true)}
                  className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold flex-shrink-0"
                  data-testid="choose-plan-btn"
                >
                  <Crown className="w-4 h-4 mr-2" /> Elegir un plan
                </Button>
              </div>

              {/* Contador regresivo en tiempo real */}
              {showTrial && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#f97316]" /> Tiempo restante de tu prueba gratuita
                  </div>
                  <div className="grid grid-cols-4 gap-3 max-w-md" data-testid="trial-countdown">
                    {[
                      { v: trialLeft.d, label: 'Días' },
                      { v: trialLeft.h, label: 'Horas' },
                      { v: trialLeft.m, label: 'Min' },
                      { v: trialLeft.s, label: 'Seg' },
                    ].map((box) => (
                      <div key={box.label} className="rounded-2xl bg-white/5 border border-white/10 py-3 text-center">
                        <div className="text-3xl font-bold tabular-nums text-[#f97316]">{pad(box.v)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">{box.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

      {/* Modal: Cambiar o mejorar plan */}
      <AnimatePresence>
        {showPlanModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPlanModal(false)}
            data-testid="plan-modal"
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f172a] border border-white/20 rounded-3xl p-6 lg:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Crown className="w-6 h-6 text-[#f97316]" /> Elige tu plan
                  </h2>
                  <p className="text-sm text-white/50 mt-1">Mejora o cambia tu plan cuando quieras. El cambio se aplica al confirmar el pago.</p>
                </div>
                <button onClick={() => setShowPlanModal(false)} data-testid="plan-modal-close"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {planCatalog.map((p) => {
                  const isCurrent = planInfo?.plan_id === p.id;
                  const Icon = PLAN_ICONS[p.id] || Award;
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border p-5 flex flex-col"
                      style={{
                        borderColor: isCurrent ? p.color : 'rgba(255,255,255,0.12)',
                        background: isCurrent ? `${p.color}12` : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${p.color}22` }}>
                          <Icon className="w-5 h-5" style={{ color: p.color }} />
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${p.color}22`, color: p.color }}>
                            Plan actual
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                      <div className="mt-1 mb-1 flex items-baseline gap-1.5">
                        <span className="text-base">{p.flag}</span>
                        <span className="text-2xl font-bold" style={{ color: p.color }}>{planPrice(p)}</span>
                        <span className="text-xs text-white/50">/mes</span>
                      </div>
                      <div className="text-xs text-white/50 mb-3">{p.processes} · {p.currency}</div>
                      <ul className="space-y-2 mb-5 flex-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-white/75">
                            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: p.color }} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => goToCheckout(p.id)}
                        disabled={isCurrent}
                        className="w-full font-bold disabled:opacity-40"
                        style={{ background: isCurrent ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}
                        data-testid={`select-plan-${p.id}`}
                      >
                        {isCurrent ? 'Plan actual' : (<><ChevronRight className="w-4 h-4 mr-1" /> Seleccionar</>)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default DashboardHome;
