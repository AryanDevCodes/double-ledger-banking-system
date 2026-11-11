// hooks/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { accountApi, bankApi } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import type { AccountResponseDTO, BankResponseDTO } from '@/types/api';

export function useAccounts() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasStaffRole = user?.roles?.some((role) =>
    ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER', 'ROLE_AUDITOR'].includes(role),
  ) ?? false;
  const isPersonalView = Boolean(user?.roles?.includes('ROLE_USER') && !hasStaffRole);
  const canLoadBankOptions = user?.roles?.some((role) =>
    ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role),
  ) ?? false;

  const accountsQuery = useQuery<AccountResponseDTO[]>({
    queryKey: ['accounts', isPersonalView ? 'mine' : 'all', user?.userId, location.key],
    queryFn: isPersonalView ? accountApi.getMy : accountApi.getAll,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const banksQuery = useQuery<BankResponseDTO[]>({
    queryKey: ['banks', user?.userId, location.key],
    queryFn: bankApi.getAll,
    enabled: canLoadBankOptions,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const createAccount = useMutation({
    mutationFn: ({ bankName, data }: { bankName: string; data: any }) =>
      accountApi.create(bankName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['banks'] });
    },
  });

  const updateCompliance = useMutation({
    mutationFn: ({ accountNumber, data }: { accountNumber: string; data: any }) =>
      accountApi.updateCompliance(accountNumber, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const exportStatement = async (accountNumber: string, format: 'csv' | 'pdf') => {
    return accountApi.exportStatement(accountNumber, format);
  };

  return {
    accounts: accountsQuery.data ?? [],
    banks: banksQuery.data ?? [],
    isLoading: accountsQuery.isLoading || (canLoadBankOptions && banksQuery.isLoading),
    isRefreshing: accountsQuery.isFetching || (canLoadBankOptions && banksQuery.isFetching),
    refetch: () => {
      void accountsQuery.refetch();
      if (canLoadBankOptions) void banksQuery.refetch();
    },
    createAccount: createAccount.mutateAsync,
    updateCompliance: updateCompliance.mutateAsync,
    exportStatement,
    dataUpdatedAt: accountsQuery.dataUpdatedAt,
  };
}