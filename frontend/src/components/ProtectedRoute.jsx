import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Middleware de Acceso y Auditoría de Rutas - Punto Cero Legal
 *
 * - require: array de roles permitidos. Si vacío → cualquier autenticado
 * - allowUnverified: solo si true permite is_verified=false (uso interno /verificacion-pendiente)
 *
 * Reglas estrictas:
 *  • Sin sesión → /login
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

  // 2. Verificación pendiente para lawyers/clients (NO aplica a admins)
  if (!allowUnverified && !isAdminRole) {
    if (user?.is_verified === false || user?.status === 'PENDING_VERIFICATION') {
      return <Navigate to="/verificacion-pendiente" replace />;
    }
  }

  // 3. Si el usuario es admin y va a una ruta de abogados (sin require), redirigir a /admin
  if (isAdminRole && require.length === 0 && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/admin" replace />;
  }

  // 4. Si la ruta requiere roles específicos, validar estrictamente
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
