import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

export function useFirmOnboarding() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isOnboardingRequired, setIsOnboardingRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        if (!user?.firm_id || !token) {
          setIsLoading(false);
          return;
        }

        const res = await axios.get(`${API}/firm-config/${user.firm_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const config = res.data?.data;

        // Si el onboarding no está completado, redirigir
        if (!config?.onboarding_completed && user.role === 'firm_owner') {
          setIsOnboardingRequired(true);
          navigate('/firm-os/onboarding', { replace: true });
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
        // En caso de error, permitir acceso pero no forzar onboarding
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate, user?.firm_id, user?.role, token]);

  return { isOnboardingRequired, isLoading };
}
