import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Bell, Building2, CreditCard, Plug, Save, Eye, EyeOff, Check, Award, Sparkles, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'security', label: 'Seguridad', icon: Lock },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'firm', label: 'Despacho', icon: Building2 },
  { id: 'subscription', label: 'Suscripción', icon: CreditCard },
  { id: 'ai', label: 'Potencia tu IA', icon: Sparkles },
  { id: 'integrations', label: 'Integraciones', icon: Plug },
];

// IAs premium externas sugeridas
const AI_UPGRADES = [
  { name: 'ChatGPT Plus', url: 'https://chat.openai.com/plus', color: '#10a37f', desc: 'GPT-4o: respuestas más rápidas, razonamiento avanzado y análisis de documentos extensos.' },
  { name: 'Claude Pro', url: 'https://claude.ai/upgrade', color: '#d97757', desc: 'Claude: ideal para redacción jurídica larga, contexto amplio y mayor precisión en matices legales.' },
  { name: 'Gemini Advanced', url: 'https://one.google.com/about/plans', color: '#4285f4', desc: 'Gemini 1.5 Pro: contexto enorme, integración con Google Workspace y multimodalidad.' },
];

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'Colombia',
    specialty: user?.specialty || '',
    bar_number: user?.bar_number || '',
  });
  const [notifications, setNotifications] = useState({
    email_cases: true,
    email_meetings: true,
    email_invoices: false,
    push_deadlines: true,
    push_messages: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-white/60">Personaliza tu experiencia en Punto Cero Legal</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Tabs Sidebar */}
          <div className="space-y-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === t.id ? 'bg-gradient-to-r from-[#f97316]/20 to-[#3b82f6]/20 border border-[#f97316]/30' : 'hover:bg-white/5'}`} data-testid={`tab-${t.id}`}>
                <t.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              {activeTab === 'profile' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Información Personal</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ec4899] flex items-center justify-center text-2xl font-bold">
                      {profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <Button variant="outline" className="border-white/20 text-white">Cambiar foto</Button>
                      <p className="text-xs text-white/40 mt-1">JPG, PNG. Max 2MB.</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Nombre Completo</label>
                      <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Email</label>
                      <Input type="email" value={profile.email} className="bg-white/10 border-white/20 text-white" disabled />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Teléfono</label>
                      <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Tarjeta Profesional</label>
                      <Input value={profile.bar_number} onChange={(e) => setProfile({ ...profile, bar_number: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Especialidad</label>
                      <Input value={profile.specialty} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">País</label>
                      <Input value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">
                    {saved ? <><Check className="w-4 h-4 mr-2" /> Guardado</> : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
                  </Button>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Seguridad</h2>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Contraseña Actual</label>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} className="bg-white/10 border-white/20 text-white pr-10" />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showPassword ? <EyeOff className="w-4 h-4 text-white/60" /> : <Eye className="w-4 h-4 text-white/60" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nueva Contraseña</label>
                    <Input type="password" className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Confirmar Contraseña</label>
                    <Input type="password" className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Actualizar Contraseña</Button>
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="font-semibold mb-2">Autenticación de dos factores (2FA)</h3>
                    <p className="text-sm text-white/60 mb-4">Añade una capa extra de seguridad a tu cuenta</p>
                    <Button variant="outline" className="border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/10">Activar 2FA</Button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Notificaciones</h2>
                  {Object.entries({
                    email_cases: 'Nuevos casos por email',
                    email_meetings: 'Recordatorios de reuniones',
                    email_invoices: 'Estados de facturación',
                    push_deadlines: 'Alertas de vencimientos',
                    push_messages: 'Nuevos mensajes'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <span className="text-sm">{label}</span>
                      <button onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })} className={`relative w-12 h-6 rounded-full transition-colors ${notifications[key] ? 'bg-[#10b981]' : 'bg-white/10'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications[key] ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'firm' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Datos del Despacho</h2>
                  <Input placeholder="Nombre del bufete" className="bg-white/10 border-white/20 text-white" />
                  <Input placeholder="NIT / RIF" className="bg-white/10 border-white/20 text-white" />
                  <Input placeholder="Dirección" className="bg-white/10 border-white/20 text-white" />
                  <Input placeholder="Sitio web" className="bg-white/10 border-white/20 text-white" />
                  <Textarea placeholder="Descripción del despacho" className="bg-white/10 border-white/20 text-white" />
                  <Button onClick={handleSave} className="bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white font-bold">Guardar</Button>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Plan y Suscripción</h2>
                  <div className="backdrop-blur-xl bg-gradient-to-r from-[#f97316]/20 to-[#fb923c]/20 rounded-2xl p-6 border border-[#f97316]/40">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-8 h-8 text-[#f97316]" />
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#f97316]">Plan Actual</div>
                        <div className="text-2xl font-bold">Profesional</div>
                      </div>
                    </div>
                    <p className="text-white/70 text-sm mb-4">Tu suscripción se renueva el 12 de enero de 2026</p>
                    <div className="text-3xl font-bold mb-1">$99.000 <span className="text-base font-normal text-white/60">/mes</span></div>
                    <div className="text-sm text-[#10b981] mt-2">✓ 7 días gratis activos</div>
                  </div>
                  <Button className="bg-gradient-to-r from-[#10b981] to-[#059669] text-white">Cambiar Plan</Button>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">Potencia tu IA <Sparkles className="w-5 h-5 text-[#4285f4]" /></h2>
                    <p className="text-sm text-white/60 mt-1">
                      Tu asistente usa <strong>Gemini Flash gratis</strong>, incluido en todos los planes. Si necesitas más velocidad,
                      contexto o precisión para casos complejos, puedes complementarlo con una IA premium externa:
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {AI_UPGRADES.map(ai => (
                      <div key={ai.name} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex-1">
                          <div className="font-semibold" style={{ color: ai.color }}>{ai.name}</div>
                          <div className="text-xs text-white/60 mt-0.5">{ai.desc}</div>
                        </div>
                        <a href={ai.url} target="_blank" rel="noopener noreferrer" data-testid={`settings-upgrade-${ai.name.replace(/\s+/g, '-').toLowerCase()}`}>
                          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 whitespace-nowrap">
                            Ver plan <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/40">Punto Cero Legal no gestiona estas suscripciones; son servicios independientes de terceros.</p>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold">Integraciones</h2>
                  {[
                    { name: 'Google Calendar', desc: 'Sincroniza tu agenda', connected: false },
                    { name: 'Outlook Calendar', desc: 'Sincroniza eventos de Outlook', connected: false },
                    { name: 'WhatsApp Business', desc: 'Mensajería con clientes', connected: true },
                    { name: 'Stripe', desc: 'Procesamiento de pagos', connected: true },
                  ].map((int, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <div className="font-semibold">{int.name}</div>
                        <div className="text-xs text-white/60">{int.desc}</div>
                      </div>
                      <Button variant={int.connected ? 'outline' : 'default'} className={int.connected ? 'border-[#10b981]/40 text-[#10b981]' : 'bg-gradient-to-r from-[#f97316] to-[#fb923c]'}>
                        {int.connected ? <><Check className="w-3 h-3 mr-1" /> Conectado</> : 'Conectar'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
