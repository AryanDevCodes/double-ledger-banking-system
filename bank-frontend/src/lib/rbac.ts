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
  Link2,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Wallet, TrendingUp } from "lucide-react";
import { isFeatureRouteEnabled } from "@/lib/features";

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  MANAGER: 'ROLE_MANAGER',
  CUSTOMER_MANAGER: 'ROLE_CUSTOMER_MANAGER',
  AUDITOR: 'ROLE_AUDITOR',
  USER: 'ROLE_USER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/* -------------------------------------------------------------------------
 * PERMISSION MATRIX
 * -------------------------------------------------------------------------
 * This is the thing that broke last time: BANKS_CREATE listed [MANAGER]
 * while BANKS_EDIT listed [ADMIN, MANAGER] — so an Admin could edit a bank
 * but couldn't see the button to create one. That kind of inconsistency is
 * easy to introduce by hand and easy to miss in review, because it doesn't
 * throw an error, it just quietly hides a button.
 *
 * To stop this class of bug from recurring, permissions are defined in two
 * layers:
 *
 *   1. PERMISSION_BASE — who has this permission, NOT counting Admin.
 *      This is the only thing you edit when adding/changing a permission.
 *
 *   2. PERMISSIONS (derived below) — PERMISSION_BASE with ROLES.ADMIN
 *      merged into every entry automatically, because in this app Admin is
 *      defined as a strict superset of every other role. You never have to
 *      remember to add ROLES.ADMIN anywhere.
 *
 * If a permission should ever NOT be available to Admins (rare — e.g. a
 * "maker-checker" action that must be done by a specific operational role,
 * even by an admin acting as that role), add its key to ADMIN_EXCLUDED
 * instead of adding ROLES.ADMIN by hand. That keeps the exception visible
 * and intentional in one place instead of buried in a long array.
 * ---------------------------------------------------------------------- */

const PERMISSION_BASE = {
  // Bank Management (Infrastructure)
  BANKS_VIEW: [ROLES.MANAGER, ROLES.AUDITOR],
  BANKS_VIEW_BY_UPI: [ROLES.MANAGER, ROLES.AUDITOR, ROLES.USER],
  BANKS_CREATE: [ROLES.MANAGER, ROLES.ADMIN],
  BANKS_EDIT: [ROLES.MANAGER, ROLES.ADMIN],

  // Customer Management (Customer Service Focus)
  CUSTOMERS_VIEW: [ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  CUSTOMERS_VIEW_OWN: [ROLES.USER],
  CUSTOMERS_VIEW_BY_EMAIL: [ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  CUSTOMERS_CREATE: [ROLES.CUSTOMER_MANAGER, ROLES.ADMIN],
  CUSTOMERS_EDIT: [ROLES.CUSTOMER_MANAGER, ROLES.ADMIN],
  CUSTOMERS_APPROVE_KYC: [ROLES.MANAGER, ROLES.ADMIN],

  // Account Management (Banking Operations)
  ACCOUNTS_VIEW: [ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  ACCOUNTS_VIEW_OWN: [ROLES.USER],
  ACCOUNTS_VIEW_BY_EMAIL: [ROLES.MANAGER, ROLES.CUSTOMER_MANAGER],
  ACCOUNTS_CREATE: [ROLES.MANAGER, ROLES.ADMIN],
  ACCOUNTS_EDIT: [ROLES.MANAGER, ROLES.ADMIN],
  ACCOUNTS_APPROVE: [ROLES.MANAGER, ROLES.ADMIN],

  // Transaction Management (Financial Operations - Immutable)
  TRANSACTIONS_VIEW_ALL: [ROLES.MANAGER, ROLES.AUDITOR],
  TRANSACTIONS_VIEW_OWN: [ROLES.USER],
  TRANSACTIONS_CREATE: [ROLES.USER],
  TRANSACTIONS_APPROVE: [ROLES.MANAGER, ROLES.ADMIN],
  TRANSACTIONS_EXPORT: [ROLES.AUDITOR],

  // UPI Management (Payment System)
  UPI_VIEW_ALL: [ROLES.MANAGER, ROLES.AUDITOR],
  UPI_VIEW_OWN: [ROLES.USER],
  UPI_CREATE: [ROLES.MANAGER, ROLES.USER],
  UPI_EDIT_OWN: [ROLES.USER],
  UPI_EDIT_ALL: [ROLES.MANAGER, ROLES.ADMIN],
  UPI_GENERATE_QR: [ROLES.MANAGER, ROLES.USER],
  UPI_PAY: [ROLES.USER],

  // Payment Operations (Customer Features)
  PAYMENTS_SEND: [ROLES.USER],
  PAYMENTS_VIEW_HISTORY: [ROLES.MANAGER, ROLES.AUDITOR, ROLES.USER],
  PAYMENTS_UPI: [ROLES.USER],
  PAYMENTS_BANK_TRANSFER: [ROLES.USER],

  // Audit & Compliance (Read-Only Access)
  AUDIT_VIEW: [ROLES.AUDITOR],
  AUDIT_EXPORT: [ROLES.AUDITOR],

  // Security & System Management (Admin Only)
  // Nothing to list here — Admin gets these automatically below, and no
  // other role should ever have them.
  SECURITY_VIEW: [],
  SECURITY_MANAGE: [],
  USERS_MANAGE: [],
  ROLES_MANAGE: [],
  SYSTEM_SETTINGS: [],

  // Reports & Analytics
  REPORTS_VIEW: [ROLES.MANAGER, ROLES.AUDITOR],
  REPORTS_EXPORT: [ROLES.MANAGER, ROLES.AUDITOR],

  // Dashboard Access
  DASHBOARD_ADMIN: [],
  DASHBOARD_MANAGER: [ROLES.MANAGER],
  DASHBOARD_CUSTOMER_MANAGER: [ROLES.CUSTOMER_MANAGER],
  DASHBOARD_USER: [ROLES.USER],
} as const satisfies Record<string, readonly Role[]>;

// Permissions Admin is deliberately excluded from. Empty by default — add a
// key here only with a comment explaining why, since it's an easy place for
// a silent bug to hide.
const ADMIN_EXCLUDED = new Set<PermissionKey>([]);

type PermissionKey = keyof typeof PERMISSION_BASE;
export type Permission = PermissionKey;

export const PERMISSIONS: Record<PermissionKey, Role[]> = Object.fromEntries(
  (Object.keys(PERMISSION_BASE) as PermissionKey[]).map((key) => {
    const baseRoles = PERMISSION_BASE[key] as readonly Role[];
    const roles = ADMIN_EXCLUDED.has(key)
      ? [...baseRoles]
      : Array.from(new Set<Role>([ROLES.ADMIN, ...baseRoles]));
    return [key, roles];
  })
) as Record<PermissionKey, Role[]>;

/**
 * Check if user has specific permission
 */
export function hasPermission(userRoles: string[], permission: Permission): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  const allowedRoles = PERMISSIONS[permission];
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
    path: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN],
  },
  {
    path: '/manager',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    path: '/customer-manager',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER],
  },
  {
    path: '/user',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.USER],
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.AUDITOR],
  },
  {
    path: '/send-money',
    label: 'Send Money',
    icon: Send,
    roles: [ROLES.USER],
  },
  {
    path: '/upi-pay',
    label: 'UPI Pay',
    icon: Smartphone,
    roles: [ROLES.USER],
  },
  {
    path: '/my-transactions',
    label: 'My Transactions',
    icon: ArrowLeftRight,
    roles: [ROLES.USER],
  },
  {
    path: '/cards',
    label: 'Cards',
    icon: CreditCard,
    roles: [ROLES.USER, ROLES.ADMIN, ROLES.MANAGER],
  },
  {
    path: '/loans',
    label: 'Loans & EMI',
    icon: TrendingUp,
    roles: [ROLES.USER],
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
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CUSTOMER_MANAGER, ROLES.AUDITOR],
  },
  {
    path: '/upi',
    label: 'UPI Management',
    icon: Smartphone,
    roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.AUDITOR],
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
  {
    path: '/webhooks',
    label: 'Webhooks',
    icon: Link2,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  },
];

