import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
  Building2, Users, Palette, Flag, CheckCircle2
} from 'lucide-react';
import { API } from '@/config/api';

const STEPS = [
  { id: 1, title: 'Datos de la Firma', icon: Building2 },
  { id: 2, title: 'Áreas de Práctica', icon: Flag },
  { id: 3, title: 'Invitar Abogados', icon: Users },
  { id: 4, title: 'Marca Corporativa', icon: Palette },
  { id: 5, title: 'Finalización', icon: CheckCircle2 }
];

export default function OnboardingWizardFirm({ firmId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    description: '',
    website: '',
    address: '',
    // Step 2
    practice_areas: [],
    // Step 3
    invited_lawyers: [],
    // Step 4
    logo_url: '',
    brand_color: '#3b82f6',
    linkedin: '',
    whatsapp: ''
  });

  const [newPracticeArea, setNewPracticeArea] = useState('');
  const [newLawyerEmail, setNewLawyerEmail] = useState('');

  const practiceAreasOptions = [
    'Derecho Laboral',
    'Derecho Corporativo',
    'Derecho Penal',
    'Derecho Mercantil',
    'Derecho Familia',
    'Derecho Administrativo',
    'Propiedad Intelectual',
    'Derecho Ambiental',
    'Derecho Internacional',
    'Litigios'
  ];

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step) => {
    if (step === 1 && (!formData.description || !formData.website)) {
      setError('Por favor completa todos los campos requeridos');
      return false;
    }
    if (step === 2 && formData.practice_areas.length === 0) {
      setError('Selecciona al menos un área de práctica');
      return false;
    }
    setError('');
    return true;
  };

  const addPracticeArea = (area) => {
    if (!formData.practice_areas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        practice_areas: [...prev.practice_areas, area]
      }));
    }
  };

  const removePracticeArea = (area) => {
    setFormData(prev => ({
      ...prev,
      practice_areas: prev.practice_areas.filter(a => a !== area)
    }));
  };

  const addLawyerInvite = () => {
    if (newLawyerEmail && !formData.invited_lawyers.includes(newLawyerEmail)) {
      setFormData(prev => ({
        ...prev,
        invited_lawyers: [...prev.invited_lawyers, newLawyerEmail]
      }));
      setNewLawyerEmail('');
    }
  };

  const removeLawyerInvite = (email) => {
    setFormData(prev => ({
      ...prev,
      invited_lawyers: prev.invited_lawyers.filter(e => e !== email)
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const actualFirmId = firmId || user.firm_id;

      if (!actualFirmId) {
        setError('No se encontró firma asociada');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('pcl_token') || localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Completar onboarding con datos de configuración
      const response = await axios.post(`${API}/firm-os/firms/${actualFirmId}/onboarding-complete`, {
        ...formData,
        invited_lawyers: formData.invited_lawyers || [],
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      }, { headers });

      setSuccess(true);
      setTimeout(() => {
        onComplete?.();
        // Redirigir al dashboard después de completar
        window.location.href = '/firm-os';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al completar onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f172a] to-[#0a0e1a] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Bienvenido a Firm OS
          </h1>
          <p className="text-white/70 text-lg">
            Configura tu firma en 5 sencillos pasos
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-8">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStep - 1;
              const isCurrent = idx === currentStep - 1;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      borderColor: isCurrent ? '#3b82f6' : isCompleted ? '#10b981' : '#ffffff22'
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted ? 'bg-[#10b981]/20' :
                      isCurrent ? 'bg-[#3b82f6]/20' :
                      'bg-white/[0.03]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6 text-[#10b981]" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isCurrent ? 'text-[#3b82f6]' : 'text-white/50'}`} />
                    )}
                  </motion.div>

                  {idx < STEPS.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${
                      isCompleted ? 'bg-[#10b981]' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center text-white/60 text-sm">
            Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-3xl p-8 mb-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700/50 flex gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="w-16 h-16 text-[#10b981] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">¡Configuración Completada!</h3>
              <p className="text-white/70">Tu firma está lista para usar Firm OS</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!success && (
              <>
                {/* Step 1: Datos de la Firma */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-white">Datos de la Firma</h2>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">Descripción de la firma *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                        placeholder="Cuéntanos sobre tu firma..."
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Website *</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                          placeholder="https://tufiima.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/70 mb-2">Dirección</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                          placeholder="Calle Principal 123"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Áreas de Práctica */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-white">Áreas de Práctica</h2>

                    <div>
                      <label className="block text-sm text-white/70 mb-3">Selecciona tus áreas de práctica *</label>
                      <div className="grid md:grid-cols-2 gap-3">
                        {practiceAreasOptions.map(area => (
                          <motion.button
                            key={area}
                            onClick={() => formData.practice_areas.includes(area) ? removePracticeArea(area) : addPracticeArea(area)}
                            className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                              formData.practice_areas.includes(area)
                                ? 'border-[#3b82f6] bg-[#3b82f6]/20 text-white'
                                : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30'
                            }`}
                          >
                            {formData.practice_areas.includes(area) && <Check className="w-4 h-4 float-right mt-0.5" />}
                            {area}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Invitar Abogados */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-white">Invitar Abogados</h2>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">Email del abogado</label>
                      <div className="flex gap-3">
                        <input
                          type="email"
                          value={newLawyerEmail}
                          onChange={(e) => setNewLawyerEmail(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                          placeholder="abogado@firma.com"
                          onKeyPress={(e) => e.key === 'Enter' && addLawyerInvite()}
                        />
                        <button
                          onClick={addLawyerInvite}
                          className="px-6 py-3 rounded-xl bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {formData.invited_lawyers.map(email => (
                        <div
                          key={email}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/10"
                        >
                          <span className="text-white/80">{email}</span>
                          <button
                            onClick={() => removeLawyerInvite(email)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-white/60">
                      {formData.invited_lawyers.length === 0
                        ? 'Puedes invitar abogados más tarde'
                        : `${formData.invited_lawyers.length} abogado(s) serán invitados`}
                    </p>
                  </motion.div>
                )}

                {/* Step 4: Marca Corporativa */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-white">Personalización de Marca</h2>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">URL del Logo</label>
                      <input
                        type="url"
                        value={formData.logo_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/70 mb-2">Color corporativo</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={formData.brand_color}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                          className="w-16 h-12 rounded-lg cursor-pointer"
                        />
                        <span className="text-white">{formData.brand_color}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">LinkedIn</label>
                        <input
                          type="url"
                          value={formData.linkedin}
                          onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                          placeholder="https://linkedin.com/company/..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-white/70 mb-2">WhatsApp</label>
                        <input
                          type="tel"
                          value={formData.whatsapp}
                          onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#3b82f6]"
                          placeholder="+57 300 1234567"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Finalización */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold text-white">Resumen de Configuración</h2>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Descripción</p>
                        <p className="text-white line-clamp-2">{formData.description}</p>
                      </div>

                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Áreas de Práctica</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.practice_areas.map(area => (
                            <span key={area} className="px-3 py-1 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] text-xs">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                        <p className="text-white/60 text-sm mb-1">Abogados a Invitar</p>
                        <p className="text-white">{formData.invited_lawyers.length} profesionales</p>
                      </div>
                    </div>

                    <button
                      onClick={handleComplete}
                      disabled={loading}
                      className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#f97316] text-white font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Completando...
                        </span>
                      ) : (
                        'Completar Configuración'
                      )}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        {!success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-between items-center"
          >
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/[0.05] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>

            <div className="text-white/60 text-sm">
              {currentStep} / {STEPS.length}
            </div>

            {currentStep < STEPS.length && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#3b82f6] text-white font-semibold hover:bg-[#2563eb] transition-all"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
