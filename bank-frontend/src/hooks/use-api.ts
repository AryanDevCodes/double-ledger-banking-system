// React Query hooks for API integration
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bankApi,
  customerApi,
  accountApi,
  transactionApi,
  upiApi,
  auditApi,
  securityApi,
  ApiError,
} from "@/lib/api-client";
import type {
  BankRequestDTO,
  BankResponseDTO,
  CustomerRequestDTO,
  CustomerResponseDTO,
  AccountRequestDTO,
  AccountResponseDTO,
  TransactionRequestDTO,
  TransactionResponseDTO,
  UpiRegisterRequestDTO,
  UpiPayRequestDTO,
  UpiProfileResponseDTO,
} from "@/types/api";
import type { AuditLogEntry, SessionInfo, AccessLogEntry } from "@/lib/api-client";

// Error handler helper
const handleApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    toast.error(`Error ${error.status}: ${error.message}`);
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unexpected error occurred");
  }
};

// ============= Bank Hooks =============
export const useBanks = (options?: Omit<UseQueryOptions<BankResponseDTO[]>, "queryKey" | "queryFn">) =>
  useQuery({
    queryKey: ["banks"],
    queryFn: bankApi.getAll,
    ...options,
  });

export const useBank = (id: string) =>
  useQuery({
    queryKey: ["banks", id],
    queryFn: () => bankApi.getById(id),
    enabled: !!id,
  });

export const useCreateBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bankApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank created successfully");
    },
    onError: handleApiError,
  });
};

export const useUpdateBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankRequestDTO> }) =>
      bankApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank updated successfully");
    },
    onError: handleApiError,
  });
};

export const useDeleteBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bankApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Bank deleted successfully");
    },
    onError: handleApiError,
  });
};

// ============= Customer Hooks =============
export const useCustomers = (options?: Omit<UseQueryOptions<CustomerResponseDTO[]>, "queryKey" | "queryFn">) =>
  useQuery({
    queryKey: ["customers"],
    queryFn: customerApi.getAll,
    ...options,
  });

export const useCustomer = (id: string) =>
  useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerApi.getById(id),
    enabled: !!id,
  });

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: handleApiError,
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerRequestDTO> }) =>
      customerApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
    },
    onError: handleApiError,
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: handleApiError,
  });
};

// ============= Account Hooks =============
export const useAccounts = (options?: Omit<UseQueryOptions<AccountResponseDTO[]>, "queryKey" | "queryFn">) =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: accountApi.getAll,
    ...options,
  });

export const useAccount = (accountNumber: string) =>
  useQuery({
    queryKey: ["accounts", accountNumber],
    queryFn: () => accountApi.getByAccountNumber(accountNumber),
    enabled: !!accountNumber,
  });

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bankId, data }: { bankId: string; data: AccountRequestDTO }) =>
      accountApi.create(bankId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created successfully");
    },
    onError: handleApiError,
  });
};

export const useCloseAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.close,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account closed successfully");
    },
    onError: handleApiError,
  });
};

// ============= Transaction Hooks =============
export const useTransactions = (options?: Omit<UseQueryOptions<TransactionResponseDTO[]>, "queryKey" | "queryFn">) =>
  useQuery({
    queryKey: ["transactions"],
    queryFn: transactionApi.getAll,
    ...options,
  });

export const useTransaction = (id: number) =>
  useQuery({
    queryKey: ["transactions", id],
    queryFn: () => transactionApi.getById(id),
    enabled: !!id,
  });

export const useAccountTransactions = (accountNumber: string) =>
  useQuery({
    queryKey: ["transactions", "account", accountNumber],
    queryFn: () => transactionApi.getByAccountNumber(accountNumber),
    enabled: !!accountNumber,
  });

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transactionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Transaction initiated successfully");
    },
    onError: handleApiError,
  });
};

// ============= UPI Hooks =============
export const useUpiProfiles = (options?: Omit<UseQueryOptions<UpiProfileResponseDTO[]>, "queryKey" | "queryFn">) =>
  useQuery({
    queryKey: ["upi-profiles"],
    queryFn: upiApi.getAllProfiles,
    ...options,
  });

export const useUpiProfile = (upiId: string) =>
  useQuery({
    queryKey: ["upi-profiles", upiId],
    queryFn: () => upiApi.getProfile(upiId),
    enabled: !!upiId,
  });

export const useRegisterUpi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upiApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upi-profiles"] });
      toast.success("UPI ID registered successfully");
    },
    onError: handleApiError,
  });
};

export const useUpiPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upiApi.pay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("UPI payment successful");
    },
    onError: handleApiError,
  });
};

export const useDeactivateUpi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upiApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upi-profiles"] });
      toast.success("UPI ID deactivated");
    },
    onError: handleApiError,
  });
};

// ============= Audit Hooks =============
export const useAuditLogs = (params?: Parameters<typeof auditApi.getLogs>[0]) =>
  useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => auditApi.getLogs(params),
  });

export const useAuditLog = (id: string) =>
  useQuery({
    queryKey: ["audit-logs", id],
    queryFn: () => auditApi.getLogById(id),
    enabled: !!id,
  });

// ============= Security Hooks =============
export const useSessions = () =>
  useQuery({
    queryKey: ["sessions"],
    queryFn: securityApi.getSessions,
  });

export const useTerminateSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: securityApi.terminateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session terminated");
    },
    onError: handleApiError,
  });
};

export const useTerminateAllSessions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (excludeCurrent?: boolean) =>
      securityApi.terminateAllSessions(excludeCurrent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("All sessions terminated");
    },
    onError: handleApiError,
  });
};

export const useAccessLogs = (params?: Parameters<typeof securityApi.getAccessLogs>[0]) =>
  useQuery({
    queryKey: ["access-logs", params],
    queryFn: () => securityApi.getAccessLogs(params),
  });
