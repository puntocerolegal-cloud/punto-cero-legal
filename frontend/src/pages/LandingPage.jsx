import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Lock, Users, Award, CheckCircle, ArrowRight, Scale, FileText, Clock,
  Briefcase, Calendar, FolderKanban, BookOpen, Video, Brain, Menu, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

export const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
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
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0f172a]/80 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
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
              <a href="#equipo" className="text-white/80 hover:text-[#3b82f6] transition-colors">Equipo</a>
              <a href="#abogados" className="text-white/80 hover:text-[#3b82f6] transition-colors">Abogados Aliados</a>
              <Button variant="outline" className="border-[#f97316] text-[#f97316] hover:bg-[#f97316] hover:text-white transition-all">
                Iniciar Sesión
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
              <a href="#equipo" className="block text-white/80 hover:text-[#3b82f6] transition-colors">Equipo</a>
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
                La asesoría legal que necesita,
                <br />
                <span className="bg-gradient-to-r from-[#3b82f6] via-[#f97316] to-[#10b981] bg-clip-text text-transparent">
                  sin complicaciones.
                </span>
              </h1>
              
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                Reciba orientación jurídica profesional de abogados certificados en áreas civiles, migratorias, corporativas y documentales. Atención rápida, confidencial y personalizada.
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
                  <div className="text-4xl font-bold text-[#f97316]">18</div>
                  <div className="text-white/60 text-sm uppercase tracking-wide mt-1">Países</div>
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
                    Solicitar evaluación vía WhatsApp
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
                description: 'Acceda a una red de +168 abogados aliados especializados en 18 países.',
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

      {/* Lawyers Alliance Section */}
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
                  <div className="text-4xl font-bold text-[#3b82f6]">18</div>
                  <div className="text-white/60 text-xs uppercase tracking-wide mt-1">Países</div>
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
      <footer className="border-t border-white/10 backdrop-blur-md bg-[#0f172a]/70 py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-[#f97316]" />
                <span className="text-xl font-bold text-white">Punto Cero Legal</span>
              </div>
              <p className="text-white/60 text-sm">
                Transformando la experiencia legal con tecnología de vanguardia.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#modulos" className="hover:text-[#3b82f6] transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-[#3b82f6] transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-[#3b82f6] transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#equipo" className="hover:text-[#3b82f6] transition-colors">Sobre Nosotros</a></li>
                <li><a href="#equipo" className="hover:text-[#3b82f6] transition-colors">Equipo</a></li>
                <li><a href="https://wa.me/573028322083" className="hover:text-[#3b82f6] transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-[#3b82f6] transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-[#3b82f6] transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-[#3b82f6] transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            <p>&copy; 2025 Punto Cero Legal. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;