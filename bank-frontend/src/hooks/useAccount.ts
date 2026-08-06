// hooks/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { accountApi, bankApi } from '@/lib/api-client';
import type { AccountResponseDTO, BankResponseDTO } from '@/types/api';

export function useAccounts() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery<AccountResponseDTO[]>({
    queryKey: ['accounts', location.key],
    queryFn: accountApi.getAll,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const banksQuery = useQuery<BankResponseDTO[]>({
    queryKey: ['banks', location.key],
    queryFn: bankApi.getAll,
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
    isLoading: accountsQuery.isLoading || banksQuery.isLoading,
    isRefreshing: accountsQuery.isFetching || banksQuery.isFetching,
    refetch: () => {
      accountsQuery.refetch();
      banksQuery.refetch();
    },
    createAccount: createAccount.mutateAsync,
    updateCompliance: updateCompliance.mutateAsync,
    exportStatement,
    dataUpdatedAt: accountsQuery.dataUpdatedAt,
  };
}