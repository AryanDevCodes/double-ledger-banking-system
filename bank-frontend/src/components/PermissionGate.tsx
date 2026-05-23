import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Permission, hasPermission } from '@/lib/rbac';

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Permission wrapper component - renders children only if user has permission
 */
export const Can: React.FC<CanProps> = ({ permission, children, fallback = null }) => {
  const { user } = useAuth();
  
  if (!user || !hasPermission(user.roles, permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

interface CannotProps {
  permission: Permission;
  children: React.ReactNode;
}

/**
 * Inverse permission wrapper - renders children only if user DOESN'T have permission
 */
export const Cannot: React.FC<CannotProps> = ({ permission, children }) => {
  const { user } = useAuth();
  
  if (user && hasPermission(user.roles, permission)) {
    return null;
  }
  
  return <>{children}</>;
};

interface RoleGateProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Role-based gate component - renders children only if user has any of specified roles
 */
export const RoleGate: React.FC<RoleGateProps> = ({ roles, children, fallback = null }) => {
  const { hasAnyRole } = useAuth();
  
  if (!hasAnyRole(...roles)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
