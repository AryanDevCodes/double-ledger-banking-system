// hooks/useTransactions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { transactionApi, accountApi } from '@/lib/api-client';

export function useTransactions() {
  const location = useLocation();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['transactions', location.key], // ← key includes route change
    queryFn: transactionApi.getAll,
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', location.key],
    queryFn: accountApi.getAll,
  });

  const createTransaction = useMutation({
    mutationFn: transactionApi.create,
    onSuccess: () => {
      // Invalidate both queries so they refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const reverseTransaction = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      transactionApi.reverse(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    accounts: accountsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading || accountsQuery.isLoading,
    isRefreshing: transactionsQuery.isFetching,
    refetch: () => {
      transactionsQuery.refetch();
      accountsQuery.refetch();
    },
    createTransaction: createTransaction.mutateAsync,
    reverseTransaction: reverseTransaction.mutateAsync,
    isCreating: createTransaction.isPending,
    isReversing: reverseTransaction.isPending,
  };
}