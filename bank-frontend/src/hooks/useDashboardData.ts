import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { bankApi, customerApi, accountApi, upiApi, transactionApi, getApiErrorMessage } from "@/lib/api-client";
import type {
  BankResponseDTO,
  CustomerResponseDTO,
  AccountResponseDTO,
  UpiProfileResponseDTO,
  TransactionResponseDTO,
} from "@/types/api";

export type DashboardScope = "all" | "self";

export type DashboardTransaction = TransactionResponseDTO & {
  transactionType?: string;
  timestamp?: string;
  id?: string | number;
  fromAccountNumber?: string;
  toAccountNumber?: string;
};

export interface DashboardData {
  banks: BankResponseDTO[];
  customers: CustomerResponseDTO[];
  accounts: AccountResponseDTO[];
  upiProfiles: UpiProfileResponseDTO[];
  transactions: DashboardTransaction[];
  loading: boolean;
  reload: () => Promise<void>;
  lastUpdated: Date | null;
}

export interface UseDashboardDataOptions {
  banks?: boolean;
  customers?: boolean;
  accounts?: boolean;
  upi?: boolean;
  transactions?: boolean;
  /** Enable real-time polling (interval in ms, default 30000) */
  realtime?: boolean | number;
  /** Callback when new data arrives */
  onDataUpdate?: (data: Partial<DashboardData>) => void;
}

/**
 * Centralized data loader used by every role-specific dashboard.
 *
 * scope = "all"  -> loads system-wide datasets (admin / manager / customer-manager / auditor)
 * scope = "self" -> loads only the signed-in customer's accounts, UPI and transactions
 *
 * Each dashboard requests only the slices it cares about via `include`.
 */
export function useDashboardData(
  scope: DashboardScope,
  include: UseDashboardDataOptions = {},
): DashboardData {
  const {
    banks: wantBanks = true,
    customers: wantCustomers = true,
    accounts: wantAccounts = true,
    upi: wantUpi = true,
    transactions: wantTransactions = true,
    realtime = false,
    onDataUpdate,
  } = include;

  const [banks, setBanks] = useState<BankResponseDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerResponseDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountResponseDTO[]>([]);
  const [upiProfiles, setUpiProfiles] = useState<UpiProfileResponseDTO[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling) setLoading(true);

      if (scope === "self") {
        const [accountsData, upiData, txnsData] = await Promise.all([
          wantAccounts ? accountApi.getMy() : Promise.resolve([] as AccountResponseDTO[]),
          wantUpi ? upiApi.getMy() : Promise.resolve([]),
          wantTransactions
            ? transactionApi.getMy().catch(() => [])
            : Promise.resolve([]),
        ]);

        setAccounts(accountsData);
        setUpiProfiles(upiData);
        setTransactions(txnsData);
        setBanks([]);
        setCustomers([]);
        
        if (onDataUpdate) {
          onDataUpdate({ accounts: accountsData, upiProfiles: upiData, transactions: txnsData });
        }
        return;
      }

      const [banksData, customersData, accountsData, upiData, txnsData] = await Promise.all([
        wantBanks ? bankApi.getAll() : Promise.resolve([]),
        wantCustomers ? customerApi.getAll() : Promise.resolve([]),
        wantAccounts ? accountApi.getAll() : Promise.resolve([]),
        wantUpi ? upiApi.getAll() : Promise.resolve([]),
        wantTransactions ? transactionApi.getAll() : Promise.resolve([]),
      ]);
      setBanks(banksData);
      setCustomers(customersData);
      setAccounts(accountsData);
      setUpiProfiles(upiData);
      setTransactions(txnsData);
      setLastUpdated(new Date());

      if (onDataUpdate) {
        onDataUpdate({
          banks: banksData,
          customers: customersData,
          accounts: accountsData,
          upiProfiles: upiData,
          transactions: txnsData,
        });
      }
    } catch (err) {
      if (!isPolling) {
        toast.error(getApiErrorMessage(err, "Failed to load dashboard data"));
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [scope, wantBanks, wantCustomers, wantAccounts, wantUpi, wantTransactions, onDataUpdate]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // Real-time polling
  useEffect(() => {
    if (realtime) {
      const interval = typeof realtime === 'number' ? realtime : 30000;
      intervalRef.current = setInterval(() => load(true), interval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [realtime, load]);

  return {
    banks,
    customers,
    accounts,
    upiProfiles,
    transactions,
    loading,
    reload: () => load(false),
    lastUpdated,
  };
}
