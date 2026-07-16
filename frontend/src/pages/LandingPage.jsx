import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import axios from 'axios';

import { API } from '@/config/api';
import { PLANS } from '@/modules/plans/mockData'; // Fuente oficial única del catálogo comercial

import {

  Shield, Lock, Users, Award, CheckCircle, ArrowRight, Scale, FileText, Clock,

  Briefcase, Calendar, FolderKanban, BookOpen, Video, Brain, Menu, X,

  Mail, MessageCircle, Instagram, Facebook, Crown, Sparkles, CheckCircle2, Loader2,

  ShieldCheck, Server, KeyRound, Star, Quote, Trophy, Building2, TrendingUp

} from 'lucide-react';

import { SecuritySeals } from '@/components/security/SecuritySeals';

import { Button } from '../components/ui/button';

import { Card } from '../components/ui/card';

import { Input } from '../components/ui/input';

import { Textarea } from '../components/ui/textarea';

import { useAuth } from '../contexts/AuthContext';

import { getErrorMessage } from '../lib/utils';

import { ChatWidget } from '../components/ChatWidget';
import { FirmRegistrationStreamlined } from '../components/FirmRegistrationStreamlined';
import { FirmOSPreviewBlock } from '../components/FirmOSPreviewBlock';

import { trackEvent } from '../lib/analytics';



const LATAM_COUNTRIES = [

  'México', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panamá',

  'Cuba', 'República Dominicana', 'Puerto Rico',

  'Colombia', 'Venezuela', 'Ecuador', 'Perú', 'Bolivia', 'Chile', 'Argentina',

  'Uruguay', 'Paraguay', 'Brasil',

];



const SUPPORT_WHATSAPP = '573028322083';

// Prefijos telefónicos por país (validación en vivo del formulario)
const PHONE_PREFIXES = {
  'México': '+52', 'Guatemala': '+502', 'Honduras': '+504', 'El Salvador': '+503',
  'Nicaragua': '+505', 'Costa Rica': '+506', 'Panamá': '+507', 'Cuba': '+53',
  'República Dominicana': '+1', 'Puerto Rico': '+1', 'Colombia': '+57', 'Venezuela': '+58',
  'Ecuador': '+593', 'Perú': '+51', 'Bolivia': '+591', 'Chile': '+56', 'Argentina': '+54',
  'Uruguay': '+598', 'Paraguay': '+595', 'Brasil': '+55', 'España': '+34',
};

// Longitud esperada (dígitos del número nacional, sin prefijo) por país
const PHONE_NATIONAL_LEN = {
  'Colombia': 10, 'México': 10, 'Argentina': 10, 'Perú': 9, 'Chile': 9, 'Ecuador': 9,
  'Venezuela': 10, 'Bolivia': 8, 'Paraguay': 9, 'Uruguay': 8, 'Guatemala': 8,
  'Honduras': 8, 'El Salvador': 8, 'Nicaragua': 8, 'Costa Rica': 8, 'Panamá': 8,
  'Cuba': 8, 'República Dominicana': 10, 'Puerto Rico': 10, 'Brasil': 11, 'España': 9,
};

// Devuelve {prefix, valid, message} para feedback en vivo
const validatePhone = (country, phone) => {
  const prefix = PHONE_PREFIXES[country] || '';
  if (!phone || !phone.trim()) return { prefix, valid: null, message: '' };
  let digits = phone.replace(/\D/g, '');
  const px = prefix.replace('+', '');
  if (digits.startsWith(px)) digits = digits.slice(px.length); // quita prefijo si lo escribió
  const expected = PHONE_NATIONAL_LEN[country];
  if (expected && digits.length !== expected) {
    return { prefix, valid: false, message: `El número en ${country} debe tener ${expected} dígitos (${prefix}).` };
  }
  if (!expected && digits.length < 7) {
    return { prefix, valid: false, message: 'Número demasiado corto.' };
  }
  return { prefix, valid: true, message: `${prefix} ${digits}` };
};



