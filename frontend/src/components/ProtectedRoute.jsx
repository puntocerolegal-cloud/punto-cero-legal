import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Middleware de Acceso y Auditoría de Rutas - Punto Cero Legal
 *
 * FLUJO OFICIAL DE ACTIVACIÓN:
 * 1. Registro → sin token → /verificacion-pendiente (esperar email)
 * 2. Login con contraseña temporal → requires_password_change=True → /change-password-required
 * 3. Cambio de contraseña → ready_for_onboarding=True → /activation-wizard
 * 4. Onboarding completado → acceso normal
 *
 * - require: array de roles permitidos. Si vacío → cualquier autenticado
 * - allowUnverified: solo si true permite is_verified=false (uso interno /verificacion-pendiente)
 *
 * Reglas estrictas:
 *  • Sin sesión → /login
 *  • requires_password_change=True → /change-password-required
 *  • ready_for_onboarding=True (sin onboarding_completed) → /activation-wizard
 *  • is_verified=false (rol lawyer/client) → /verificacion-pendiente (excepto en la propia ruta)
 *  • Sin permiso de rol → /dashboard (con mensaje)
 */
export const ProtectedRoute = ({ children, require = [], allowUnverified = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#f97316]">
          <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
          <span>Verificando acceso...</span>
        </div>
      </div>
    );
  }

  // 1. Sin sesión
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const adminRoles = ['admin', 'admin_general', 'socio_comercial'];
  const isAdminRole = adminRoles.includes(user?.role);

  // 2. FLUJO DE ACTIVACIÓN: cambio de contraseña obligatorio
  // Solo para usuarios NO admin que tienen requires_password_change=True
  if (!isAdminRole && user?.requires_password_change === true) {
    // Permitir acceso solo a la ruta de cambio de contraseña
    if (location.pathname !== '/change-password-required') {
      return <Navigate to="/change-password-required" replace />;
    }
  }

  // 3. FLUJO DE ACTIVACIÓN: onboarding pendiente
  // Solo para usuarios NO admin que tienen ready_for_onboarding=True pero no han completado onboarding
  if (!isAdminRole && user?.ready_for_onboarding === true && !user?.onboarding_completed) {
    // Permitir acceso a rutas de onboarding
    const allowedOnboardingPaths = ['/activation-wizard', '/onboarding'];
    const isOnboardingPath = allowedOnboardingPaths.some(path => location.pathname.startsWith(path));
    
    if (!isOnboardingPath) {
      return <Navigate to="/activation-wizard" replace />;
    }
  }

  // 4. Verificación pendiente para lawyers/clients (NO aplica a admins)
  // Solo si NO está en flujo de activación (requires_password_change=False)
  if (!allowUnverified && !isAdminRole && !user?.requires_password_change) {
    if (user?.is_verified === false || user?.status === 'PENDING_VERIFICATION') {
      return <Navigate to="/verificacion-pendiente" replace />;
    }
  }

  // 5. Si el usuario es admin y va a una ruta de abogados (sin require), redirigir a /admin
  if (isAdminRole && require.length === 0 && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/admin" replace />;
  }

  // 6. Si la ruta requiere roles específicos, validar estrictamente
  if (require.length > 0 && !require.includes(user?.role)) {
    // Admin intentando acceder a ruta de abogados → /admin
    if (isAdminRole) {
      return <Navigate to="/admin" replace />;
    }
    // Lawyer/client intentando acceder a ruta admin → /dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
