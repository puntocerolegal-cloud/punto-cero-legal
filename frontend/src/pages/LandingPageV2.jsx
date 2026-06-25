import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Building2, Users, TrendingUp, Shield,
  Briefcase, Scale, MessageCircle, Menu, X, ChevronDown
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { FirmRegistrationModal } from '../components/FirmRegistrationModal';
import { trackEvent } from '../lib/analytics';
import { useAuth } from '../contexts/AuthContext';

export function LandingPageV2() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFirmRegistration, setShowFirmRegistration] = useState(false);

  const handleAccess = () => {
    if (isAuthenticated) {
      navigate(user?.firm_id ? '/firm-os' : '/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleFirmRegistration = () => {
    setShowFirmRegistration(true);
    trackEvent('firm_registration_started', { source: 'landing' });
  };

  const handleViewPartners = () => {
    navigate('/partners');
    trackEvent('partners_view', { source: 'landing' });
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER / NAVEGACIÓN */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white">Punto Cero</div>
                <div className="text-xs text-orange-400 font-semibold">FIRMAS</div>
              </div>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('funcionalidades')}
                className="text-white/70 hover:text-white transition-colors"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection('beneficios')}
                className="text-white/70 hover:text-white transition-colors"
              >
                Beneficios
              </button>
              <button
                onClick={() => scrollToSection('planes')}
                className="text-white/70 hover:text-white transition-colors"
              >
                Planes
              </button>
              <button
                onClick={handleViewPartners}
                className="text-white/70 hover:text-white transition-colors"
              >
                Canales Comerciales
              </button>
            </div>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-3">
              {!isAuthenticated && (
                <Button
                  onClick={handleAccess}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Ingresar
                </Button>
              )}
              <Button
                onClick={handleFirmRegistration}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                Registra tu Firma
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Mobile Menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden text-white"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </nav>

          {/* Mobile Menu Dropdown */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:hidden mt-4 space-y-3 pb-4"
            >
              <button
                onClick={() => scrollToSection('funcionalidades')}
                className="block w-full text-left text-white/70 hover:text-white py-2"
              >
                Funcionalidades
              </button>
              <button
                onClick={() => scrollToSection('beneficios')}
                className="block w-full text-left text-white/70 hover:text-white py-2"
              >
                Beneficios
              </button>
              <button
                onClick={() => scrollToSection('planes')}
                className="block w-full text-left text-white/70 hover:text-white py-2"
              >
                Planes
              </button>
              <button
                onClick={handleViewPartners}
                className="block w-full text-left text-white/70 hover:text-white py-2"
              >
                Canales Comerciales
              </button>
              <div className="pt-4 border-t border-white/10 space-y-2">
                {!isAuthenticated && (
                  <Button
                    onClick={handleAccess}
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                  >
                    Ingresar
                  </Button>
                )}
                <Button
                  onClick={handleFirmRegistration}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                >
                  Registra tu Firma
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
          >
            La Plataforma Jurídica<br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Para tu Firma
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Gestiona casos, clientes, finanzas y equipo en una sola plataforma.
            Automatiza procesos. Crece sin límites.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={handleFirmRegistration}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-8 py-6"
            >
              Comienza Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => scrollToSection('funcionalidades')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
            >
              Conocer Más
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Instalación en 5 minutos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Soporte 24/7
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FLUJO DE ONBOARDING */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            De 0 a 100 en 4 pasos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: Building2,
                title: 'Registra tu Firma',
                description: 'Crea tu cuenta con los datos básicos'
              },
              {
                step: 2,
                icon: Shield,
                title: 'Aprobación',
                description: 'Nuestro equipo valida tu información'
              },
              {
                step: 3,
                icon: Users,
                title: 'Configura tu Equipo',
                description: 'Invita abogados y establece roles'
              },
              {
                step: 4,
                icon: TrendingUp,
                title: 'Crece tu Firma',
                description: 'Acceso completo a todas las funcionalidades'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg p-6 border border-white/10 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold text-blue-400">{item.step}</div>
                    <item.icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-blue-400/50" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FUNCIONALIDADES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section id="funcionalidades" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Todo lo que tu firma necesita
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Briefcase, title: 'Gestión de Casos', description: 'Seguimiento completo de casos desde inicio hasta cierre' },
              { icon: Users, title: 'CRM Jurídico', description: 'Base de datos de clientes y prospectos integrada' },
              { icon: TrendingUp, title: 'Facturación', description: 'Genera facturas, cobros y reportes financieros' },
              { icon: Scale, title: 'Documentos', description: 'Biblioteca centralizada de documentos y plantillas' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <item.icon className="w-8 h-8 text-blue-400 mt-1" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* BENEFICIOS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section id="beneficios" className="py-20 px-6 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Por qué elegir Punto Cero
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Seguridad Empresarial',
                description: 'Certificaciones ISO 27001, encriptación end-to-end, backups automáticos'
              },
              {
                icon: Users,
                title: 'Colaboración sin Límites',
                description: 'Invita a tu equipo completo. Controla accesos por rol'
              },
              {
                icon: TrendingUp,
                title: 'Escalable',
                description: 'Crece de 1 a 100 abogados sin cambiar de plataforma'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 rounded-lg p-8 border border-blue-500/20"
              >
                <item.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PLANES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section id="planes" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Planes para tu firma
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Crecimiento',
                price: '$9.99',
                period: '/mes',
                features: ['Hasta 5 abogados', '50 casos activos', 'CRM básico', 'Soporte por email']
              },
              {
                name: 'Consolidación',
                price: '$24.99',
                period: '/mes',
                featured: true,
                features: ['Hasta 20 abogados', 'Casos ilimitados', 'CRM avanzado', 'Facturación completa', 'Soporte 24/7', 'API acceso']
              }
            ].map((plan, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-lg p-8 ${
                  plan.featured
                    ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-2 border-blue-500 relative'
                    : 'bg-gray-800/50 border border-white/10'
                }`}
              >
                {plan.featured && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Más Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleFirmRegistration}
                  className={`w-full ${
                    plan.featured
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                >
                  Comenzar
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CANALES COMERCIALES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Canales Comerciales',
                description: 'Integra Punto Cero en tu estrategia comercial',
                cta: 'Conocer Más',
                href: '/partner'
              },
              {
                title: 'Partners Tecnológicos',
                description: 'Conéctate con integraciones y extensiones',
                cta: 'Ver Marketplace',
                href: '/partners'
              },
              {
                title: 'Afiliados',
                description: 'Gana comisión refiriendo Punto Cero',
                cta: 'Programa de Afiliados',
                href: '/affiliates'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gray-800/50 rounded-lg p-8 border border-white/10 text-center"
              >
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 mb-6">{item.description}</p>
                <Link
                  to={item.href}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-2"
                >
                  {item.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CTA FINAL */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-6"
          >
            ¿Listo para transformar tu firma?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8"
          >
            Únete a cientos de firmas jurídicas que ya confían en Punto Cero
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={handleFirmRegistration}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all"
          >
            Registra tu Firma Ahora
            <ArrowRight className="w-5 h-5 ml-2 inline" />
          </motion.button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="#" className="hover:text-white">Características</Link></li>
                <li><Link to="#" className="hover:text-white">Precios</Link></li>
                <li><Link to="#" className="hover:text-white">Seguridad</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Recursos</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/docs" className="hover:text-white">Documentación</Link></li>
                <li><Link to="/help" className="hover:text-white">Centro de Ayuda</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacidad</Link></li>
                <li><Link to="/terms" className="hover:text-white">Términos</Link></li>
                <li><Link to="/cookies" className="hover:text-white">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="mailto:support@puntocerolegal.com" className="hover:text-white">Soporte</a></li>
                <li><a href="tel:+573028322083" className="hover:text-white">WhatsApp</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Punto Cero Legal. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODALES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <FirmRegistrationModal
        open={showFirmRegistration}
        onClose={() => setShowFirmRegistration(false)}
        onSuccess={(firmData) => {
          trackEvent('firm_registered', { firm_id: firmData.id });
          navigate('/login', {
            state: {
              message: `Firma "${firmData.name}" registrada exitosamente. Revisa tu correo para instrucciones.`,
              firmId: firmData.id
            }
          });
        }}
      />
    </div>
  );
}

export default LandingPageV2;
