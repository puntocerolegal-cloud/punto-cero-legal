import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ProtectedRoute (OS) — exige sesión activa.
 * Es ADITIVO: no reemplaza al guard jurídico existente en
 * src/components/ProtectedRoute.jsx; este vive bajo /security para el OS.
 */
export function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center text-[#f97316]">
        Verificando acceso...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  return children;
}

export default ProtectedRoute;
