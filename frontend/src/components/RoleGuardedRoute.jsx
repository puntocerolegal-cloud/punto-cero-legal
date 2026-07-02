import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityLogger } from '@/security/SecurityLogger';

/**
 * RoleGuardedRoute — Enhanced RBAC protection at route level
 * Checks both role AND specific permissions before rendering
 */
export function RoleGuardedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback = null,
  allowUnverified = false,
}) {
  const { user, isAuthenticated } = useAuth();

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      SecurityLogger.recordUnauthorizedAccess(
        window.location.pathname,
        'INSUFFICIENT_ROLE',
        user
      );

      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-white/60">You do not have permission to access this page.</p>
            <p className="text-white/40 text-sm mt-4">
              Your role: <code className="bg-white/5 px-2 py-1 rounded">{user.role}</code>
            </p>
          </div>
        </div>
      );
    }
  }

  // Check permission requirement
  if (requiredPermissions.length > 0) {
    const hasPermissions = requiredPermissions.every(perm =>
      checkPermission(user, perm)
    );

    if (!hasPermissions) {
      SecurityLogger.recordPermissionDenied(
        requiredPermissions.join(','),
        window.location.pathname,
        user
      );

      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Insufficient Permissions</h1>
            <p className="text-white/60">You do not have the required permissions.</p>
          </div>
        </div>
      );
    }
  }

  // Check verification (for lawyers/clients)
  if (!allowUnverified && user.is_verified === false) {
    return <Navigate to="/verificacion-pendiente" replace />;
  }

  return children;
}

/**
 * Helper: Check if user has a specific permission
 * This maps roles to permissions
 */
function checkPermission(user, permission) {
  const rolePermissions = {
    'admin_general': [
      'VIEW_ALL_CASES',
      'MANAGE_USERS',
      'MANAGE_ROLES',
      'MANAGE_SETTINGS',
      'VIEW_ANALYTICS',
      'MANAGE_AUTOMATION',
      'VIEW_AUDIT_LOG',
    ],
    'admin': [
      'VIEW_ALL_CASES',
      'VIEW_ANALYTICS',
      'MANAGE_AUTOMATION',
    ],
    'socio_comercial': [
      'VIEW_ALL_CASES',
      'MANAGE_SETTINGS',
      'VIEW_ANALYTICS',
    ],
    'firm_owner': [
      'MANAGE_FIRM',
      'MANAGE_TEAM',
      'VIEW_ANALYTICS',
      'MANAGE_SETTINGS',
    ],
    'firm_admin': [
      'MANAGE_TEAM',
      'VIEW_ANALYTICS',
      'MANAGE_AUTOMATION',
    ],
    'firm_lawyer': [
      'VIEW_ASSIGNED_CASES',
      'EDIT_ASSIGNED_CASES',
    ],
    'lawyer': [
      'VIEW_ASSIGNED_CASES',
      'EDIT_ASSIGNED_CASES',
    ],
    'client': [
      'VIEW_OWN_CASES',
    ],
  };

  const permissions = rolePermissions[user?.role] || [];
  return permissions.includes(permission);
}

export default RoleGuardedRoute;
