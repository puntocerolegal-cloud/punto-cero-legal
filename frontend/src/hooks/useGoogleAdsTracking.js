import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/googleAds';

/**
 * Hook para tracking automático de rutas en React SPA.
 * 
 * Detecta cada cambio de ruta y dispara el evento page_view de Google Ads.
 * Se debe usar UNA SOLA VEZ en el componente principal de la app (App.js).
 * 
 * Uso:
 *   function App() {
 *     useGoogleAdsTracking();
 *     return (...);
 *   }
 */
export function useGoogleAdsTracking() {
  const location = useLocation();

  useEffect(() => {
    // Disparar page_view en cada cambio de ruta
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}