/**
 * Filter navigation items based on user roles
 */
export function getVisibleNavItems(userRoles: string[]): NavigationItem[] {
  const dashboardRoute = getDashboardRoute(userRoles);
  const seenRoutes = new Set<string>();

  return NAVIGATION_ITEMS.filter(item => {
    if (!isFeatureRouteEnabled(item.path)) {
      return false;
    }

    const resolvedPath = item.path === '/dashboard' ? dashboardRoute : item.path;

    if (item.path === '/admin' || item.path === '/manager' || item.path === '/customer-manager' || item.path === '/user' || item.path === '/dashboard') {
      if (item.path !== dashboardRoute) {
        return false;
      }
    }

    if (item.roles !== 'all' && !hasAnyRole(userRoles, ...item.roles)) {
      return false;
    }

    if (seenRoutes.has(resolvedPath)) {
      return false;
    }

    seenRoutes.add(resolvedPath);
    return true;
  });
}

/* -------------------------------------------------------------------------
 * DEV-TIME SANITY CHECK (optional)
 * -------------------------------------------------------------------------
 * Catches the exact class of bug that started this: a role that can EDIT a
 * resource but can't CREATE it (or vice versa), which is very rarely
 * intentional. Call this once in a test file or at app startup in dev mode:
 *
 *   if (import.meta.env.DEV) checkPermissionConsistency();
 *
 * It only warns — it never throws — so it's safe to leave in.
 * ---------------------------------------------------------------------- */
export function checkPermissionConsistency(): string[] {
  const warnings: string[] = [];
  const keys = Object.keys(PERMISSIONS) as PermissionKey[];

  for (const key of keys) {
    if (!key.endsWith('_EDIT')) continue;
    const createKey = key.replace('_EDIT', '_CREATE') as PermissionKey;
    if (!(createKey in PERMISSIONS)) continue;

    const editRoles = new Set(PERMISSIONS[key]);
    const createRoles = new Set(PERMISSIONS[createKey]);

    for (const role of editRoles) {
      if (!createRoles.has(role)) {
        warnings.push(
          `${role} has ${key} but not ${createKey} — verify this is intentional.`
        );
      }
    }
  }

  if (warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.warn('[rbac] Permission consistency warnings:\n' + warnings.join('\n'));
  }

  return warnings;
}