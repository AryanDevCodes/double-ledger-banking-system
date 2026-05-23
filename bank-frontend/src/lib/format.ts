import { type Status } from "@/types/api";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string, includeTime: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  
  return new Date(dateStr).toLocaleDateString("en-IN", options);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(dateStr);
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusClass(status: Status): string {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
    case "SUCCESS":
      return "status-completed";
    case "FAILED":
    case "CLOSED":
      return "status-failed";
    case "REVERSED":
      return "status-reversed";
    case "PENDING":
    case "INITIATED":
      return "status-pending";
    case "PROCESSING":
      return "status-processing";
    case "INACTIVE":
      return "status-pending";
    default:
      return "";
  }
}
