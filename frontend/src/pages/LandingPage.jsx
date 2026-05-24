import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Users, Award, CheckCircle, ArrowRight, Scale, FileText, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { mockTeamData, mockStats } from '../mock/data';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1a2332] to-[#0f1b2d]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0a1128]/70 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Scale className="w-8 h-8 text-[#ffd700]" />
              <span className="text-2xl font-bold text-white">Punto Cero Legal</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6"
            >
              <a href="#servicios" className="text-white/80 hover:text-[#ffd700] transition-colors">Servicios</a>
              <a href="#seguridad" className="text-white/80 hover:text-[#ffd700] transition-colors">Seguridad</a>
              <a href="#equipo" className="text-white/80 hover:text-[#ffd700] transition-colors">Equipo</a>
              <Button variant="outline" className="border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-[#0a1128] transition-all">
                Iniciar Sesión
              </Button>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-[#ffd700] to-white bg-clip-text text-transparent">
                  Justicia Digital
                </span>
                <br />
                <span className="text-white">A Tu Alcance</span>
              </h1>
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                Transformamos la experiencia legal con tecnología de vanguardia. 
                Gestiona tus casos, conecta con expertos y mantén el control total de tus asuntos legales.
              </p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#ffd700] to-[#ffed4e] text-[#0a1128] font-semibold hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300 group"
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  Ver Demo
                </Button>
              </div>
              <div className="flex gap-8 mt-12">
                <div>
                  <div className="text-3xl font-bold text-[#ffd700]">{mockStats.cases}+</div>
                  <div className="text-white/60 text-sm">Casos Resueltos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#ffd700]">{mockStats.clients}+</div>
                  <div className="text-white/60 text-sm">Clientes Satisfechos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#ffd700]">{mockStats.lawyers}+</div>
                  <div className="text-white/60 text-sm">Abogados Expertos</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold text-lg">Dashboard del Cliente</h3>
                    <span className="px-3 py-1 bg-[#ffd700]/20 text-[#ffd700] rounded-full text-sm font-medium">Activo</span>
                  </div>
                  
                  {/* Circular Progress */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="56" 
                          stroke="rgba(255,255,255,0.1)" 
                          strokeWidth="8" 
                          fill="none"
                        />
                        <circle 
                          cx="64" 
                          cy="64" 
                          r="56" 
                          stroke="#ffd700" 
                          strokeWidth="8" 
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.68)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-white">68%</span>
                        <span className="text-xs text-white/60">Progreso</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">Caso en Proceso</h4>
                      <p className="text-white/60 text-sm mb-3">Divorcio Express</p>
                      <div className="flex items-center gap-2 text-[#ffd700] text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>En buen camino</span>
                      </div>
                    </div>
                  </div>

                  {/* Lawyer Assignment Notification */}
                  <div className="backdrop-blur-md bg-gradient-to-r from-[#ffd700]/20 to-transparent p-4 rounded-xl border border-[#ffd700]/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ffed4e] flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-[#0a1128]" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm mb-1">Abogado Asignado</p>
                        <p className="text-white/70 text-sm">Dra. María González</p>
                        <p className="text-[#ffd700] text-xs mt-1">Especialista en Derecho Familiar</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <FileText className="w-6 h-6 text-[#ffd700] mx-auto mb-2" />
                      <div className="text-white font-semibold">12</div>
                      <div className="text-white/50 text-xs">Documentos</div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-[#ffd700] mx-auto mb-2" />
                      <div className="text-white font-semibold">3 días</div>
                      <div className="text-white/50 text-xs">Próxima cita</div>
                    </div>
                    <div className="text-center">
                      <Award className="w-6 h-6 text-[#ffd700] mx-auto mb-2" />
                      <div className="text-white font-semibold">98%</div>
                      <div className="text-white/50 text-xs">Confianza</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/20 to-transparent blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section id="seguridad" className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ffd700]/5 to-transparent"></div>
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-4">
              Tu Seguridad es <span className="text-[#ffd700]">Nuestra Prioridad</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Protegemos tu información con los más altos estándares de seguridad de la industria
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: 'Cifrado de Grado Bancario',
                description: 'Tus datos están protegidos con cifrado AES-256, el mismo estándar usado por instituciones financieras.'
              },
              {
                icon: Shield,
                title: 'Cumplimiento GDPR',
                description: 'Cumplimos con todas las regulaciones de protección de datos y privacidad internacionales.'
              },
              {
                icon: CheckCircle,
                title: 'Auditorías Continuas',
                description: 'Realizamos pruebas de seguridad y auditorías constantes para garantizar la máxima protección.'
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffd700]/20 to-transparent flex items-center justify-center mb-6 border border-[#ffd700]/30">
                    <item.icon className="w-8 h-8 text-[#ffd700]" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-white/60 leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="equipo" className="py-20 px-6">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-white mb-4">
              Conoce a <span className="text-[#ffd700]">Nuestros Expertos</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Detrás de nuestra tecnología hay abogados reales, empáticos y altamente capacitados
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {mockTeamData.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                  <div className="relative h-64 bg-gradient-to-br from-[#ffd700]/20 to-[#0a1128] flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#ffd700] to-[#ffed4e] flex items-center justify-center text-4xl font-bold text-[#0a1128]">
                      {member.initials}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-white text-xl font-semibold mb-2">{member.name}</h3>
                    <p className="text-[#ffd700] text-sm mb-3">{member.specialty}</p>
                    <p className="text-white/60 text-sm mb-4">{member.bio}</p>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Award className="w-4 h-4" />
                      <span>{member.experience} años de experiencia</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
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
            className="backdrop-blur-xl bg-gradient-to-r from-[#ffd700]/10 to-transparent border border-[#ffd700]/30 rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ffd700]/5 to-transparent"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                ¿Listo para Transformar tu Experiencia Legal?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Únete a miles de clientes que ya confían en nuestra plataforma
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#ffd700] to-[#ffed4e] text-[#0a1128] font-semibold hover:shadow-[0_0_40px_rgba(255,215,0,0.6)] transition-all duration-300 text-lg px-8 py-6"
              >
                Comenzar Prueba Gratuita
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur-md bg-[#0a1128]/70 py-12 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-[#ffd700]" />
                <span className="text-xl font-bold text-white">Punto Cero Legal</span>
              </div>
              <p className="text-white/60 text-sm">
                Transformando la experiencia legal con tecnología de vanguardia.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Características</a></li>
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Precios</a></li>
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Equipo</a></li>
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Términos</a></li>
                <li><a href="#" className="hover:text-[#ffd700] transition-colors">Cookies</a></li>
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