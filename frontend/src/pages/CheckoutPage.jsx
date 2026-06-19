import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Scale, Lock, CreditCard, Globe, CheckCircle, ArrowRight, Loader2, Shield,
  Upload, FileText, Building2, Wallet, X, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { getErrorMessage } from '../lib/utils';

import { API } from '@/config/api';

// Países soportados (coinciden con COUNTRY_CONFIG del backend).
const SUPPORTED_COUNTRIES = [
  'Colombia', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Bolivia', 'Venezuela',
  'Paraguay', 'Uruguay', 'México', 'Guatemala', 'Honduras', 'El Salvador',
  'Nicaragua', 'Costa Rica', 'Panamá', 'Cuba', 'República Dominicana',
  'Puerto Rico', 'España',
];

const MAX_RECEIPT_MB = 10;

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const planId = searchParams.get('plan') || 'profesional';
  const referralCode = searchParams.get('ref');

  const [country, setCountry] = useState(
    SUPPORTED_COUNTRIES.includes(user?.country) ? user.country : 'Colombia'
  );
  const [cycle, setCycle] = useState(searchParams.get('cycle') === 'annual' ? 'annual' : 'monthly');
  const [catalog, setCatalog] = useState([]);
  const [locale, setLocale] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Estado del comprobante (métodos manuales)
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const [receiptSent, setReceiptSent] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, methodsRes] = await Promise.all([
        axios.get(`${API}/payment/catalog`, { params: { country } }),
        axios.get(`${API}/payment/methods`, { params: { country } }),
      ]);
      setCatalog(catRes.data.plans || []);
      setLocale(catRes.data.locale || null);
      setMethods(methodsRes.data.methods || []);
      setSelectedMethodId((prev) => {
        const exists = (methodsRes.data.methods || []).some((m) => m.id === prev);
        return exists ? prev : (methodsRes.data.methods?.[0]?.id || null);
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedPlan = catalog.find((p) => p.id === planId);
  const selectedMethod = methods.find((m) => m.id === selectedMethodId);
  const isManual = selectedMethod?.type === 'manual';

  const cyclePrice = selectedPlan
    ? (cycle === 'annual' ? selectedPlan.annual.display : selectedPlan.monthly.display)
    : '';

  // ───────── Pago con gateway (Mercado Pago / PayPal) ─────────
  const handleGatewayCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setProcessing(true);
    try {
      const res = await axios.post(`${API}/payment/init`, {
        plan_id: planId,
        billing_cycle: cycle,
        country,
        user_email: user.email,
        user_name: user.full_name,
        referral_code: referralCode,
      });
      // Redirige a Mercado Pago. La confirmación llega por el WEBHOOK real de MP
      // + back_urls (ya no se simula con setTimeout/confirm).
      window.location.href = res.data.checkout_url;
    } catch (e) {
      alert('Error al procesar pago: ' + getErrorMessage(e, e.message));
      setProcessing(false);
    }
  };

  // ───────── Comprobante de pago manual ─────────
  const onPickFile = (e) => {
    setReceiptError('');
    const f = e.target.files?.[0];
    if (!f) return;
    const okType = /^image\/(png|jpe?g|webp)$/.test(f.type) || f.type === 'application/pdf';
    if (!okType) {
      setReceiptError('Formato no válido. Sube una imagen (PNG/JPG/WEBP) o un PDF.');
      return;
    }
    if (f.size > MAX_RECEIPT_MB * 1024 * 1024) {
      setReceiptError(`El archivo supera el límite de ${MAX_RECEIPT_MB} MB.`);
      return;
    }
    setReceiptFile(f);
  };

  const handleSubmitReceipt = async () => {
    if (!receiptFile) { setReceiptError('Adjunta tu comprobante de pago.'); return; }
    setProcessing(true);
    setReceiptError('');
    try {
      const fd = new FormData();
      fd.append('plan_id', planId);
      fd.append('billing_cycle', cycle);
      fd.append('method', selectedMethod.name);
      fd.append('country', country);
      fd.append('amount', cyclePrice);
      fd.append('file', receiptFile);
      await axios.post(`${API}/payment/receipt`, fd);
      setReceiptSent(true);
    } catch (e) {
      setReceiptError(getErrorMessage(e, 'No se pudo enviar el comprobante.'));
    } finally {
      setProcessing(false);
    }
  };

  const methodIcon = (m) => {
    if (m.type === 'gateway') return CreditCard;
    if (/transfer|sepa|cbu|spei|bank/i.test(m.id)) return Building2;
    return Wallet;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] py-12 px-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f97316]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10b981]/20 rounded-full blur-3xl" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <Scale className="w-12 h-12 text-[#f97316] mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-white">Completar Suscripción</h1>
          <p className="text-white/60 mt-2">
            Activa tu plan <span className="text-[#f97316] font-semibold">{selectedPlan?.name || planId}</span> ahora
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ───────── Resumen del pedido ───────── */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><Shield className="w-5 h-5 text-[#10b981]" /> Resumen del Pedido</h2>

            {loading || !selectedPlan ? (
              <div className="flex items-center gap-2 text-white/60"><Loader2 className="w-5 h-5 animate-spin" /> Calculando precio...</div>
            ) : (
              <div className="space-y-4">
                {/* Toggle Mensual / Anual */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/5 border border-white/10" data-testid="cycle-toggle">
                  <button
                    onClick={() => setCycle('monthly')}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${cycle === 'monthly' ? 'bg-[#f97316] text-white' : 'text-white/60 hover:text-white'}`}
                    data-testid="cycle-monthly"
                  >
                    Mensual
                  </button>
                  <button
                    onClick={() => setCycle('annual')}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all relative ${cycle === 'annual' ? 'bg-[#10b981] text-white' : 'text-white/60 hover:text-white'}`}
                    data-testid="cycle-annual"
                  >
                    Anual
                    <span className="absolute -top-2 -right-1 text-[9px] bg-[#10b981] text-white px-1.5 py-0.5 rounded-full font-bold">1 mes gratis</span>
                  </button>
                </div>

                {/* Precio principal */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#f97316] font-semibold">{selectedPlan.name}</div>
                    <div className="text-xs text-white/40 mt-1">{selectedPlan.flag} {selectedPlan.processes}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" data-testid="cycle-price">{cyclePrice}</div>
                    <div className="text-xs text-white/40">{cycle === 'annual' ? 'por año' : 'por mes'}</div>
                  </div>
                </div>

                {/* Comparativa de ambos precios */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 border ${cycle === 'monthly' ? 'border-[#f97316]/50 bg-[#f97316]/10' : 'border-white/10 bg-white/5'}`}>
                    <div className="text-[10px] uppercase tracking-wider text-white/50">Mensual</div>
                    <div className="font-bold mt-0.5">{selectedPlan.monthly.display}</div>
                    <div className="text-[10px] text-white/40">/mes</div>
                  </div>
                  <div className={`rounded-xl p-3 border ${cycle === 'annual' ? 'border-[#10b981]/50 bg-[#10b981]/10' : 'border-white/10 bg-white/5'}`}>
                    <div className="text-[10px] uppercase tracking-wider text-white/50">Anual</div>
                    <div className="font-bold mt-0.5">{selectedPlan.annual.display}</div>
                    <div className="text-[10px] text-white/40">≈ {selectedPlan.annual.monthly_equivalent_display}/mes</div>
                  </div>
                </div>

                {cycle === 'annual' && (
                  <div className="p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30">
                    <div className="text-sm font-semibold text-[#10b981] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> ¡Ahorras {selectedPlan.annual.savings_display} (1 mes gratis)!
                    </div>
                    <div className="text-xs text-white/60 mt-1">Pagas 11 meses y obtienes 12.</div>
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
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" data-testid="checkout-country">
                    {SUPPORTED_COUNTRIES.map((c) => <option key={c} className="bg-[#0f172a]">{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-lg font-bold text-white">TOTAL</span>
                  <span className="text-2xl font-bold text-[#10b981]" data-testid="checkout-total">{cyclePrice}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* ───────── Métodos de pago ───────── */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><Lock className="w-5 h-5 text-[#f97316]" /> Método de Pago</h2>

            <div className="text-xs text-white/50 flex items-center gap-1 mb-3">
              <Globe className="w-3 h-3" /> Opciones para {locale?.flag} {country}
            </div>

            {/* Lista de métodos */}
            <div className="space-y-2 mb-5" data-testid="payment-methods">
              {methods.map((m) => {
                const Icon = methodIcon(m);
                const active = m.id === selectedMethodId;
                const color = m.color || '#64748b';
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMethodId(m.id); setReceiptSent(false); setReceiptFile(null); setReceiptError(''); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${active ? 'bg-white/10' : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'}`}
                    style={active ? { borderColor: color } : {}}
                    data-testid={`method-${m.id}`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {m.name}
                        {m.type === 'gateway' && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">Recomendado</span>}
                      </div>
                      <div className="text-xs text-white/50 truncate">{m.description}</div>
                    </div>
                    {active && <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color }} />}
                  </button>
                );
              })}
            </div>

            {/* Acción según el método */}
            {selectedMethod && !isManual && (
              <>
                <Button
                  onClick={handleGatewayCheckout}
                  disabled={processing || !selectedPlan}
                  className="w-full font-bold py-6 text-white"
                  style={{ background: `linear-gradient(135deg, ${selectedMethod.color}, ${selectedMethod.color}cc)` }}
                  data-testid="checkout-pay"
                >
                  {processing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>) : (<>Pagar {cyclePrice} con {selectedMethod.name} <ArrowRight className="ml-2 w-4 h-4" /></>)}
                </Button>
                <div className="space-y-2 text-xs text-white/50 mt-4">
                  <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#10b981]" /> Cifrado SSL 256-bit</div>
                  <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-[#10b981]" /> Activación inmediata tras el pago</div>
                </div>
              </>
            )}

            {/* Flujo manual: subir comprobante */}
            {selectedMethod && isManual && (
              <AnimatePresence mode="wait">
                {receiptSent ? (
                  <motion.div key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-[#10b981]/10 border border-[#10b981]/40 p-5 text-center" data-testid="receipt-success">
                    <BadgeCheck className="w-10 h-10 text-[#10b981] mx-auto mb-2" />
                    <div className="font-bold text-white">¡Comprobante enviado!</div>
                    <p className="text-sm text-white/60 mt-1">Nuestro equipo verificará tu pago y activará tu plan en breve. Te notificaremos por correo.</p>
                    <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-white/10 hover:bg-white/20 text-white">Ir a mi panel</Button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-3">
                      <div className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#f97316]" /> Pago por {selectedMethod.name}
                      </div>
                      <p className="text-xs text-white/60">
                        Realiza el pago de <strong className="text-white">{cyclePrice}</strong> mediante {selectedMethod.name} y adjunta aquí tu comprobante (imagen o PDF). Lo verificaremos manualmente.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={onPickFile}
                      className="hidden"
                      data-testid="receipt-input"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-white/20 hover:border-[#f97316]/50 rounded-2xl p-6 text-center transition-all"
                      data-testid="receipt-pick"
                    >
                      {receiptFile ? (
                        <div className="flex items-center justify-center gap-2 text-white">
                          <FileText className="w-5 h-5 text-[#10b981]" />
                          <span className="text-sm truncate max-w-[200px]">{receiptFile.name}</span>
                          <span className="text-xs text-white/40">({(receiptFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ) : (
                        <div className="text-white/50">
                          <Upload className="w-7 h-7 mx-auto mb-2 text-[#f97316]" />
                          <div className="text-sm font-semibold text-white/80">Adjuntar comprobante / recibo</div>
                          <div className="text-xs mt-1">Imagen (PNG/JPG/WEBP) o PDF · máx {MAX_RECEIPT_MB} MB</div>
                        </div>
                      )}
                    </button>

                    {receiptError && (
                      <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-3" data-testid="receipt-error">{receiptError}</div>
                    )}

                    <Button
                      onClick={handleSubmitReceipt}
                      disabled={processing || !receiptFile}
                      className="w-full font-bold py-6 mt-3 bg-gradient-to-r from-[#f97316] to-[#fb923c] text-white disabled:opacity-50"
                      data-testid="receipt-submit"
                    >
                      {processing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>) : (<>Enviar comprobante <ArrowRight className="ml-2 w-4 h-4" /></>)}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            <button onClick={() => navigate('/dashboard')} className="w-full mt-3 text-xs text-white/40 hover:text-white/60 underline">
              Continuar con mi prueba gratis (7 días)
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
