import { useState, useCallback } from 'react';
import axios from 'axios';
import { API } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

export function useOnboarding() {
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Basic info
    name: user?.firm_name || '',
    description: '',
    website: '',
    address: '',
    city: '',
    country: '',
    
    // Practice areas
    practice_areas: [],
    new_practice_area: '',
    
    // Lawyers
    lawyers: [],
    new_lawyer: { name: '', email: '', specialty: '' },
    
    // Branding
    logo_url: '',
    primary_color: '#0066cc',
    secondary_color: '#f97316',
  });

  const updateFormData = useCallback((key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const addPracticeArea = useCallback(() => {
    if (formData.new_practice_area.trim()) {
      setFormData(prev => ({
        ...prev,
        practice_areas: [...prev.practice_areas, prev.new_practice_area],
        new_practice_area: '',
      }));
    }
  }, [formData.new_practice_area]);

  const removePracticeArea = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      practice_areas: prev.practice_areas.filter((_, i) => i !== index),
    }));
  }, []);

  const addLawyer = useCallback(() => {
    if (formData.new_lawyer.name.trim() && formData.new_lawyer.email.trim()) {
      setFormData(prev => ({
        ...prev,
        lawyers: [...prev.lawyers, prev.new_lawyer],
        new_lawyer: { name: '', email: '', specialty: '' },
      }));
    }
  }, [formData.new_lawyer]);

  const removeLawyer = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      lawyers: prev.lawyers.filter((_, i) => i !== index),
    }));
  }, []);

  const submitOnboarding = useCallback(async () => {
    if (!user?.firm_id) return;

    try {
      setLoading(true);
      setError('');

      // Submit firm data
      await axios.put(
        `${API}/firm/${user.firm_id}`,
        {
          name: formData.name,
          description: formData.description,
          website: formData.website,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          logo_url: formData.logo_url,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          practice_areas: formData.practice_areas,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Invite lawyers
      if (formData.lawyers.length > 0) {
        await Promise.all(
          formData.lawyers.map(lawyer =>
            axios.post(
              `${API}/rbac/invite`,
              {
                firm_id: user.firm_id,
                email: lawyer.email,
                name: lawyer.name,
                role: 'lawyer',
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            )
          )
        );
      }

      setSuccess(true);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Error durante la configuración');
      console.error('Onboarding error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.firm_id, token, formData]);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);

  return {
    currentStep,
    loading,
    error,
    success,
    formData,
    updateFormData,
    addPracticeArea,
    removePracticeArea,
    addLawyer,
    removeLawyer,
    submitOnboarding,
    nextStep,
    prevStep,
    goToStep,
  };
}
