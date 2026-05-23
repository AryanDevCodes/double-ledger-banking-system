import { useQuery } from '@tanstack/react-query';
import { debitCardApi, creditCardApi, creditPlanApi, loanApi, emiApi } from '@/lib/api-client';
import type { DebitCardType, CreditCardType, LoanType, EMIType } from '@/types/cards';
import type { CreditPlanDTO } from '@/lib/api-client';

export function useDebitCards(accountNumber: string | undefined) {
  return useQuery<DebitCardType[], Error>({
    queryKey: ['debitCards', accountNumber],
    queryFn: async (): Promise<DebitCardType[]> => {
      if (!accountNumber) return [];
      return await debitCardApi.getByAccountNumber(accountNumber);
    },
    enabled: !!accountNumber,
  });
}

export function useCreditCards(accountNumber: string | undefined) {
  return useQuery<CreditCardType[], Error>({
    queryKey: ['creditCards', accountNumber],
    queryFn: async (): Promise<CreditCardType[]> => {
      if (!accountNumber) return [];
      return await creditCardApi.getByAccountNumber(accountNumber);
    },
    enabled: !!accountNumber,
  });
}

export function useCreditPlans() {
  return useQuery<CreditPlanDTO[], Error>({
    queryKey: ['creditPlans'],
    queryFn: async (): Promise<CreditPlanDTO[]> => {
      return await creditPlanApi.list();
    },
  });
}

export function useLoans(customerId: string | undefined) {
  return useQuery<LoanType[], Error>({
    queryKey: ['loans', customerId],
    queryFn: async (): Promise<LoanType[]> => {
      if (!customerId) return [];
      return await loanApi.getByCustomer(customerId);
    },
    enabled: !!customerId,
  });
}

export function useEMIs(loanId: number | undefined) {
  return useQuery<EMIType[], Error>({
    queryKey: ['emis', loanId],
    queryFn: async (): Promise<EMIType[]> => {
      if (!loanId) return [];
      return await emiApi.getByLoan(loanId);
    },
    enabled: !!loanId,
  });
}
