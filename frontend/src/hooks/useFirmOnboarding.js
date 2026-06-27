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
    let isMounted = true;

    const checkOnboardingStatus = async () => {
      try {
        if (!user?.firm_id || !token) {
          if (isMounted) setIsLoading(false);
          return;
        }

        // Only check if user is a firm_owner
        if (user.role !== 'firm_owner') {
          if (isMounted) setIsLoading(false);
          return;
        }

        const res = await axios.get(`${API}/firm-config/${user.firm_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!isMounted) return;

        const config = res.data?.data;

        // Si el onboarding no está completado, redirigir solo a firm_owner
        if (!config?.onboarding_completed) {
          setIsOnboardingRequired(true);
          navigate('/firm-os/onboarding', { replace: true });
        }
      } catch (err) {
        // Error checking: allow access but don't force onboarding
        // This is a graceful degradation - the user can still access the dashboard
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error checking onboarding status:', err);
          }
          setIsOnboardingRequired(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkOnboardingStatus();

    return () => {
      isMounted = false;
    };
  }, [navigate, user?.firm_id, user?.role, token]);

  return { isOnboardingRequired, isLoading };
}