export const LandingPage = () => {

  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showFirmRegistration, setShowFirmRegistration] = useState(false);

  const [billingCycle, setBillingCycle] = useState('monthly');

  // ── Multipaís: la landing REFLEJA el catálogo localizado que el backend ya
  // expone (/payment/catalog?country=X). No duplica ni modifica la lógica de
  // conversión: solo muestra precio/moneda por país. Mismo origen que el
  // Checkout para mantener consistencia. ──
  const PRICING_COUNTRIES = [
    'Colombia', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Bolivia', 'Venezuela',
    'Paraguay', 'Uruguay', 'México', 'Guatemala', 'Honduras', 'El Salvador',
    'Nicaragua', 'Costa Rica', 'Panamá', 'Cuba', 'República Dominicana',
    'Puerto Rico', 'España',
  ];
  const detectCountry = () => {
    const map = {
      CO: 'Colombia', MX: 'México', AR: 'Argentina', CL: 'Chile', PE: 'Perú',
      EC: 'Ecuador', BO: 'Bolivia', VE: 'Venezuela', PY: 'Paraguay', UY: 'Uruguay',
      GT: 'Guatemala', HN: 'Honduras', SV: 'El Salvador', NI: 'Nicaragua',
      CR: 'Costa Rica', PA: 'Panamá', DO: 'República Dominicana', ES: 'España',
    };
    try {
      const region = (navigator.language || '').split('-')[1];
      return map[(region || '').toUpperCase()] || 'Colombia';
    } catch { return 'Colombia'; }
  };
  const [pricingCountry, setPricingCountry] = useState(detectCountry);
  const [catalog, setCatalog] = useState([]);
  const [catalogLocale, setCatalogLocale] = useState(null);

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/payment/catalog`, { params: { country: pricingCountry } })
      .then((r) => { if (alive) { setCatalog(r.data?.plans || []); setCatalogLocale(r.data?.locale || null); } })
      .catch(() => { if (alive) setCatalog([]); });
    return () => { alive = false; };
  }, [pricingCountry]);

  

  const handleAccess = () => {

    if (!isAuthenticated) {

      navigate('/login');

    } else if (['admin', 'admin_general', 'socio_comercial'].includes(user?.role)) {

      navigate('/admin');

    } else if (user?.is_verified === false || user?.status === 'PENDING_VERIFICATION') {

      navigate('/verificacion-pendiente');

    } else {

      navigate('/dashboard');

    }

  };



  const getAccessLabel = () => {

    if (!isAuthenticated) return 'Iniciar Sesión';

    if (['admin', 'admin_general', 'socio_comercial'].includes(user?.role)) return 'Centro de Gestión';

    return 'Mi Oficina Jurídica';

  };

  const [formData, setFormData] = useState({

    name: '',

    area: 'Derecho Laboral',

    priority: 'media',

    country: '',

    city: '',

    phone: '',

    email: '',

    message: ''

  });

  const [lawyerData, setLawyerData] = useState({

    name: '',

    email: '',

    phone: '',

    specialty: 'Derecho Laboral',

    country: '',

    city: '',

    experience: ''

  });

  const [clientStatus, setClientStatus] = useState({ loading: false, success: false, error: '' });

  const [lawyerStatus, setLawyerStatus] = useState({ loading: false, success: false, error: '' });

  // Capa visual del chatbot: se abre tras enviar un formulario (no queda "muerto").
  const [chat, setChat] = useState({ open: false });






  const handleClientSubmit = async (e) => {

    e.preventDefault();

    // Validación de teléfono por país antes de enviar
    const pv = validatePhone(formData.country, formData.phone);
    if (pv.valid === false) {
      setClientStatus({ loading: false, success: false, error: pv.message });
      return;
    }

    setClientStatus({ loading: true, success: false, error: '' });

    try {

      const { data } = await axios.post(`${API}/public/case-intake`, {

        name: formData.name,

        description: formData.message,

        legal_area: formData.area,

        priority: formData.priority,

        country: formData.country,

        city: formData.city || null,

        phone: formData.phone || null,

        email: formData.email || null,

      });

      setClientStatus({ loading: false, success: true, error: '', message: data.message, ref: data.case_number });

      // Evento base Google Ads (lead de cliente) — reutilizable como conversión.
      trackEvent('generate_lead', { form: 'client_intake', country: formData.country || undefined });

      // Abre el chatbot existente conectado al case_id real (conversación interactiva).
      setChat({ open: true, kind: 'client', caseId: data.case_id, caseNumber: data.case_number, name: formData.name, message: data.message });

      setFormData({ name: '', area: 'Derecho Laboral', priority: 'media', country: '', city: '', phone: '', email: '', message: '' });

    } catch (err) {

      setClientStatus({ loading: false, success: false, error: getErrorMessage(err, 'Error al enviar. Intente de nuevo.') });

    }

  };



  const handleLawyerSubmit = async (e) => {

    e.preventDefault();

    setLawyerStatus({ loading: true, success: false, error: '' });

    try {

      const { data } = await axios.post(`${API}/public/lawyer-application`, {

        full_name: lawyerData.name,

        email: lawyerData.email,

        phone: lawyerData.phone || null,

        specialty: lawyerData.specialty,

        country: lawyerData.country,

        city: lawyerData.city || null,

        experience: lawyerData.experience,

      });

      setLawyerStatus({ loading: false, success: true, error: '', message: data.message });

      // Evento base Google Ads (lead de abogado) — reutilizable como conversión.
      trackEvent('generate_lead', { form: 'lawyer_application', country: lawyerData.country || undefined });

      // Abre el chatbot (modo confirmación + WhatsApp) para que el abogado no quede sin guía.
      setChat({ open: true, kind: 'lawyer', name: lawyerData.full_name, message: data.message });

      setLawyerData({ name: '', email: '', phone: '', specialty: 'Derecho Laboral', country: '', city: '', experience: '' });

    } catch (err) {

      setLawyerStatus({ loading: false, success: false, error: getErrorMessage(err, 'Error al enviar. Intente de nuevo.') });

    }

  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">

      {/* Header */}

      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/10" role="banner">

        <div className="container mx-auto px-6 py-4">

          <nav className="flex items-center justify-between" aria-label="Navegación principal">

            <motion.div 

              initial={{ opacity: 0, x: -20 }}

              animate={{ opacity: 1, x: 0 }}

              className="flex items-center gap-2"

            >

              <img src="https://cdn.builder.io/api/v1/image/assets%2F18d3193fe50643dfa7d4c7599f2bf550%2Fb71558facffb495fb2401892611fe06c?format=webp&width=800&height=1200" alt="Punto Cero Legal" className="w-11 h-11 object-contain" />

              <span className="text-2xl font-bold text-white">Punto Cero Legal</span>

            </motion.div>

            

            {/* Desktop Menu */}

            <motion.div 

              initial={{ opacity: 0, x: 20 }}

              animate={{ opacity: 1, x: 0 }}

              className="hidden lg:flex items-center gap-6"

            >

              <a href="#servicios" className="text-white/80 hover:text-[#3b82f6] transition-colors">Servicios</a>

              <a href="#modulos" className="text-white/80 hover:text-[#3b82f6] transition-colors">Módulos</a>

              <a href="#planes" className="text-white/80 hover:text-[#3b82f6] transition-colors">Planes</a>

              <a href="#abogados" className="text-white/80 hover:text-[#3b82f6] transition-colors">Abogados Aliados</a>

              <a href="#partner" className="text-[#f97316] font-semibold hover:text-[#fb923c] transition-colors">Socios</a>

              <Button onClick={handleAccess} variant="outline" className="border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white transition-all" data-testid="navbar-access-btn">

                {getAccessLabel()}

              </Button>

              {/* Social Media Icons */}
              <div className="flex gap-3 ml-3">
                <a
                  href="https://www.instagram.com/puntocerolegal/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Síguenos en Instagram"
                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all duration-300"
                >
                  <Instagram className="w-4 h-4 text-white" aria-hidden="true" />
                </a>

                <a
                  href="https://www.facebook.com/Punto7Cero7/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Síguenos en Facebook"
                  className="w-9 h-9 rounded-lg bg-[#1877f2] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_15px_rgba(24,119,242,0.4)] transition-all duration-300"
                >
                  <Facebook className="w-4 h-4 text-white" aria-hidden="true" />
                </a>

                <a
                  href="https://www.tiktok.com/@puntocerolegal7"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok Punto Cero Legal"
                  className="w-9 h-9 rounded-lg bg-black border border-white/20 flex items-center justify-center hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
                  </svg>
                </a>
              </div>

            </motion.div>



            {/* Mobile Menu Button */}

            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-white">

              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}

            </button>

          </nav>



          {/* Mobile Menu */}

          {menuOpen && (

            <motion.div 

              initial={{ opacity: 0, y: -10 }}

              animate={{ opacity: 1, y: 0 }}

              className="lg:hidden mt-4 pb-4 space-y-3"

            >

              <a href="#servicios" className="block text-white/80 hover:text-[#3b82f6] transition-colors">Servicios</a>

              <a href="#modulos" className="block text-white/80 hover:text-[#3b82f6] transition-colors">Módulos</a>

              <a href="#planes" className="block text-white/80 hover:text-[#3b82f6] transition-colors">Planes</a>

              <a href="#abogados" className="block text-white/80 hover:text-[#3b82f6] transition-colors">Abogados Aliados</a>

              <a href="#partner" className="block text-[#f97316] font-semibold hover:text-[#fb923c] transition-colors">Socios</a>

              <Button onClick={handleAccess} variant="outline" className="w-full border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white transition-all" data-testid="navbar-access-btn-mobile">

                {getAccessLabel()}

              </Button>

            </motion.div>

          )}

        </div>

      </header>



      {/* Hero Section */}

      <section id="inicio" className="relative pt-32 pb-20 px-6 overflow-hidden">

        {/* Background Image */}

        <div 

          className="absolute inset-0 bg-cover bg-center opacity-10"

          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80')" }}

        />

        

        {/* Gradient Overlays */}

        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/20 via-transparent to-[#f97316]/20" />

        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3b82f6]/30 rounded-full blur-3xl" />

        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f97316]/30 rounded-full blur-3xl" />



        <div className="container mx-auto relative z-10">

          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <motion.div

              initial={{ opacity: 0, y: 30 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.6 }}

            >

              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#3b82f6]/20 to-[#f97316]/20 border border-[#3b82f6]/30 backdrop-blur-sm text-[#3b82f6] text-xs font-bold uppercase tracking-wider mb-6">

                ◆ Asistencia Jurídica

              </span>

              

              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">

                <span className="text-white">¿Cansado de que tus problemas legales no reciban</span>

                <br />

                <span className="bg-gradient-to-r from-[#3b82f6] via-[#f97316] to-[#10b981] bg-clip-text text-transparent">

                  la atención que merecen?

                </span>

              </h1>

              

              <p className="text-xl text-white/70 mb-4 leading-relaxed">

                <strong className="text-white">Tenemos la asesoría legal que necesitas, sin complicaciones.</strong>

              </p>

              

              <p className="text-lg text-white/60 mb-8 leading-relaxed">

                Reciba orientación jurídica profesional de abogados certificados en todas las áreas del derecho. Atención rápida, confidencial y personalizada.

              </p>

              

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-12">

                <motion.a

                  href="#consulta"

                  whileHover={{ scale: 1.05 }}

                  whileTap={{ scale: 0.97 }}

                  className="relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold overflow-hidden group shadow-[0_0_30px_rgba(249,115,22,0.5)]"

                  data-testid="cta-cuentanos"

                >

                  {/* glow + pulse */}

                  <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#fb923c] opacity-50 blur-md animate-pulse pointer-events-none" />

                  {/* destello de luz */}

                  <span className="absolute top-0 left-[-60%] h-full w-1/3 bg-white/40 skew-x-[-20deg] blur-md group-hover:left-[140%] transition-all duration-700 ease-out pointer-events-none" />

                  <span className="relative flex items-center">

                    Cuéntanos sobre tu caso

                    <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }} className="ml-2 inline-flex">

                      <ArrowRight className="w-5 h-5" />

                    </motion.span>

                  </span>

                </motion.a>

                <motion.a

                  href="#consulta"

                  whileHover={{ scale: 1.05 }}

                  whileTap={{ scale: 0.97 }}

                  className="relative inline-flex items-center justify-center px-8 py-4 rounded-2xl backdrop-blur-md bg-white/5 border border-[#3b82f6]/40 text-white font-semibold hover:bg-white/10 hover:border-[#3b82f6] transition-all group overflow-hidden"

                  data-testid="cta-publica"

                >

                  <span className="absolute inset-0 rounded-2xl bg-[#3b82f6]/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <span className="relative">Publica tu caso para evaluación profesional</span>

                </motion.a>

              </div>



              {/* Trust Stats */}

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">

                <div>

                  <div className="text-4xl font-bold text-[#3b82f6]">+168</div>

                  <div className="text-white/60 text-sm uppercase tracking-wide mt-1">Abogados Aliados</div>

                </div>

                <div>

                  <div className="text-2xl lg:text-3xl font-bold text-[#f97316]">Presencia Digital</div>

                  <div className="text-white/60 text-sm uppercase tracking-wide mt-1">LATAM</div>

                </div>

                <div>

                  <div className="text-4xl font-bold text-[#10b981]">98%</div>

                  <div className="text-white/60 text-sm uppercase tracking-wide mt-1">Casos Exitosos</div>

                </div>

              </div>

            </motion.div>



            {/* Form Card */}

            <motion.div

              id="consulta"

              initial={{ opacity: 0, scale: 0.95 }}

              animate={{ opacity: 1, scale: 1 }}

              transition={{ duration: 0.6, delay: 0.2 }}

              className="relative scroll-mt-28"

            >

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl">

                <span className="inline-block text-[#f97316] text-xs font-bold uppercase tracking-wider mb-3">

                  CONSULTA PRIORITARIA

                </span>

                <h2 className="text-3xl font-bold text-white mb-2">Cuéntenos su caso</h2>

                <p className="text-white/60 mb-6">Un especialista legal revisará su solicitud y le contactará en breve.</p>



                <form onSubmit={handleClientSubmit} className="space-y-4" data-testid="client-intake-form">

                  <div>

                    <label className="block text-sm font-semibold text-white/80 mb-2">Nombre completo</label>

                    <Input 

                      type="text" 

                      placeholder="Ingrese su nombre" 

                      value={formData.name}

                      onChange={(e) => setFormData({...formData, name: e.target.value})}

                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20"

                      required

                      data-testid="client-name"

                    />

                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Área legal</label>

                      <select 

                        value={formData.area}

                        onChange={(e) => setFormData({...formData, area: e.target.value})}

                        className="w-full px-4 py-3 rounded-xl bg-[#0a0e1a] border border-white/20 text-white focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 outline-none"

                        data-testid="client-area"

                      >

                        <option value="Derecho Laboral" className="bg-[#0a0e1a] text-white">Laboral</option>

                        <option value="Derecho de Familia" className="bg-[#0a0e1a] text-white">Familia</option>

                        <option value="Derecho Penal" className="bg-[#0a0e1a] text-white">Penal</option>

                        <option value="Derecho Civil" className="bg-[#0a0e1a] text-white">Civil</option>

                        <option value="Derecho Comercial" className="bg-[#0a0e1a] text-white">Comercial</option>

                        <option value="Derecho Administrativo" className="bg-[#0a0e1a] text-white">Administrativo</option>

                        <option value="Derecho Tributario" className="bg-[#0a0e1a] text-white">Tributario</option>

                      </select>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Prioridad</label>

                      <select 

                        value={formData.priority}

                        onChange={(e) => setFormData({...formData, priority: e.target.value})}

                        className="w-full px-4 py-3 rounded-xl bg-[#0a0e1a] border border-white/20 text-white focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 outline-none"

                        data-testid="client-priority"

                      >

                        <option value="urgente" className="bg-[#0a0e1a] text-white">Urgente</option>

                        <option value="media" className="bg-[#0a0e1a] text-white">Media</option>

                        <option value="baja" className="bg-[#0a0e1a] text-white">Baja</option>

                      </select>

                    </div>

                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">País *</label>

                      <select 

                        value={formData.country || ''}

                        onChange={(e) => setFormData({...formData, country: e.target.value})}

                        className="w-full px-4 py-3 rounded-xl bg-[#0a0e1a] border border-white/20 text-white focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 outline-none"

                        required

                        data-testid="client-country"

                      >

                        <option value="" className="bg-[#0a0e1a]">— Seleccione —</option>

                        {LATAM_COUNTRIES.map(c => <option key={c} value={c} className="bg-[#0a0e1a] text-white">{c}</option>)}

                      </select>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Ciudad *</label>

                      <Input

                        type="text"

                        placeholder="Escriba su ciudad"

                        value={formData.city}

                        onChange={(e) => setFormData({...formData, city: e.target.value})}

                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20"

                        required

                        data-testid="client-city"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Correo electrónico</label>

                      <Input

                        type="email"

                        placeholder="email@ejemplo.com"

                        value={formData.email}

                        onChange={(e) => setFormData({...formData, email: e.target.value})}

                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20"

                        data-testid="client-email"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">WhatsApp / Teléfono</label>

                      {(() => {
                        const pv = validatePhone(formData.country, formData.phone);
                        return (
                          <>
                            <div className="relative">
                              {pv.prefix && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm font-semibold pointer-events-none">{pv.prefix}</span>
                              )}
                              <Input
                                type="tel"
                                placeholder={formData.country ? 'Número sin prefijo' : 'Selecciona tu país primero'}
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className={`bg-white/10 text-white placeholder:text-white/40 ${pv.prefix ? 'pl-14' : ''} ${
                                  pv.valid === false ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                                  : pv.valid === true ? 'border-[#10b981]/60 focus:border-[#10b981] focus:ring-[#10b981]/20'
                                  : 'border-white/20 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20'}`}
                                data-testid="client-phone"
                              />
                              {pv.valid === true && (
                                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10b981]" />
                              )}
                            </div>
                            {pv.valid === false && (
                              <p className="text-xs text-red-300 mt-1" data-testid="phone-error">{pv.message}</p>
                            )}
                            <p className="text-[11px] text-white/40 mt-1">Te contactaremos por WhatsApp con la actualización de tu caso.</p>
                          </>
                        );
                      })()}

                    </div>

                  </div>



                  <div>

                    <label className="block text-sm font-semibold text-white/80 mb-2">Describa su situación</label>

                    <Textarea 

                      placeholder="Explique brevemente su caso" 

                      value={formData.message}

                      onChange={(e) => setFormData({...formData, message: e.target.value})}

                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 min-h-[100px]"

                      required

                      data-testid="client-message"

                    />

                  </div>



                  {clientStatus.success ? (

                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}

                      className="rounded-xl bg-emerald-500/10 border border-emerald-500/40 p-4 text-emerald-200 text-sm flex items-start gap-3"

                      role="status"

                      data-testid="client-success"

                    >

                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />

                      <div>

                        <div className="font-bold">{clientStatus.message}</div>

                        {clientStatus.ref && <div className="text-xs text-emerald-300/70 mt-1">Referencia: <span className="font-mono">{clientStatus.ref}</span></div>}

                      </div>

                    </motion.div>

                  ) : (

                    <Button 

                      type="submit"

                      disabled={clientStatus.loading}

                      className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6 transition-all disabled:opacity-60"

                      data-testid="client-submit"

                    >

                      {clientStatus.loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando solicitud...</>) : 'Enviar Caso'}

                    </Button>

                  )}

                  {clientStatus.error && (

                    <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3" data-testid="client-error">

                      {clientStatus.error}

                    </div>

                  )}

                </form>

              </div>

            </motion.div>

          </div>

        </div>

      </section>



      {/* Modules Section */}

      <section id="modulos" className="py-20 px-6 relative">

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#3b82f6]/5 to-transparent"></div>

        <div className="container mx-auto relative z-10">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="text-center mb-16"

          >

            <h2 className="text-5xl font-bold text-white mb-4">

              Plataforma <span className="text-[#3b82f6]">Todo en Uno</span>

            </h2>

            <p className="text-white/70 text-lg max-w-2xl mx-auto">

              Herramientas profesionales diseñadas para transformar su práctica legal

            </p>

          </motion.div>



          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {[

              {

                icon: Briefcase,

                title: 'CRM Jurídico',

                description: 'Gestione clientes, casos y seguimiento comercial en una sola plataforma intuitiva.',

                color: '#3b82f6',

                image: 'https://images.pexels.com/photos/8112118/pexels-photo-8112118.jpeg'

              },

              {

                icon: FolderKanban,

                title: 'Portal de Casos',

                description: 'Visualice el progreso de cada caso con tableros kanban y reportes en tiempo real.',

                color: '#f97316',

                image: 'https://images.pexels.com/photos/6077665/pexels-photo-6077665.jpeg'

              },

              {

                icon: BookOpen,

                title: 'Directorio Legal',

                description: 'Acceda a una red de +168 abogados aliados con presencia digital en LATAM.',

                color: '#10b981',

                image: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521'

              },

              {

                icon: Calendar,

                title: 'Agenda Inteligente',

                description: 'Coordine citas, audiencias y reuniones con recordatorios automáticos.',

                color: '#8b5cf6',

                image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72'

              },

              {

                icon: Brain,

                title: 'IA Jurídica',

                description: 'Asistente inteligente para análisis de documentos y generación de contratos.',

                color: '#ec4899',

                image: 'https://images.pexels.com/photos/8112118/pexels-photo-8112118.jpeg'

              },

              {

                icon: Video,

                title: 'Sala de Conferencia',

                description: 'Videollamadas seguras y cifradas para consultas y audiencias virtuales.',

                color: '#14b8a6',

                image: 'https://images.pexels.com/photos/1181745/pexels-photo-1181745.jpeg'

              }

            ].map((module, index) => (

              <motion.div

                key={`module-${module.title.replace(/\s+/g, '-').toLowerCase()}`}

                initial={{ opacity: 0, y: 20 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

                transition={{ delay: index * 0.1 }}

              >

                <Card

                  className="backdrop-blur-2xl bg-white/5 border-white/10 overflow-hidden group h-full hover:bg-white/[0.08] hover:border-white/25 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.6)]"

                  style={{ transition: 'all 0.4s ease', transform: 'scale(1)' }}

                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}

                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}

                >

                  <div

                    className="h-32 group-hover:h-60 bg-cover bg-center relative"

                    style={{ backgroundImage: `url('${module.image}?auto=format&fit=crop&w=800&q=80')`, transition: 'all 0.4s ease' }}

                  >

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f172a] opacity-90 group-hover:opacity-60" style={{ transition: 'all 0.4s ease' }}></div>

                  </div>

                  <div className="p-6">

                    <div

                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 -mt-14 relative z-10 shadow-lg"

                      style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}dd)` }}

                    >

                      <module.icon className="w-7 h-7 text-white" />

                    </div>

                    <h3 className="text-white text-xl font-semibold mb-3">{module.title}</h3>

                    <p className="text-white/60 leading-relaxed">{module.description}</p>

                  </div>

                </Card>

              </motion.div>

            ))}

          </div>

        </div>

      </section>



      {/* Confianza y Compromiso */}

      <section id="servicios" className="py-24 px-6 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-[#060910] via-[#0a0f1e] to-[#060910]" />

        <div className="container mx-auto relative z-10">

          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="text-center mb-16">

            <h2 className="text-5xl lg:text-6xl font-bold text-white mb-4">

              Confianza y <span className="text-[#10b981]">Compromiso</span>

            </h2>

            <p className="text-white/60 text-lg max-w-2xl mx-auto">

              Trabajamos para ti con profesionalismo, experiencia y dedicación

            </p>

          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            {[

              { icon: Award, color: '#3b82f6', title: 'Trayectoria Comprobada', body: 'Más de una década conectando clientes con los mejores abogados especializados en múltiples áreas del derecho.' },

              { icon: Users, color: '#f97316', title: 'Trabajamos Para Ti', body: 'Tu caso es nuestra prioridad. Cada cliente recibe atención personalizada y seguimiento constante de principio a fin.' },

              { icon: Shield, color: '#10b981', title: 'Red de Confianza', body: 'Solo trabajamos con abogados certificados y verificados. Tu tranquilidad es nuestro compromiso diario.' }

            ].map((item, idx) => (

              <motion.div key={idx} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay: idx * 0.15}}

                className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-2xl p-8 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300">

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{background: item.color+'25', border: '1px solid '+item.color+'50'}}>

                  <item.icon className="w-7 h-7" style={{color: item.color}} />

                </div>

                <h3 className="text-white font-bold text-lg mb-3">{item.title}</h3>

                <p className="text-white/55 text-sm leading-relaxed">{item.body}</p>

              </motion.div>

            ))}

          </div>

          {/* ───────── Prueba Social: métricas, testimonios, reviews y firmas ───────── */}
          <div className="mt-24">

            {/* Métricas de casos de éxito */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-20"
            >
              {[
                { icon: Trophy, value: '2.400+', label: 'Casos ganados' },
                { icon: Users, value: '8.700+', label: 'Clientes activos' },
                { icon: Clock, value: '< 2 h', label: 'Tiempo de respuesta' },
                { icon: TrendingUp, value: '97%', label: 'Satisfacción' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="relative text-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-[#f97316]/40 hover:bg-white/[0.05]"
                  data-testid={`social-stat-${idx}`}
                >
                  <div className="w-12 h-12 mx-auto rounded-xl border border-[#f97316]/40 bg-[#f97316]/10 flex items-center justify-center mb-3">
                    <stat.icon className="w-6 h-6 text-[#fb923c]" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{stat.value}</div>
                  <div className="text-white/55 text-xs uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Testimonios de abogados */}
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f97316]/15 border border-[#f97316]/30 text-[#fb923c] text-[11px] font-bold uppercase tracking-[0.18em]">
                <Quote className="w-3.5 h-3.5" /> Prueba Social
              </span>
              <h3 className="text-3xl lg:text-4xl font-bold text-white mt-4">
                Lo que dicen los <span className="text-[#f97316]">profesionales</span>
              </h3>
              <p className="text-white/50 text-sm mt-2 max-w-2xl mx-auto">
                Abogados y clientes que confían cada día en la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto mb-16">
              {[
                {
                  name: 'Dra. Carolina Restrepo',
                  role: 'Abogada Penalista · Medellín',
                  initials: 'CR',
                  from: '#f97316',
                  to: '#fb923c',
                  text: 'La gestión documental y la trazabilidad de cada caso me ahorran horas. Mis clientes notan la diferencia en la respuesta.',
                },
                {
                  name: 'Dr. Andrés Beltrán',
                  role: 'Derecho Corporativo · Bogotá',
                  initials: 'AB',
                  from: '#3b82f6',
                  to: '#60a5fa',
                  text: 'Una plataforma seria. El cifrado y el control de acceso me dan la tranquilidad que exige el manejo de información sensible.',
                },
                {
                  name: 'Dra. Valentina Gómez',
                  role: 'Derecho Laboral · Cali',
                  initials: 'VG',
                  from: '#10b981',
                  to: '#34d399',
                  text: 'Capto clientes con un perfil verificado y profesional. La confianza se construye desde el primer contacto.',
                },
              ].map((t, idx) => (
                <motion.figure
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.12 }}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-[#f97316]/40 hover:bg-white/[0.05]"
                  data-testid={`testimonial-${idx}`}
                >
                  <Quote className="w-7 h-7 text-[#f97316]/40 mb-3" aria-hidden="true" />
                  <div className="flex gap-0.5 mb-3" aria-label="5 de 5 estrellas">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-[#fb923c] fill-[#fb923c]" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-white/70 text-sm leading-relaxed flex-1">
                    “{t.text}”
                  </blockquote>
                  <figcaption className="flex items-center gap-3 mt-5 pt-5 border-t border-white/10">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                      aria-hidden="true"
                    >
                      {t.initials}
                    </div>
                    <div className="text-left">
                      <div className="text-white font-semibold text-sm leading-tight">{t.name}</div>
                      <div className="text-white/45 text-xs">{t.role}</div>
                    </div>
                  </figcaption>
                </motion.figure>
              ))}
            </div>

            {/* Review verificable estilo SaaS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 max-w-3xl mx-auto mb-16 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-5 h-5 text-[#fb923c] fill-[#fb923c]" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-white font-bold text-xl">4.9</span>
                <span className="text-white/50 text-sm">/ 5</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-white/10" />
              <p className="text-white/60 text-sm text-center sm:text-left">
                Basado en <span className="text-white font-semibold">+1.300 opiniones verificadas</span> de abogados y clientes
                <span className="inline-flex items-center gap-1 text-[#fb923c] font-semibold ml-2">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Verificado
                </span>
              </p>
            </motion.div>

            {/* Logos de firmas legales (grid de partners) */}
            <div className="max-w-5xl mx-auto">
              <p className="text-center text-white/40 text-xs uppercase tracking-[0.2em] mb-6">
                Firmas legales que confían en nosotros
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  'Restrepo & Asociados',
                  'Beltrán Legal',
                  'Gómez Abogados',
                  'Lex Andina',
                  'Jurídica Caribe',
                  'Mora & Partners',
                ].map((firm, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-4 transition-all duration-300 hover:border-[#f97316]/30 hover:bg-white/[0.04]"
                    data-testid={`firm-logo-${idx}`}
                  >
                    <Building2 className="w-4 h-4 text-white/40 group-hover:text-[#fb923c] transition-colors shrink-0" aria-hidden="true" />
                    <span className="text-white/50 group-hover:text-white/80 text-xs font-semibold text-center transition-colors leading-tight">
                      {firm}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </section>



      {/* Pricing Plans Section */}

      <section id="planes" className="py-20 px-6 relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f97316]/5 to-transparent" />

        <div className="container mx-auto relative z-10">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="text-center mb-12"

          >

            <span className="inline-flex items-center px-4 py-2 rounded-full bg-[#f97316]/20 border border-[#f97316]/30 backdrop-blur-sm text-[#f97316] text-xs font-bold uppercase tracking-wider mb-4">

              ◆ Planes para Abogados

            </span>

            <h2 className="text-5xl font-bold text-white mb-4">

              Elige el plan <span className="bg-gradient-to-r from-[#f97316] to-[#10b981] bg-clip-text text-transparent">ideal para ti</span>

            </h2>

            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">

              Comienza con 7 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.

            </p>



            {/* Billing Toggle */}

            <div className="flex justify-center">

              <div className="inline-flex items-center backdrop-blur-md bg-white/5 rounded-full p-1.5 border border-white/10 w-full max-w-md">

                <button

                  onClick={() => setBillingCycle('monthly')}

                  className={`flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)]' : 'text-white/60 hover:text-white'}`}

                  data-testid="toggle-monthly"

                >

                  Mensual

                </button>

                <button

                  onClick={() => setBillingCycle('annual')}

                  className={`flex-1 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${billingCycle === 'annual' ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)]' : 'text-white/60 hover:text-white'}`}

                  data-testid="toggle-annual"

                >

                  Anual · 1 Mes Gratis

                </button>

              </div>

            </div>

            {/* Selector de país → la landing refleja moneda/precio localizados del backend */}

            <div className="flex justify-center mt-4">

              <label className="inline-flex items-center gap-2 text-xs text-white/50">

                <span>{catalogLocale?.flag || '🌎'} Ver precios para:</span>

                <select

                  value={pricingCountry}

                  onChange={(e) => setPricingCountry(e.target.value)}

                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#f97316]"

                  data-testid="pricing-country-select"

                >

                  {PRICING_COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}

                </select>

              </label>

            </div>

          </motion.div>



          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">

            {[

              {

                id: 'esencial',

                name: 'El Despegue',

                priceMonthly: PLANS.find(p => p.slug === 'despegue').priceUsd * 4000,

                processes: 'Hasta 50 casos',

                description: 'Para abogados independientes que inician',

                color: '#3b82f6',

                features: PLANS.find(p => p.slug === 'despegue').features,

                icon: Briefcase

              },

              {

                id: 'profesional',

                name: 'El Salto Estratégico',

                priceMonthly: PLANS.find(p => p.slug === 'salto-estrategico').priceUsd * 4000,

                processes: 'Hasta 150 casos',

                description: 'La elección de los abogados exitosos',

                color: '#f97316',

                featured: true,

                features: PLANS.find(p => p.slug === 'salto-estrategico').features,

                icon: Award

              },

              {

                id: 'elite',

                name: 'Firma en Crecimiento',

                priceMonthly: PLANS.find(p => p.slug === 'firma-crecimiento').priceUsd * 4000,

                processes: 'Procesos ilimitados',

                description: 'Para firmas en crecimiento',

                color: '#8b5cf6',

                features: PLANS.find(p => p.slug === 'firma-crecimiento').features,

                icon: Sparkles

              },

              {

                id: 'ilimitado',

                name: 'Consolidación Empresarial',

                priceMonthly: PLANS.find(p => p.slug === 'consolidacion-empresarial').priceUsd * 4000,

                processes: 'Procesos ilimitados',

                description: 'Para firmas y bufetes consolidados',

                color: '#10b981',

                premium: true,

                features: PLANS.find(p => p.slug === 'consolidacion-empresarial').features,

                icon: Crown

              }

            ].map((plan, i) => {

              // Precio localizado desde el catálogo del backend (moneda del país).
              // Fallback a COP (estado previo) si el catálogo aún no carga o falla.
              const loc = catalog.find((c) => c.id === plan.id);

              const fmtPrice = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

              const monthlyDisplay = loc ? loc.monthly.display : fmtPrice(plan.priceMonthly);

              const annualDisplay = loc ? loc.annual.display : fmtPrice(plan.priceMonthly * 11);

              const monthlyEqDisplay = loc ? loc.annual.monthly_equivalent_display : fmtPrice(Math.round(plan.priceMonthly * 11 / 12));

              const priceDisplay = billingCycle === 'annual' ? annualDisplay : monthlyDisplay;



              return (

                <motion.div

                  key={plan.id}

                  initial={{ opacity: 0, y: 20 }}

                  whileInView={{ opacity: 1, y: 0 }}

                  viewport={{ once: true }}

                  transition={{ delay: i * 0.08 }}

                  className={`relative backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 hover:scale-[1.02] flex flex-col ${

                    plan.premium ? 'bg-gradient-to-br from-[#10b981]/15 via-[#0f172a]/50 to-[#f97316]/10 border-[#10b981]/50 lg:-translate-y-2' :

                    plan.featured ? 'bg-gradient-to-br from-[#f97316]/10 to-[#fb923c]/5 border-[#f97316]/40' :

                    'bg-white/5 border-white/10'

                  }`}

                  data-testid={`plan-${plan.id}`}

                >

                  {plan.premium && (

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#10b981] via-[#f97316] to-[#10b981] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">

                      <Crown className="w-3 h-3" /> PREMIUM

                    </div>

                  )}

                  {plan.featured && !plan.premium && (

                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">

                      Más Popular

                    </div>

                  )}



                  <div className="flex items-center gap-2 mb-4">

                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${plan.color}20`, borderColor: `${plan.color}40`, borderWidth: 1 }}>

                      <plan.icon className="w-5 h-5" style={{ color: plan.color }} />

                    </div>

                    <div>

                      <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: plan.color }}>{plan.name}</div>

                      <div className="text-xs text-white/40">{plan.processes}</div>

                    </div>

                  </div>



                  <div className="mb-1">

                    <div className="flex items-baseline gap-1">

                      <span className="text-3xl font-bold text-white">{priceDisplay}</span>

                    </div>

                    {billingCycle === 'annual' ? (

                      <div className="text-xs text-[#10b981] mt-1">

                        ≈ {monthlyEqDisplay}/mes · 1 mes gratis

                      </div>

                    ) : (

                      <div className="text-xs text-white/40 mt-1">por mes</div>

                    )}

                  </div>

                  <p className="text-xs text-white/60 mt-2 mb-5">{plan.description}</p>



                  <ul className="space-y-2 mb-6 flex-1">

                    {plan.features.map((f, fi) => (

                      <li key={fi} className="flex items-start gap-2 text-xs text-white/80">

                        <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />

                        <span>{f}</span>

                      </li>

                    ))}

                  </ul>



                  <a

                    href={`/register?plan=${plan.id}&cycle=${billingCycle}`}

                    className={`block w-full py-3 rounded-xl font-bold text-center text-sm transition-all ${

                      plan.premium ? 'bg-gradient-to-r from-[#10b981] via-[#f97316] to-[#10b981] text-white hover:shadow-[0_10px_30px_rgba(16,185,129,0.5)]' :

                      plan.featured ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white hover:shadow-[0_10px_30px_rgba(249,115,22,0.4)]' :

                      'bg-white/10 text-white hover:bg-white/20 border border-white/20'

                    }`}

                    data-testid={`plan-cta-${plan.id}`}

                  >

                    {plan.premium ? `👑 Comenzar con ${plan.name}` : `Comenzar con ${plan.name}`}

                  </a>

                </motion.div>

              );

            })}

          </div>



          <div className="text-center mt-10 text-white/50 text-sm flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">

            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10b981]" /> 7 días gratis</div>

            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10b981]" /> Sin permanencia</div>

            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10b981]" /> Mercado Pago / PayPal</div>

            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10b981]" /> Programa de referidos: 1 mes gratis por amigo</div>

          </div>



          {/* === MÉTODOS DE PAGO SEGUROS === */}

          <motion.aside

            initial={{ opacity: 0, y: 20 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="mt-12 max-w-3xl mx-auto"

            aria-labelledby="payment-methods-heading"

            data-testid="payment-methods-section"

          >

            <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 md:p-7">

              <div className="flex items-center justify-center gap-2 mb-1">

                <Lock className="w-4 h-4 text-[#f97316]" aria-hidden="true" />

                <h3 id="payment-methods-heading" className="text-sm uppercase tracking-[0.25em] text-white/70 font-semibold">

                  Métodos de pago seguros

                </h3>

              </div>

              <p className="text-center text-white/40 text-xs mb-5">

                Pasarelas integradas con cifrado bancario · Pagos en moneda local LATAM

              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">

                {/* MercadoPago — colores oficiales */}

                <div className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-[#009EE3]/15 to-[#0a0e1a]/40 border border-[#009EE3]/40 hover:border-[#009EE3] hover:shadow-[0_0_35px_rgba(0,158,227,0.45)] transition-all duration-300 hover:-translate-y-0.5">

                  <span className="relative flex items-center justify-center w-12 h-9 rounded-lg bg-[#009EE3]" aria-hidden="true">

                    <svg viewBox="0 0 48 24" className="h-5 w-auto" fill="none" aria-hidden="true">

                      <path d="M4 14 q8 -10 18 -2 q10 8 22 -2" stroke="#FFE600" strokeWidth="3.5" strokeLinecap="round" fill="none"/>

                    </svg>

                  </span>

                  <span className="font-bold tracking-tight text-white text-sm">Mercado<span className="text-[#009EE3]">Pago</span></span>

                </div>



                {/* PayPal — colores oficiales */}

                <div className="group flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-[#003087]/20 to-[#0a0e1a]/40 border border-[#009CDE]/40 hover:border-[#009CDE] hover:shadow-[0_0_35px_rgba(0,156,222,0.45)] transition-all duration-300 hover:-translate-y-0.5">

                  <svg viewBox="0 0 24 24" className="h-7 w-auto" aria-hidden="true">

                    <path d="M7.4 21l.3-1.7H4.2l2-12.5c0-.2.1-.3.3-.3h5.7c1.9 0 3.2.4 3.9 1.2.4.4.6.9.7 1.4.1.6.1 1.2-.1 2v.1l.1.1c.4.2.7.4.9.6.3.3.5.7.6 1.1.1.5.1 1 0 1.7-.2.7-.5 1.3-.9 1.8-.4.5-.9.9-1.5 1.2-.5.3-1.2.5-1.9.6-.7.1-1.4.2-2.2.2H11c-.4 0-.7.1-.9.4-.2.2-.4.5-.4.9l-.1.4-.5 2.8v.1c0 .1 0 .1-.1.1l-1.6.1z" fill="#003087"/>

                    <path d="M16.9 8.9c0 .1-.1.2-.1.3-.4 2.1-1.8 2.8-3.5 2.8h-.9c-.2 0-.4.2-.4.4l-.5 3-.1.8H10c-.2 0-.3-.1-.3-.3 0-.1 0-.2.1-.3l1.4-9c.1-.3.4-.6.7-.6h2.4c1.3 0 2.3.3 2.9.8.3.3.4.6.5 1 .1.3.1.7.1 1.1z" fill="#009CDE"/>

                  </svg>

                  <span className="font-bold tracking-tight text-sm"><span className="text-[#0079C1]">Pay</span><span className="text-[#009CDE]">Pal</span></span>

                </div>

              </div>

              <p className="text-center text-[12px] text-white/40 mt-6 leading-relaxed max-w-lg mx-auto">

                Las pasarelas están integradas en la arquitectura.<br className="hidden sm:block" />

                El procesamiento de cobros se activará durante la fase comercial.

              </p>

            </div>

          </motion.aside>

        </div>

      </section>

      <section id="abogados" className="py-20 px-6 relative overflow-hidden">

        <div 

          className="absolute inset-0 bg-cover bg-center opacity-10"

          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1800&q=80')" }}

        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#f97316]/20 via-transparent to-[#3b82f6]/20" />



        <div className="container mx-auto relative z-10">

          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Content */}

            <motion.div

              initial={{ opacity: 0, y: 30 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

            >

              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 border border-[#f97316]/30 backdrop-blur-sm text-[#f97316] text-xs font-bold uppercase tracking-wider mb-6">

                ◆ Programa de Abogados Aliados

              </span>



              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">

                Reciba clientes reales y haga crecer

                <span className="block bg-gradient-to-r from-[#f97316] to-[#fb923c] bg-clip-text text-transparent">

                  su práctica legal.

                </span>

              </h2>



              <p className="text-xl text-white/70 mb-8 leading-relaxed">

                Únase a nuestra red jurídica y acceda a nuevos casos, clientes calificados y oportunidades legales. Nosotros calificamos el caso, usted se enfoca en ejercer.

              </p>



              {/* Benefits */}

              <div className="space-y-4 mb-8">

                {[

                  {

                    title: 'Casos legales constantes',

                    description: 'Reciba solicitudes reales de clientes que buscan asesoría inmediata.'

                  },

                  {

                    title: 'Expansión internacional',

                    description: 'Conecte con clientes de diferentes países y áreas jurídicas.'

                  },

                  {

                    title: 'Respaldo administrativo',

                    description: 'Automatizamos captación, filtros y seguimiento comercial.'

                  }

                ].map((benefit, index) => (

                  <div key={`benefit-${benefit.title.replace(/\s+/g, '-').toLowerCase()}`} className="flex gap-4 items-start">

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center flex-shrink-0">

                      <CheckCircle className="w-6 h-6 text-white" />

                    </div>

                    <div>

                      <h4 className="text-white font-semibold mb-1">{benefit.title}</h4>

                      <p className="text-white/60 text-sm">{benefit.description}</p>

                    </div>

                  </div>

                ))}

              </div>



              {/* Stats */}

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">

                <div>

                  <div className="text-4xl font-bold text-[#f97316]">+1.400</div>

                  <div className="text-white/60 text-xs uppercase tracking-wide mt-1">Casos Mensuales</div>

                </div>

                <div>

                  <div className="text-2xl lg:text-3xl font-bold text-[#3b82f6]">Presencia Digital</div>

                  <div className="text-white/60 text-xs uppercase tracking-wide mt-1">LATAM</div>

                </div>

                <div>

                  <div className="text-4xl font-bold text-[#10b981]">168+</div>

                  <div className="text-white/60 text-xs uppercase tracking-wide mt-1">Abogados Aliados</div>

                </div>

              </div>

            </motion.div>



            {/* Right Form */}

            <motion.div

              initial={{ opacity: 0, scale: 0.95 }}

              whileInView={{ opacity: 1, scale: 1 }}

              viewport={{ once: true }}

              transition={{ delay: 0.2 }}

            >

              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl">

                <span className="inline-block text-[#f97316] text-xs font-bold uppercase tracking-wider mb-3">

                  REGISTRO PROFESIONAL

                </span>

                <h3 className="text-3xl font-bold text-white mb-2">Únase a nuestra red</h3>

                <p className="text-white/60 mb-6">Complete su perfil profesional y nuestro equipo evaluará su incorporación. Le contactaremos a su correo registrado.</p>



                <form onSubmit={handleLawyerSubmit} className="space-y-4" data-testid="lawyer-application-form">

                  <div>

                    <label className="block text-sm font-semibold text-white/80 mb-2">Nombre completo</label>

                    <Input 

                      type="text" 

                      placeholder="Dr. Juan Pérez" 

                      value={lawyerData.name}

                      onChange={(e) => setLawyerData({...lawyerData, name: e.target.value})}

                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20"

                      required

                      data-testid="lawyer-name"

                    />

                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Correo electrónico *</label>

                      <Input 

                        type="email" 

                        placeholder="dr.perez@bufete.com" 

                        value={lawyerData.email}

                        onChange={(e) => setLawyerData({...lawyerData, email: e.target.value})}

                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20"

                        required

                        data-testid="lawyer-email"

                      />

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Teléfono / WhatsApp</label>

                      <Input 

                        type="tel" 

                        placeholder="+57 3000000000" 

                        value={lawyerData.phone}

                        onChange={(e) => setLawyerData({...lawyerData, phone: e.target.value})}

                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20"

                        data-testid="lawyer-phone"

                      />

                    </div>

                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Especialidad legal</label>

                      <select

                        value={lawyerData.specialty}

                        onChange={(e) => setLawyerData({...lawyerData, specialty: e.target.value})}

                        className="w-full px-4 py-3 rounded-xl bg-[#0a0e1a] border border-white/20 text-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none"

                        data-testid="lawyer-specialty"

                      >

                        <option value="Derecho Laboral" className="bg-[#0a0e1a] text-white">Laboral</option>

                        <option value="Derecho de Familia" className="bg-[#0a0e1a] text-white">Familia</option>

                        <option value="Derecho Penal" className="bg-[#0a0e1a] text-white">Penal</option>

                        <option value="Derecho Civil" className="bg-[#0a0e1a] text-white">Civil</option>

                        <option value="Derecho Comercial" className="bg-[#0a0e1a] text-white">Comercial</option>

                        <option value="Derecho Administrativo" className="bg-[#0a0e1a] text-white">Administrativo</option>

                        <option value="Derecho Tributario" className="bg-[#0a0e1a] text-white">Tributario</option>

                      </select>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">País de ejercicio *</label>

                      <select 

                        value={lawyerData.country}

                        onChange={(e) => setLawyerData({...lawyerData, country: e.target.value})}

                        className="w-full px-4 py-3 rounded-xl bg-[#0a0e1a] border border-white/20 text-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none"

                        required

                        data-testid="lawyer-country"

                      >

                        <option value="" className="bg-[#0a0e1a]">— Seleccione —</option>

                        {LATAM_COUNTRIES.map(c => <option key={c} value={c} className="bg-[#0a0e1a] text-white">{c}</option>)}

                      </select>

                    </div>

                    <div>

                      <label className="block text-sm font-semibold text-white/80 mb-2">Ciudad *</label>

                      <Input

                        type="text"

                        placeholder="Escriba su ciudad"

                        value={lawyerData.city}

                        onChange={(e) => setLawyerData({...lawyerData, city: e.target.value})}

                        className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20"

                        required

                        data-testid="lawyer-city"

                      />

                    </div>

                  </div>



                  <div>

                    <label className="block text-sm font-semibold text-white/80 mb-2">Experiencia profesional</label>

                    <Textarea 

                      placeholder="Describa brevemente su experiencia jurídica, años de ejercicio y casos representativos" 

                      value={lawyerData.experience}

                      onChange={(e) => setLawyerData({...lawyerData, experience: e.target.value})}

                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20 min-h-[100px]"

                      required

                      data-testid="lawyer-experience"

                    />

                  </div>



                  {lawyerStatus.success ? (

                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}

                      className="rounded-xl bg-emerald-500/10 border border-emerald-500/40 p-4 text-emerald-200 text-sm flex items-start gap-3"

                      role="status"

                      data-testid="lawyer-success"

                    >

                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />

                      <div className="font-semibold leading-relaxed">{lawyerStatus.message}</div>

                    </motion.div>

                  ) : (

                    <Button 

                      type="submit"

                      disabled={lawyerStatus.loading}

                      className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6 transition-all disabled:opacity-60"

                      data-testid="lawyer-submit"

                    >

                      {lawyerStatus.loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando solicitud...</>) : 'Únase a nuestra red'}

                    </Button>

                  )}

                  {lawyerStatus.error && (

                    <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3" data-testid="lawyer-error">

                      {lawyerStatus.error}

                    </div>

                  )}

                </form>

              </div>

            </motion.div>

          </div>

        </div>

      </section>



      {/* CTA Section */}

      <section className="py-20 px-6">

        <div className="container mx-auto">

          <motion.div

            initial={{ opacity: 0, y: 20 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="backdrop-blur-xl bg-gradient-to-r from-[#3b82f6]/10 via-[#f97316]/10 to-[#10b981]/10 border border-white/20 rounded-3xl p-12 text-center relative overflow-hidden"

          >

            <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/5 via-[#f97316]/5 to-[#10b981]/5"></div>

            <div className="relative z-10">

              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">

                ¿Listo para Transformar tu Experiencia Legal?

              </h2>

              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">

                Únete a miles de clientes que ya confían en nuestra plataforma

              </p>

              <motion.a

                href="#consulta"

                whileHover={{ scale: 1.05 }}

                whileTap={{ scale: 0.97 }}

                className="relative inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-semibold text-lg overflow-hidden group shadow-[0_0_30px_rgba(249,115,22,0.45)]"

                data-testid="cta-final"

              >

                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#fb923c] opacity-50 blur-md animate-pulse pointer-events-none" />

                <span className="relative flex items-center">

                  Cuéntanos sobre tu caso

                  <motion.span animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }} className="ml-2 inline-flex">

                    <ArrowRight className="w-5 h-5" />

                  </motion.span>

                </span>

              </motion.a>

            </div>

          </motion.div>

        </div>

      </section>

      {/* === FIRM OS PREVIEW (Bloque de Prueba) === */}
      <section className="relative py-16 px-6 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <FirmOSPreviewBlock />
        </div>
      </section>

      {/* === PUNTO CERO PARTNER (Solución Empresarial) === */}

      <section id="partner" className="relative py-24 px-6 overflow-hidden">

        {/* Fondo premium con profundidad */}

        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.12),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.10),transparent_50%)]" />

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-px bg-gradient-to-r from-transparent via-[#f97316]/50 to-transparent" />



        <div className="container mx-auto relative z-10">

          {/* Encabezado */}

          <motion.div

            initial={{ opacity: 0, y: 30 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="text-center max-w-4xl mx-auto mb-14"

          >

            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#f97316]/20 via-[#3b82f6]/20 to-[#10b981]/20 border border-white/15 backdrop-blur-sm text-white/80 text-xs font-bold uppercase tracking-[0.25em] mb-6">

              <Crown className="w-4 h-4 text-[#f97316]" /> Solución Empresarial Exclusiva

            </span>

            <h2 className="text-5xl lg:text-7xl font-black mb-5 tracking-tight">

              <span className="bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#3b82f6] bg-clip-text text-transparent">PUNTO CERO PARTNER</span>

            </h2>

            <p className="text-xl lg:text-2xl text-white font-semibold mb-6">

              ¿Gestionas una firma jurídica en crecimiento o un bufete con más de 10 profesionales?

            </p>

            <div className="space-y-4 text-white/70 leading-relaxed text-left md:text-center max-w-3xl mx-auto">

              <p>Lleva tu organización legal al siguiente nivel con una solución empresarial exclusiva diseñada para firmas que requieren mayor capacidad operativa, independencia tecnológica y personalización avanzada.</p>

              <p>Obtén una instancia privada de Punto Cero completamente configurada para tu organización, con infraestructura independiente, identidad corporativa propia y funcionalidades adaptadas a tus procesos internos.</p>

              <p>Nuestra solución empresarial permite centralizar operaciones, automatizar procesos jurídicos, optimizar la productividad de los equipos y escalar la gestión legal sin limitaciones.</p>

            </div>

          </motion.div>



          {/* Beneficios — tarjetas premium */}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-14">

            {[

              { icon: Crown, title: 'CONTROL TOTAL', color: '#f97316', desc: 'Administra tu propio entorno privado con capacidad para gestionar más de 500 casos activos, múltiples equipos de trabajo y operaciones simultáneas sin interferencias.' },

              { icon: Scale, title: 'INDEPENDENCIA TECNOLÓGICA', color: '#3b82f6', desc: 'Desarrollo personalizado con infraestructura exclusiva para tu firma.' },

              { icon: Shield, title: 'SEGURIDAD EMPRESARIAL', color: '#10b981', desc: 'Entorno robusto con altos estándares de protección, privacidad y control de acceso.' },

              { icon: Sparkles, title: 'PERSONALIZACIÓN AVANZADA', color: '#8b5cf6', desc: 'Adaptamos módulos, procesos, automatizaciones y flujos de trabajo según las necesidades de tu organización.' },

              { icon: Users, title: 'CONSULTORÍA EXCLUSIVA', color: '#ec4899', desc: 'Acompañamiento especializado desde la implementación hasta la puesta en marcha.' },

            ].map((b, i) => (

              <motion.div

                key={`partner-${b.title.replace(/\s+/g, '-').toLowerCase()}`}

                initial={{ opacity: 0, y: 30 }}

                whileInView={{ opacity: 1, y: 0 }}

                viewport={{ once: true }}

                transition={{ delay: i * 0.08 }}

                className="relative backdrop-blur-2xl bg-white/[0.04] border border-white/10 rounded-3xl p-7 hover:bg-white/[0.07] hover:border-white/20 hover:shadow-[0_25px_70px_-20px_rgba(0,0,0,0.7)] group"

                style={{ transition: 'all 0.4s ease' }}

              >

                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border" style={{ background: `${b.color}1f`, borderColor: `${b.color}55` }}>

                  <b.icon className="w-7 h-7" style={{ color: b.color }} />

                </div>

                <h3 className="text-white font-bold tracking-wide mb-2">{b.title}</h3>

                <p className="text-white/60 text-sm leading-relaxed">{b.desc}</p>

              </motion.div>

            ))}



            {/* Ideal para */}

            <motion.div

              initial={{ opacity: 0, y: 30 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ delay: 0.4 }}

              className="relative backdrop-blur-2xl bg-gradient-to-br from-[#f97316]/10 to-[#3b82f6]/10 border border-[#f97316]/30 rounded-3xl p-7"

            >

              <h3 className="text-white font-bold tracking-wide mb-4">IDEAL PARA</h3>

              <ul className="space-y-2.5">

                {['Firmas Jurídicas', 'Bufetes Corporativos', 'Redes de Abogados', 'Organizaciones Legales de Alto Volumen', 'Equipos Jurídicos Empresariales', 'Operaciones con más de 10 profesionales'].map(item => (

                  <li key={item} className="flex items-start gap-2 text-sm text-white/80">

                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#10b981]" />

                    <span>{item}</span>

                  </li>

                ))}

              </ul>

            </motion.div>

          </div>



          {/* Cierre + CTA */}

          <motion.div

            initial={{ opacity: 0, y: 30 }}

            whileInView={{ opacity: 1, y: 0 }}

            viewport={{ once: true }}

            className="max-w-4xl mx-auto text-center backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-10 relative overflow-hidden"

          >

            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#f97316]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">

              <p className="text-white/70 mb-5 leading-relaxed">

                Transforma la manera en que gestionas tu práctica legal con una plataforma empresarial diseñada para crecer junto a tu organización.

              </p>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-lg font-bold mb-8">

                <span className="text-[#f97316]">Más capacidad.</span>

                <span className="text-[#3b82f6]">Más control.</span>

                <span className="text-[#10b981]">Más seguridad.</span>

                <span className="text-[#8b5cf6]">Más productividad.</span>

              </div>

              <p className="text-white/50 text-sm mb-8">Todo bajo una infraestructura exclusiva para tu firma.</p>

              <motion.button

                onClick={() => setShowFirmRegistration(true)}

                whileHover={{ scale: 1.05 }}

                whileTap={{ scale: 0.97 }}

                className="relative inline-flex items-center px-10 py-5 rounded-2xl bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#3b82f6] text-white font-bold text-lg overflow-hidden group shadow-[0_0_40px_rgba(249,115,22,0.45)] cursor-pointer border-0"

                data-testid="cta-partner"

              >

                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#3b82f6] opacity-50 blur-md animate-pulse pointer-events-none" />

                <span className="absolute top-0 left-[-60%] h-full w-1/3 bg-white/40 skew-x-[-20deg] blur-md group-hover:left-[140%] transition-all duration-700 ease-out pointer-events-none" />

                <span className="relative flex items-center">

                  <Crown className="w-5 h-5 mr-2" />

                  REGISTRAR MI FIRMA

                </span>

              </motion.button>

            </div>

          </motion.div>

        </div>

      </section>



      {/* Footer */}

      {/* ───────── Sellos de Seguridad y Confianza ───────── */}
      <SecuritySeals />

      <footer className="border-t border-white/10 backdrop-blur-md bg-[#0f172a]/70 py-12 px-6" role="contentinfo">

        <div className="container mx-auto">

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">

            {/* Brand Section */}

            <section aria-labelledby="footer-brand">

              <div className="flex items-center gap-2 mb-3">

                <img src="https://cdn.builder.io/api/v1/image/assets%2F18d3193fe50643dfa7d4c7599f2bf550%2Fb71558facffb495fb2401892611fe06c?format=webp&width=800&height=1200" alt="Punto Cero" className="w-9 h-9 object-contain" aria-hidden="true" />

                <h3 id="footer-brand" className="text-xl font-bold text-white">PUNTO CERO LEGAL</h3>

              </div>

              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f97316] mb-3">

                Punto Cero System OS · Oficina Virtual

              </p>

              <p className="text-white/60 text-sm leading-relaxed">

                Oficina jurídica virtual presente en 18 países de LATAM. Soluciones legales profesionales con tecnología avanzada.

              </p>

            </section>



            {/* Contact Section */}

            <section aria-labelledby="footer-contact">

              <h3 id="footer-contact" className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Contacto</h3>

              <address className="not-italic space-y-3 text-white/60 text-sm">

                <a 

                  href="mailto:puntocerolegal@gmail.com" 

                  className="flex items-center gap-2 hover:text-[#3b82f6] transition-colors"

                  aria-label="Enviar correo a puntocerolegal@gmail.com"

                >

                  <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />

                  <span>puntocerolegal@gmail.com</span>

                </a>

                <a 

                  href="https://wa.me/573028322083" 

                  target="_blank" 

                  rel="noopener noreferrer"

                  className="flex items-center gap-2 hover:text-[#10b981] transition-colors"

                  aria-label="WhatsApp Colombia +57 302 832 2083"

                >

                  <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />

                  <span>WhatsApp Colombia: +57 3028322083</span>

                </a>

                <a 

                  href="https://wa.me/584246487378" 

                  target="_blank" 

                  rel="noopener noreferrer"

                  className="flex items-center gap-2 hover:text-[#10b981] transition-colors"

                  aria-label="WhatsApp Venezuela +58 0424 648 7378"

                >

                  <MessageCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />

                  <span>WhatsApp Venezuela: +58 04246487378</span>

                </a>

              </address>

            </section>



            {/* Navigation Section */}

            <nav aria-labelledby="footer-nav">

              <h3 id="footer-nav" className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Navegación</h3>

              <ul className="space-y-2 text-white/60 text-sm">

                <li><a href="#inicio" className="hover:text-[#3b82f6] transition-colors">Inicio</a></li>

                <li><a href="#servicios" className="hover:text-[#3b82f6] transition-colors">Servicios</a></li>

                <li><a href="#planes" className="hover:text-[#3b82f6] transition-colors">Planes</a></li>

                <li><a href="#consulta" className="hover:text-[#3b82f6] transition-colors">Contacto</a></li>

              </ul>

            </nav>



            {/* Legal Section */}

            <nav aria-labelledby="footer-legal">

              <h3 id="footer-legal" className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Legal</h3>

              <ul className="space-y-2 text-white/60 text-sm">

                <li>

                  <Link to="/privacy" className="hover:text-[#3b82f6] transition-colors" aria-label="Política de Privacidad">

                    Política de Privacidad

                  </Link>

                </li>

                <li>

                  <Link to="/cookies" className="hover:text-[#3b82f6] transition-colors" aria-label="Política de Cookies">

                    Política de Cookies

                  </Link>

                </li>

                <li>

                  <Link to="/terms" className="hover:text-[#3b82f6] transition-colors" aria-label="Términos y Condiciones">

                    Términos y Condiciones

                  </Link>

                </li>

                <li>

                  <Link to="/subscription-agreement" className="hover:text-[#3b82f6] transition-colors" aria-label="Contrato de Suscripción Profesional">

                    Contrato de Suscripción Profesional

                  </Link>

                </li>

              </ul>

            </nav>



            {/* Social Media Section */}

            <section aria-labelledby="footer-social">

              <h3 id="footer-social" className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Síguenos</h3>

              <div className="flex gap-3 flex-wrap">

                <a

                  href="https://www.instagram.com/puntocerolegal/"

                  target="_blank"

                  rel="noopener noreferrer"

                  aria-label="Síguenos en Instagram"

                  className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f97316] via-[#ec4899] to-[#8b5cf6] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all duration-300"

                >

                  <Instagram className="w-5 h-5 text-white" aria-hidden="true" />

                </a>

                <a

                  href="https://www.facebook.com/Punto7Cero7/"

                  target="_blank"

                  rel="noopener noreferrer"

                  aria-label="Síguenos en Facebook"

                  className="w-11 h-11 rounded-xl bg-[#1877f2] flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(24,119,242,0.5)] transition-all duration-300"

                >

                  <Facebook className="w-5 h-5 text-white" aria-hidden="true" />

                </a>

                <a

                  href="https://www.tiktok.com/@puntocerolegal7"

                  target="_blank"

                  rel="noopener noreferrer"

                  aria-label="TikTok Punto Cero Legal"

                  title="@puntocerolegal7"

                  className="w-11 h-11 rounded-xl bg-black border border-white/20 flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 relative overflow-hidden group"

                >

                  <svg className="w-5 h-5 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">

                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>

                  </svg>

                </a>

              </div>

            </section>

          </div>



          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">

            <p>&copy; 2026 PUNTO CERO LEGAL · Todos los derechos reservados.</p>

            <p className="text-white/40 text-xs">Hecho con dedicación para LATAM</p>

          </div>

        </div>

      </footer>



      {/* === BOTÓN FLOTANTE WHATSAPP DE SOPORTE === */}

      <motion.a

        href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Hola, quiero soporte técnico de Punto Cero Legal')}`}

        onClick={() => { try { trackEvent('whatsapp_contact', { source: 'landing_floating', intent: 'soporte_tecnico' }); } catch (e) {} }}

        target="_blank"

        rel="noopener noreferrer"

        aria-label="Quiero soporte técnico por WhatsApp"

        title="Quiero soporte técnico"

        data-testid="floating-whatsapp"

        initial={{ scale: 0, opacity: 0 }}

        animate={{ scale: 1, opacity: 1 }}

        transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}

        whileHover={{ scale: 1.08 }}

        whileTap={{ scale: 0.95 }}

        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 pl-4 pr-5 py-3 rounded-full bg-gradient-to-br from-[#25d366] to-[#128c7e] text-white shadow-[0_10px_30px_rgba(37,211,102,0.5)] hover:shadow-[0_16px_48px_rgba(37,211,102,0.8)] transition-shadow"

      >

        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor" aria-hidden="true">

          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01A9.816 9.816 0 0 0 12.04 2zm5.69 14.13c-.24.68-1.4 1.3-1.95 1.38-.52.08-1.16.12-1.86-.12-.43-.14-.98-.32-1.68-.64-2.97-1.28-4.91-4.26-5.05-4.46-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37l.57.01c.18.01.43-.07.67.51.24.59.83 2.05.91 2.19.07.15.12.32.02.51-.09.2-.14.32-.27.49-.13.17-.27.38-.39.5-.13.13-.27.27-.12.53.15.27.66 1.08 1.41 1.75.97.87 1.78 1.13 2.04 1.26.27.13.42.11.58-.07.16-.18.67-.78.85-1.05.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.27.13.44.2.51.31.07.12.07.71-.17 1.39z"/>

        </svg>

        <span className="text-base font-bold leading-tight whitespace-nowrap">Quiero soporte técnico</span>

        <span className="absolute -inset-1 rounded-full animate-ping bg-[#25d366]/25 pointer-events-none" />

      </motion.a>

      {/* Modal de Registro de Firmas — Versión Streamlined (SPRINT UX) */}
      <FirmRegistrationStreamlined
        open={showFirmRegistration}
        onClose={() => setShowFirmRegistration(false)}
        onSuccess={(leadData) => {
          navigate('/onboarding-firma', {
            state: {
              message: '¡Excelente! Tu firma ha sido registrada. Completa tu perfil en el siguiente paso.',
              leadId: leadData.lead_id
            }
          });
        }}
      />

      {/* Capa visual del chatbot existente — se abre tras enviar un formulario */}
      <ChatWidget session={chat} onClose={() => setChat({ open: false })} />

    </div>

  );

};



export default LandingPage;
