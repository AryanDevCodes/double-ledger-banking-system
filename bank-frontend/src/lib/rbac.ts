// Role-Based Access Control (RBAC) Configuration
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ArrowLeftRight,
  Smartphone,
  FileText,
  Lock,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import { isFeatureRouteEnabled } from "@/lib/features";

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  MANAGER: 'ROLE_MANAGER',
  CUSTOMER_MANAGER: 'ROLE_CUSTOMER_MANAGER',
  AUDITOR: 'ROLE_AUDITOR',
  USER: 'ROLE_USER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Fine-tuned permissions for banking operations
export const PERMISSIONS = {
  // Bank Management (Infrastructure)
  BANKS_VIEW: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
  BANKS_VIEW_BY_UPI: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR, ROLES.USER],
  BANKS_CREATE: [ROLES.MANAGER],
  BANKS_EDIT: [ROLES.ADMIN, ROLES.MANAGER],

  // Customer Management (Customer Service Focus)
  CUSTOMERS_VIEW: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  CUSTOMERS_VIEW_OWN: [ROLES.USER],
  CUSTOMERS_VIEW_BY_EMAIL: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  CUSTOMERS_CREATE: [ROLES.CUSTOMER_MANAGER],
  CUSTOMERS_EDIT: [ROLES.ADMIN, ROLES.CUSTOMER_MANAGER],
  CUSTOMERS_APPROVE_KYC: [ROLES.ADMIN, ROLES.MANAGER],

  // Account Management (Banking Operations)
  ACCOUNTS_VIEW: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  ACCOUNTS_VIEW_OWN: [ROLES.USER],
  ACCOUNTS_VIEW_BY_EMAIL: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER],
  ACCOUNTS_CREATE: [ROLES.MANAGER],
  ACCOUNTS_EDIT: [ROLES.ADMIN, ROLES.MANAGER],
  ACCOUNTS_APPROVE: [ROLES.ADMIN, ROLES.MANAGER],

  // Transaction Management (Financial Operations - Immutable)
  TRANSACTIONS_VIEW_ALL: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
  TRANSACTIONS_VIEW_OWN: [ROLES.USER],
  TRANSACTIONS_CREATE: [ROLES.USER],
  TRANSACTIONS_APPROVE: [ROLES.ADMIN, ROLES.MANAGER],
  TRANSACTIONS_EXPORT: [ROLES.ADMIN, ROLES.AUDITOR],

  // UPI Management (Payment System)
  UPI_VIEW_ALL: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
  UPI_VIEW_OWN: [ROLES.USER],
  UPI_CREATE: [ROLES.MANAGER, ROLES.USER],
  UPI_EDIT_OWN: [ROLES.USER],
  UPI_EDIT_ALL: [ROLES.ADMIN, ROLES.MANAGER],
  UPI_GENERATE_QR: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER],
  UPI_PAY: [ROLES.USER],

  // Payment Operations (Customer Features)
  PAYMENTS_SEND: [ROLES.USER],
  PAYMENTS_VIEW_HISTORY: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR, ROLES.USER],
  PAYMENTS_UPI: [ROLES.USER],
  PAYMENTS_BANK_TRANSFER: [ROLES.USER],

  // Audit & Compliance (Read-Only Access)
  AUDIT_VIEW: [ROLES.ADMIN, ROLES.AUDITOR],
  AUDIT_EXPORT: [ROLES.ADMIN, ROLES.AUDITOR],
  
  // Security & System Management (Admin Only)
  SECURITY_VIEW: [ROLES.ADMIN],
  SECURITY_MANAGE: [ROLES.ADMIN],
  USERS_MANAGE: [ROLES.ADMIN],
  ROLES_MANAGE: [ROLES.ADMIN],
  SYSTEM_SETTINGS: [ROLES.ADMIN],

  // Reports & Analytics
  REPORTS_VIEW: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
  REPORTS_EXPORT: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],

  // Dashboard Access
  DASHBOARD_ADMIN: [ROLES.ADMIN],
  DASHBOARD_MANAGER: [ROLES.MANAGER],
  DASHBOARD_CUSTOMER_MANAGER: [ROLES.CUSTOMER_MANAGER],
  DASHBOARD_USER: [ROLES.USER],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has specific permission
 */
export function hasPermission(userRoles: string[], permission: Permission): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  const allowedRoles = PERMISSIONS[permission] as readonly Role[];
  return userRoles.some(role => allowedRoles.includes(role as Role));
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: string[], ...roles: Role[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some(role => roles.includes(role as Role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(userRoles: string[], ...roles: Role[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return roles.every(role => userRoles.includes(role));
}

/**
 * Get user's primary role (highest privilege)
 */
export function getPrimaryRole(userRoles: string[]): Role | null {
  if (!userRoles || userRoles.length === 0) return null;
  
  const roleHierarchy = [
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.CUSTOMER_MANAGER,
    ROLES.AUDITOR,
    ROLES.USER,
  ];
  
  for (const role of roleHierarchy) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Get dashboard route based on user's primary role
 */
export function getDashboardRoute(userRoles: string[]): string {
  const primaryRole = getPrimaryRole(userRoles);
  
  switch (primaryRole) {
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.MANAGER:
      return '/manager';
    case ROLES.CUSTOMER_MANAGER:
      return '/customer-manager';
    case ROLES.AUDITOR:
      return '/dashboard';
    case ROLES.USER:
      return '/user';
    default:
      return '/';
  }
}

/**
 * Role display names
 */
export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.CUSTOMER_MANAGER]: 'Customer Manager',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.USER]: 'User',
};

/**
 * Role badge colors for UI
 */
export const ROLE_COLORS: Record<string, string> = {
  [ROLES.ADMIN]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [ROLES.MANAGER]: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  [ROLES.CUSTOMER_MANAGER]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [ROLES.AUDITOR]: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  [ROLES.USER]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

/**
 * Navigation menu items with role-based visibility
 */
export interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: Role[] | 'all';
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: 'all',
  },
  {
    path: '/payments',
    label: 'Payments',
    icon: ArrowLeftRight,
    roles: 'all',
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: UserCircle2,
    roles: 'all',
  },
  {
    path: '/banks',
    label: 'Banks',
    icon: Building2,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
  },
  {
    path: '/customers',
    label: 'Customers',
    icon: Users,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  },
  {
    path: '/accounts',
    label: 'Accounts',
    icon: CreditCard,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  },
  {
    path: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
  },
  {
    path: '/upi',
    label: 'UPI',
    icon: Smartphone,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR, ROLES.USER],
  },
  {
    path: '/audit',
    label: 'Audit Logs',
    icon: FileText,
    roles: [ROLES.ADMIN, ROLES.AUDITOR],
  },
  {
    path: '/security',
    label: 'Security',
    icon: Lock,
    roles: [ROLES.ADMIN],
  },
];

/**
 * Filter navigation items based on user roles
 */
export function getVisibleNavItems(userRoles: string[]): NavigationItem[] {
  return NAVIGATION_ITEMS.filter(item => {
    if (!isFeatureRouteEnabled(item.path)) {
      return false;
    }

    if (item.roles === 'all') return true;
    return hasAnyRole(userRoles, ...item.roles);
  });
}
