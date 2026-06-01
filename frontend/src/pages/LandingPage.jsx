import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Lock, Users, Award, CheckCircle, ArrowRight, Scale, FileText, Clock,
  Briefcase, Calendar, FolderKanban, BookOpen, Video, Brain, Menu, X,
  Mail, MessageCircle, Instagram, Facebook, Crown, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const handleAccess = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (['admin', 'admin_general', 'socio_comercial'].includes(user?.role)) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };
  const [formData, setFormData] = useState({
    name: '',
    area: 'Derecho Migratorio',
    message: ''
  });
  const [lawyerData, setLawyerData] = useState({
    name: '',
    specialty: 'Derecho Migratorio',
    country: '',
    experience: ''
  });

  const handleClientSubmit = (e) => {
    e.preventDefault();
    const phone = "573028322083";
    const text = `Hola, mi nombre es *${formData.name}*.%0A%0AHe completado el formulario de evaluación:%0A🏛️ *Área:* ${formData.area}%0A📝 *Caso:* ${formData.message}`;
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleLawyerSubmit = (e) => {
    e.preventDefault();
    const phone = "573028322083";
    const message = `🏛️ *NUEVA SOLICITUD DE ALIANZA*%0A%0A*Nombre:* ${lawyerData.name}%0A*Especialidad:* ${lawyerData.specialty}%0A*País:* ${lawyerData.country}%0A*Experiencia:* ${lawyerData.experience}`;
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
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
              <Scale className="w-8 h-8 text-[#f97316]" />
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
              <Button onClick={handleAccess} variant="outline" className="border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white transition-all" data-testid="navbar-access-btn">
                {isAuthenticated ? 'Mi Dashboard' : 'Iniciar Sesión'}
              </Button>
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
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
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
              
              <div className="flex flex-wrap gap-4 mb-12">
                <a 
                  href="https://wa.me/573028322083?text=Hola,%20deseo%20solicitar%20una%20asesoría%20legal%20especializada." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-semibold hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all duration-300 group"
                >
                  Solicitar Asesoría
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="https://wa.me/573028322083?text=Hola,%20me%20gustaría%20que%20evaluaran%20mi%20caso%20legal." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
                >
                  Evaluar mi caso
                </a>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl">
                <span className="inline-block text-[#f97316] text-xs font-bold uppercase tracking-wider mb-3">
                  CONSULTA PRIORITARIA
                </span>
                <h2 className="text-3xl font-bold text-white mb-2">Cuéntenos su caso</h2>
                <p className="text-white/60 mb-6">Un especialista legal revisará su solicitud y le contactará en breve.</p>

                <form onSubmit={handleClientSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Nombre completo</label>
                    <Input 
                      type="text" 
                      placeholder="Ingrese su nombre" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Área legal</label>
                    <select 
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 outline-none"
                    >
                      <option value="Derecho Migratorio">Derecho Migratorio</option>
                      <option value="Litigio Civil">Litigio Civil</option>
                      <option value="Derecho Corporativo">Derecho Corporativo</option>
                      <option value="Gestión Documental">Gestión Documental</option>
                      <option value="Propiedad Intelectual">Propiedad Intelectual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Describa su situación</label>
                    <Textarea 
                      placeholder="Explique brevemente su caso" 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 min-h-[100px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6 transition-all"
                  >
                    Enviar Caso
                  </Button>
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
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 group h-full">
                  <div 
                    className="h-32 bg-cover bg-center relative"
                    style={{ backgroundImage: `url('${module.image}?auto=format&fit=crop&w=600&q=80')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f172a]"></div>
                  </div>
                  <div className="p-6">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 -mt-14 relative z-10"
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

      {/* Trust Section */}
      <section id="servicios" className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-4">
              Confianza y <span className="text-[#10b981]">Compromiso</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Trabajamos para ti con profesionalismo, experiencia y dedicación
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: 'Trayectoria Comprobada',
                description: 'Más de una década conectando clientes con los mejores abogados especializados en múltiples áreas del derecho.',
                color: '#3b82f6'
              },
              {
                icon: Users,
                title: 'Trabajamos Para Ti',
                description: 'Tu caso es nuestra prioridad. Cada cliente recibe atención personalizada y seguimiento constante de principio a fin.',
                color: '#f97316'
              },
              {
                icon: Shield,
                title: 'Red de Confianza',
                description: 'Solo trabajamos con abogados certificados y verificados. Tu tranquilidad es nuestro compromiso diario.',
                color: '#10b981'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 h-full">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border"
                    style={{ 
                      background: `${item.color}20`,
                      borderColor: `${item.color}40`
                    }}
                  >
                    <item.icon className="w-8 h-8" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
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
            <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/5 rounded-full p-1.5 border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white' : 'text-white/60 hover:text-white'}`}
                data-testid="toggle-monthly"
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all relative ${billingCycle === 'annual' ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white' : 'text-white/60 hover:text-white'}`}
                data-testid="toggle-annual"
              >
                Anual
                <span className="absolute -top-2 -right-2 bg-[#10b981] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">1 MES GRATIS</span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {[
              {
                id: 'esencial',
                name: 'Esencial',
                priceMonthly: 75000,
                processes: '20 procesos',
                description: 'Para abogados independientes que inician',
                color: '#3b82f6',
                features: ['20 procesos activos', 'CRM básico', 'Agenda personal', '5 GB almacenamiento', 'IA Jurídica (50 consultas/mes)', 'Soporte email'],
                icon: Briefcase
              },
              {
                id: 'profesional',
                name: 'Profesional',
                priceMonthly: 140000,
                processes: '60 procesos',
                description: 'La elección de los abogados exitosos',
                color: '#f97316',
                featured: true,
                features: ['60 procesos activos', 'CRM avanzado + Pipeline', 'Agenda sincronizada', '20 GB almacenamiento', 'IA Jurídica (200 consultas)', 'Sala Conferencias HD', 'Facturación automática', 'Soporte prioritario'],
                icon: Award
              },
              {
                id: 'elite',
                name: 'Elite',
                priceMonthly: 195000,
                processes: '100 procesos',
                description: 'Para firmas en crecimiento',
                color: '#8b5cf6',
                features: ['100 procesos activos', 'CRM Pro + Automatizaciones', 'Multi-agenda equipo', '50 GB almacenamiento', 'IA Jurídica (500 consultas)', 'Conferencias HD + Grabación', 'Facturación + Reportes', 'Soporte 24/7', 'Multi-usuario (hasta 3)'],
                icon: Sparkles
              },
              {
                id: 'ilimitado',
                name: 'Ilimitado',
                priceMonthly: 275000,
                processes: 'Procesos ilimitados',
                description: 'Para firmas y bufetes consolidados',
                color: '#10b981',
                premium: true,
                features: ['Procesos ILIMITADOS', 'CRM Empresarial completo', 'API personalizada', 'Almacenamiento ILIMITADO', 'IA Jurídica ILIMITADA', 'White-label disponible', 'Account Manager dedicado', 'SLA garantizado 99.9%', 'Usuarios ilimitados', 'Integraciones a medida'],
                icon: Crown
              }
            ].map((plan, i) => {
              const annualPrice = plan.priceMonthly * 11; // 12 meses - 1 mes gratis
              const displayPrice = billingCycle === 'annual' ? annualPrice : plan.priceMonthly;
              const monthlyEq = billingCycle === 'annual' ? Math.round(annualPrice / 12) : plan.priceMonthly;
              const fmtPrice = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

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
                      <span className="text-3xl font-bold text-white">{fmtPrice(displayPrice)}</span>
                    </div>
                    {billingCycle === 'annual' ? (
                      <div className="text-xs text-[#10b981] mt-1">
                        ≈ {fmtPrice(monthlyEq)}/mes · 1 mes gratis
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
                    {plan.premium ? '👑 Unirse al Ilimitado' : `Comenzar con ${plan.name}`}
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
                  <div key={index} className="flex gap-4 items-start">
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
                <p className="text-white/60 mb-6">Complete su perfil profesional y nuestro equipo evaluará su incorporación vía WhatsApp.</p>

                <form onSubmit={handleLawyerSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Nombre completo</label>
                    <Input 
                      type="text" 
                      placeholder="Dr. Juan Pérez" 
                      value={lawyerData.name}
                      onChange={(e) => setLawyerData({...lawyerData, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Especialidad legal</label>
                    <select 
                      value={lawyerData.specialty}
                      onChange={(e) => setLawyerData({...lawyerData, specialty: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20 outline-none"
                    >
                      <option value="Derecho Migratorio">Derecho Migratorio</option>
                      <option value="Derecho Corporativo">Derecho Corporativo</option>
                      <option value="Litigio Civil">Litigio Civil</option>
                      <option value="Derecho Penal">Derecho Penal</option>
                      <option value="Propiedad Intelectual">Propiedad Intelectual</option>
                      <option value="Derecho Laboral">Derecho Laboral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">País de ejercicio</label>
                    <Input 
                      type="text" 
                      placeholder="Colombia" 
                      value={lawyerData.country}
                      onChange={(e) => setLawyerData({...lawyerData, country: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2">Experiencia profesional</label>
                    <Textarea 
                      placeholder="Describa brevemente su experiencia jurídica" 
                      value={lawyerData.experience}
                      onChange={(e) => setLawyerData({...lawyerData, experience: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#f97316] focus:ring-[#f97316]/20 min-h-[100px]"
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6 transition-all"
                  >
                    Solicitar incorporación vía WhatsApp
                  </Button>
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
              <a 
                href="https://wa.me/573028322083?text=Hola,%20deseo%20comenzar%20mi%20prueba%20gratuita." 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(249,115,22,0.5)] transition-all duration-300"
              >
                Comenzar Prueba Gratuita
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-md bg-[#0f172a]/70 py-12 px-6" role="contentinfo">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <section aria-labelledby="footer-brand">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-[#f97316]" aria-hidden="true" />
                <h3 id="footer-brand" className="text-xl font-bold text-white">PUNTO CERO LEGAL</h3>
              </div>
              <p className="text-[#f97316] text-sm font-semibold mb-2">Inversiones y Variedades DJGG 2013</p>
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

            {/* Legal Section */}
            <nav aria-labelledby="footer-legal">
              <h3 id="footer-legal" className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Legal</h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <a href="#privacidad" className="hover:text-[#3b82f6] transition-colors" aria-label="Política de Privacidad">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#cookies" className="hover:text-[#3b82f6] transition-colors" aria-label="Política de Cookies">
                    Política de Cookies
                  </a>
                </li>
                <li>
                  <a href="#terminos" className="hover:text-[#3b82f6] transition-colors" aria-label="Términos y Condiciones">
                    Términos y Condiciones
                  </a>
                </li>
              </ul>
            </nav>

            {/* Social Media Section */}
            <section aria-labelledby="footer-social">
              <h3 id="footer-social" className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Síguenos</h3>
              <div className="flex gap-3 flex-wrap">
                <a 
                  href="https://www.instagram.com/puntoceroconsultores/" 
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
                  href="https://www.tiktok.com/@puntoceroconsultores" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Síguenos en TikTok"
                  className="w-11 h-11 rounded-xl bg-black border border-white/20 flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 relative overflow-hidden group"
                >
                  <svg className="w-5 h-5 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
                  </svg>
                </a>
              </div>
              <p className="text-white/40 text-xs mt-4">@puntoceroconsultores</p>
            </section>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
            <p>&copy; 2025 PUNTO CERO LEGAL · Inversiones y Variedades DJGG 2013. Todos los derechos reservados.</p>
            <p className="text-white/40 text-xs">Hecho con dedicación para LATAM</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;