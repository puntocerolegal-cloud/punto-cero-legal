import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Scale, Lock, CreditCard, Globe, CheckCircle, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const planId = searchParams.get('plan') || 'profesional';
  const billingCycle = searchParams.get('cycle') || 'monthly';
  const referralCode = searchParams.get('ref');

  const [plans, setPlans] = useState([]);
  const [country, setCountry] = useState(user?.country || 'Colombia');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, [country, billingCycle]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/payment/plans`, { params: { country, billing_cycle: billingCycle } });
      setPlans(res.data.plans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === planId);
  const isMP = ['Colombia', 'México', 'Argentina', 'Brasil', 'Chile', 'Perú', 'Uruguay'].includes(country);

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setProcessing(true);
    try {
      const res = await axios.post(`${API}/payment/init`, {
        plan_id: planId,
        billing_cycle: billingCycle,
        country,
        user_email: user.email,
        user_name: user.full_name,
        referral_code: referralCode
      });
      // Redirección al gateway
      window.location.href = res.data.checkout_url;
      // Simulación: tras 3s confirmamos el pago
      setTimeout(async () => {
        await axios.post(`${API}/payment/confirm/${res.data.payment_id}`);
        navigate('/dashboard?payment=success');
      }, 3000);
    } catch (e) {
      alert('Error al procesar pago: ' + (e.response?.data?.detail || e.message));
      setProcessing(false);
    }
  };

  const fmt = (amount, curr) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: curr || 'COP', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] py-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f97316]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10b981]/20 rounded-full blur-3xl" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <Scale className="w-12 h-12 text-[#f97316] mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Completar Suscripción</h1>
          <p className="text-white/60 mt-2">Activa tu plan {planId} ahora</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Summary */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><Shield className="w-5 h-5 text-[#10b981]" /> Resumen del Pedido</h2>
            
            {loading || !selectedPlan ? (
              <div className="flex items-center gap-2 text-white/60"><Loader2 className="w-5 h-5 animate-spin" /> Calculando precio...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#f97316] font-semibold">{selectedPlan.name}</div>
                    <div className="text-xs text-white/40 mt-1">{selectedPlan.processes === -1 ? 'Procesos ilimitados' : `${selectedPlan.processes} procesos`}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{fmt(selectedPlan.price_local, selectedPlan.currency)}</div>
                    <div className="text-xs text-white/40">{billingCycle === 'annual' ? 'Anual' : 'Mensual'}</div>
                  </div>
                </div>

                {billingCycle === 'annual' && (
                  <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
                    <div className="text-sm font-semibold text-[#10b981] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> ¡Estás ahorrando 1 mes completo!
                    </div>
                    <div className="text-xs text-white/60 mt-1">Equivale a {fmt(selectedPlan.monthly_equivalent, selectedPlan.currency)}/mes</div>
                  </div>
                )}

                {referralCode && (
                  <div className="p-3 rounded-xl bg-[#f97316]/10 border border-[#f97316]/30">
                    <div className="text-sm font-semibold text-[#f97316]">🎁 Código de referido aplicado</div>
                    <div className="text-xs text-white/60 mt-1">{referralCode} · Tu referente recibirá 1 mes gratis</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-white/60 mb-2 uppercase tracking-wider">País</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                    {['Colombia', 'México', 'Argentina', 'Brasil', 'Chile', 'Perú', 'Uruguay', 'Estados Unidos', 'España', 'Venezuela', 'Ecuador', 'Bolivia', 'Paraguay', 'Costa Rica', 'Panamá', 'República Dominicana', 'Guatemala', 'El Salvador'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-lg font-bold text-white">TOTAL</span>
                  <span className="text-2xl font-bold text-[#10b981]">{fmt(selectedPlan.price_local, selectedPlan.currency)}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Payment Gateway */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><Lock className="w-5 h-5 text-[#f97316]" /> Método de Pago Seguro</h2>

            <div className={`p-5 rounded-2xl border-2 mb-4 ${isMP ? 'bg-[#009ee3]/10 border-[#009ee3]/40' : 'bg-[#003087]/10 border-[#003087]/40'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: isMP ? '#009ee3' : '#003087' }}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white">{isMP ? 'Mercado Pago' : 'PayPal'}</div>
                  <div className="text-xs text-white/60">{isMP ? 'Tarjeta, débito, PSE, transferencia' : 'Tarjeta, débito, balance PayPal'}</div>
                </div>
              </div>
              <div className="text-xs text-white/60 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Detectado para {country} · Router automático
              </div>
            </div>

            <div className="space-y-2 text-xs text-white/60 mb-6">
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#10b981]" /> Cifrado SSL 256-bit</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#10b981]" /> Sin permanencia · cancela cuando quieras</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#10b981]" /> Activación inmediata tras el pago</div>
            </div>

            <Button onClick={handleCheckout} disabled={processing || !selectedPlan} className={`w-full font-bold py-6 ${isMP ? 'bg-gradient-to-r from-[#009ee3] to-[#0084c1]' : 'bg-gradient-to-r from-[#003087] to-[#0070ba]'} text-white hover:shadow-[0_10px_30px_rgba(59,130,246,0.4)]`} data-testid="checkout-pay">
              {processing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>) : (<>Pagar con {isMP ? 'Mercado Pago' : 'PayPal'} <ArrowRight className="ml-2 w-4 h-4" /></>)}
            </Button>

            <button onClick={() => navigate('/dashboard')} className="w-full mt-3 text-xs text-white/40 hover:text-white/60 underline">Activar prueba gratis sin pagar (7 días)</button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
