import type { TransactionResponseDTO } from "@/types/api";

export interface DashboardTrendPoint {
  label: string;
  value: number;
}

export function buildMonthlyTransactionTrend(
  transactions: readonly TransactionResponseDTO[],
  options: {
    accountNumbers?: ReadonlySet<string>;
    direction?: "sent" | "received" | "all";
    metric?: "amount" | "count";
  } = {},
): DashboardTrendPoint[] {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString(undefined, { month: "short" }),
      value: 0,
    };
  });

  for (const transaction of transactions) {
    const date = new Date(transaction.transactionDate);
    if (Number.isNaN(date.getTime())) continue;

    if (options.accountNumbers) {
      const isSent = options.accountNumbers.has(transaction.senderAccountNumber);
      const isReceived = options.accountNumbers.has(transaction.receiverAccountNumber);
      if (options.direction === "sent" && !isSent) continue;
      if (options.direction === "received" && !isReceived) continue;
      if (!options.direction && !isSent && !isReceived) continue;
    }

    const month = months.find((item) => item.year === date.getFullYear() && item.month === date.getMonth());
    if (month) month.value += options.metric === "count" ? 1 : transaction.amount || 0;
  }

  return months.map(({ label, value }) => ({ label, value: Math.round(value * 100) / 100 }));
}

export function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
