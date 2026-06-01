import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, ArrowRight, AlertCircle, Gift, Tag } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const planFromUrl = searchParams.get('plan');
  const cycleFromUrl = searchParams.get('cycle');
  const refFromUrl = searchParams.get('ref');

  const [referralValid, setReferralValid] = useState(null);
  const [referrerName, setReferrerName] = useState('');
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', phone: '',
    country: 'Colombia', specialty: 'Derecho Civil', bar_number: '', role: 'lawyer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (refFromUrl) {
      axios.get(`${API}/referrals/validate/${refFromUrl}`).then(res => {
        setReferralValid(res.data.valid);
        if (res.data.valid) setReferrerName(res.data.referrer_name);
      }).catch(() => setReferralValid(false));
    }
  }, [refFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      if (planFromUrl) {
        navigate(`/checkout?plan=${planFromUrl}&cycle=${cycleFromUrl || 'monthly'}${refFromUrl ? `&ref=${refFromUrl}` : ''}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3b82f6]/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#10b981]/30 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Scale className="w-10 h-10 text-[#f97316]" />
          <span className="text-3xl font-bold text-white">Punto Cero Legal</span>
        </Link>

        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">Únete a la red más grande de LATAM</h1>
          <p className="text-white/60 mb-6">Comienza tu prueba gratuita de 7 días</p>

          {planFromUrl && (
            <div className="mb-4 p-3 rounded-xl bg-[#f97316]/10 border border-[#f97316]/30 flex items-center gap-2 text-[#f97316]">
              <Tag className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Plan seleccionado: <strong className="capitalize">{planFromUrl}</strong> · {cycleFromUrl === 'annual' ? 'Anual (1 mes gratis)' : 'Mensual'}</span>
            </div>
          )}

          {refFromUrl && referralValid && (
            <div className="mb-4 p-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center gap-2 text-[#10b981]">
              <Gift className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Llegaste por referido de <strong>{referrerName}</strong>. Él recibirá 1 mes gratis cuando completes tu pago.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Nombre Completo</label>
                <Input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="Dr. Juan Pérez" required data-testid="register-name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Correo</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="abogado@ejemplo.com" required data-testid="register-email" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Teléfono</label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="+57 300 123 4567" required data-testid="register-phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">País</label>
                <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" data-testid="register-country">
                  <option>Colombia</option><option>Venezuela</option><option>México</option>
                  <option>Argentina</option><option>Chile</option><option>Perú</option>
                  <option>Ecuador</option><option>España</option><option>Estados Unidos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Especialidad</label>
                <select value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white" data-testid="register-specialty">
                  <option>Derecho Civil</option><option>Derecho Penal</option><option>Derecho Laboral</option>
                  <option>Derecho Comercial</option><option>Derecho de Familia</option><option>Derecho Migratorio</option>
                  <option>Derecho Tributario</option><option>Derecho Corporativo</option><option>Propiedad Intelectual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-2">Tarjeta Profesional</label>
                <Input type="text" value={formData.bar_number} onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="TP-123456" data-testid="register-bar" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Contraseña</label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="bg-white/10 border-white/20 text-white" placeholder="Mínimo 8 caracteres" minLength={8} required data-testid="register-password" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#f97316] to-[#fb923c] hover:shadow-[0_10px_30px_rgba(249,115,22,0.3)] text-white font-bold py-6" data-testid="register-submit">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta Gratis'}
              {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </form>

          <p className="text-center text-white/60 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#f97316] hover:underline font-semibold">Inicia sesión</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
