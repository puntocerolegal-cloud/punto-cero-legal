import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, AlertCircle, CheckCircle, Upload, Trash2, Mail, Plus, X } from 'lucide-react';
import { API } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

const StepIndicator = ({ currentStep, totalSteps }) => (
  <div className="flex gap-2 mb-8">
    {Array.from({ length: totalSteps }).map((_, i) => (
      <div
        key={i}
        className={`h-2 flex-1 rounded-full transition-all ${
          i < currentStep
            ? 'bg-green-500'
            : i === currentStep
            ? 'bg-blue-500'
            : 'bg-gray-700'
        }`}
      />
    ))}
  </div>
);

export function FirmOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [practiceAreas, setPracticeAreas] = useState([]);

  const [formData, setFormData] = useState({
    // Paso 1: Datos corporativos
    commercial_name: '',
    description: '',
    website: '',
    phone: '',
    // Paso 2: Identidad
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#f97316',
    cover_image_url: '',
    // Paso 3: Áreas de práctica
    practice_areas: [],
    // Paso 4: Invitar abogados
    invited_lawyers: []
  });

  const [newLawyer, setNewLawyer] = useState({
    email: '',
    full_name: '',
    role: 'firm_lawyer'
  });

  const firmId = user?.firm_id;

  const loadPracticeAreas = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/firm-config/${firmId}/practice-areas`);
      setPracticeAreas(res.data.data || []);
    } catch (err) {
      console.error('Error loading practice areas:', err);
    }
  }, [firmId]);

  useEffect(() => {
    loadPracticeAreas();
  }, [loadPracticeAreas]);

  const handleNext = async () => {
    setError('');
    setLoading(true);

    try {
      // Validar paso actual
      if (currentStep === 0) {
        if (!formData.commercial_name || !formData.phone) {
          setError('Por favor completa todos los campos requeridos');
          setLoading(false);
          return;
        }
      } else if (currentStep === 1) {
        if (!formData.primary_color || !formData.secondary_color) {
          setError('Selecciona los colores corporativos');
          setLoading(false);
          return;
        }
      } else if (currentStep === 2) {
        if (formData.practice_areas.length === 0) {
          setError('Selecciona al menos un área de práctica');
          setLoading(false);
          return;
        }
      }

      // Guardar progreso del paso actual
      await axios.post(
        `${API}/firm-config/${firmId}/step`,
        {
          step: currentStep,
          data: extractStepData(currentStep)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Avanzar al siguiente paso
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        // Completar onboarding
        completeOnboarding();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el progreso');
    } finally {
      setLoading(false);
    }
  };

  const extractStepData = (step) => {
    if (step === 0) {
      return {
        commercial_name: formData.commercial_name,
        description: formData.description,
        website: formData.website,
        phone: formData.phone
      };
    } else if (step === 1) {
      return {
        logo_url: formData.logo_url,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        cover_image_url: formData.cover_image_url
      };
    } else if (step === 2) {
      return {
        practice_areas: formData.practice_areas
      };
    } else if (step === 3) {
      return {
        invited_lawyers: formData.invited_lawyers
      };
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API}/firm-config/${firmId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setSuccess(true);
      setTimeout(() => {
        navigate('/firm-os');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al completar el onboarding');
      setLoading(false);
    }
  };

  const togglePracticeArea = (areaId) => {
    setFormData(prev => ({
      ...prev,
      practice_areas: prev.practice_areas.includes(areaId)
        ? prev.practice_areas.filter(a => a !== areaId)
        : [...prev.practice_areas, areaId]
    }));
  };

  const addLawyer = () => {
    if (!newLawyer.email || !newLawyer.full_name) {
      setError('Por favor completa el email y nombre del abogado');
      return;
    }
    setFormData(prev => ({
      ...prev,
      invited_lawyers: [...prev.invited_lawyers, { ...newLawyer }]
    }));
    setNewLawyer({ email: '', full_name: '', role: 'firm_lawyer' });
    setError('');
  };

  const removeLawyer = (idx) => {
    setFormData(prev => ({
      ...prev,
      invited_lawyers: prev.invited_lawyers.filter((_, i) => i !== idx)
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, cover_image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Configurar tu Firma</h1>
          <p className="text-gray-400">Completa estos pasos para activar tu acceso a Firm OS</p>
        </div>

        {/* Progress */}
        <StepIndicator currentStep={currentStep + 1} totalSteps={4} />

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/30 border border-red-700 flex gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">¡Bienvenido a Firm OS!</h2>
              <p className="text-gray-400">Tu configuración ha sido guardada correctamente.</p>
              <p className="text-sm text-gray-500 mt-4">Redirigiendo a tu dashboard...</p>
            </div>
          ) : (
            <>
              {/* PASO 1: Datos Corporativos */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Datos Corporativos</h2>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      value={formData.commercial_name}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, commercial_name: e.target.value }))
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      placeholder="Ej: Bufete Jurídico XYZ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Breve descripción de tu firma..."
                      rows="4"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Sitio Web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, website: e.target.value }))
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      placeholder="+57 1 XXXXX"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: Identidad */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Identidad Corporativa</h2>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Logo
                    </label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors flex items-center gap-2 text-gray-300">
                          <Upload className="w-5 h-5" />
                          <span>Subir Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.logo_url && (
                        <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={formData.logo_url}
                            alt="Logo"
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Color Primario
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, primary_color: e.target.value }))
                          }
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.primary_color}
                          readOnly
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Color Secundario
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, secondary_color: e.target.value }))
                          }
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.secondary_color}
                          readOnly
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Imagen de Portada
                    </label>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors flex items-center gap-2 text-gray-300">
                          <Upload className="w-5 h-5" />
                          <span>Subir Portada</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formData.cover_image_url && (
                        <div className="w-20 h-20 bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={formData.cover_image_url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: Áreas de Práctica */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Áreas de Práctica</h2>
                  <p className="text-gray-400 text-sm">Selecciona las áreas en las que tu firma opera:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {practiceAreas.map(area => (
                      <label
                        key={area.id}
                        className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.practice_areas.includes(area.id)}
                          onChange={() => togglePracticeArea(area.id)}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                        <div>
                          <p className="font-semibold text-white">{area.name}</p>
                          <p className="text-xs text-gray-400">{area.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-300">
                      Seleccionadas: {formData.practice_areas.length}
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 4: Invitar Abogados */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Invitar Abogados</h2>

                  <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newLawyer.email}
                        onChange={(e) =>
                          setNewLawyer(prev => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder="abogado@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        value={newLawyer.full_name}
                        onChange={(e) =>
                          setNewLawyer(prev => ({ ...prev, full_name: e.target.value }))
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Rol
                      </label>
                      <select
                        value={newLawyer.role}
                        onChange={(e) =>
                          setNewLawyer(prev => ({ ...prev, role: e.target.value }))
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="firm_lawyer">Abogado</option>
                        <option value="firm_admin">Administrador</option>
                      </select>
                    </div>

                    <button
                      onClick={addLawyer}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg text-white font-semibold transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar Abogado
                    </button>
                  </div>

                  {formData.invited_lawyers.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white">
                        Abogados a Invitar ({formData.invited_lawyers.length})
                      </h3>
                      {formData.invited_lawyers.map((lawyer, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-white">{lawyer.full_name}</p>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {lawyer.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Rol: {lawyer.role === 'firm_lawyer' ? 'Abogado' : 'Administrador'}
                            </p>
                          </div>
                          <button
                            onClick={() => removeLawyer(idx)}
                            className="p-2 hover:bg-red-600/30 rounded-lg transition-colors text-red-400"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-gray-700/50 rounded-lg text-sm text-gray-400">
                    <p>💡 Puedes invitar abogados ahora o después desde la sección de Abogados.</p>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4 mt-8 pt-8 border-t border-gray-700">
                <button
                  onClick={() => {
                    if (currentStep > 0) {
                      setCurrentStep(currentStep - 1);
                      setError('');
                    }
                  }}
                  disabled={currentStep === 0 || loading}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-600 text-white font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Atrás
                </button>

                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : currentStep === 3 ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Finalizar
                    </>
                  ) : (
                    'Siguiente'
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Paso {currentStep + 1} de 4</p>
        </div>
      </div>
    </div>
  );
}

export default FirmOnboarding;
