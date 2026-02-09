export type UserRole = "admin" | "manager" | "customer_manager" | "user";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  joinedAt: string;
  lastActive: string;
}

export interface RolePermissions {
  canManageBanks: boolean;
  canManageCustomers: boolean;
  canManageAccounts: boolean;
  canViewTransactions: boolean;
  canManageTransactions: boolean;
  canManageUpi: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
}

export const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canManageBanks: true,
    canManageCustomers: true,
    canManageAccounts: true,
    canViewTransactions: true,
    canManageTransactions: true,
    canManageUpi: true,
    canManageUsers: true,
    canViewReports: true,
  },
  manager: {
    canManageBanks: true,
    canManageCustomers: true,
    canManageAccounts: true,
    canViewTransactions: true,
    canManageTransactions: true,
    canManageUpi: true,
    canManageUsers: false,
    canViewReports: true,
  },
  customer_manager: {
    canManageBanks: false,
    canManageCustomers: true,
    canManageAccounts: true,
    canViewTransactions: true,
    canManageTransactions: false,
    canManageUpi: false,
    canManageUsers: false,
    canViewReports: false,
  },
  user: {
    canManageBanks: false,
    canManageCustomers: false,
    canManageAccounts: false,
    canViewTransactions: true,
    canManageTransactions: false,
    canManageUpi: false,
    canManageUsers: false,
    canViewReports: false,
  },
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
  customer_manager: "Customer Manager",
  user: "User",
};

export const roleColors: Record<UserRole, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  manager: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  customer_manager: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  user: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};
