import { cn } from "@/lib/utils";
import {
  FileX,
  Users,
  CreditCard,
  ArrowLeftRight,
  Smartphone,
  Building2,
  Search,
  Plus,
  AlertCircle,
} from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import type { ReactNode } from "react";

type EmptyStateType = "banks" | "customers" | "accounts" | "transactions" | "upi" | "search" | "error" | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  icon?: ReactNode;
}

const defaultContent: Record<EmptyStateType, { icon: typeof FileX; title: string; description: string; tint: string }> = {
  banks: {
    icon: Building2,
    title: "No banks registered",
    description: "Get started by adding your first bank to the system.",
    tint: "from-sky-500/20 to-sky-500/5",
  },
  customers: {
    icon: Users,
    title: "No customers found",
    description: "Add customers to start managing their accounts and transactions.",
    tint: "from-violet-500/20 to-violet-500/5",
  },
  accounts: {
    icon: CreditCard,
    title: "No accounts available",
    description: "Create an account for a customer to begin banking operations.",
    tint: "from-emerald-500/20 to-emerald-500/5",
  },
  transactions: {
    icon: ArrowLeftRight,
    title: "No transactions yet",
    description: "Transactions will appear here once accounts start transacting.",
    tint: "from-indigo-500/20 to-indigo-500/5",
  },
  upi: {
    icon: Smartphone,
    title: "No UPI profiles",
    description: "Register UPI IDs for customers to enable instant payments.",
    tint: "from-amber-500/20 to-amber-500/5",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search terms or filters.",
    tint: "from-slate-500/15 to-slate-500/5",
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We encountered an error loading this data. Please try again.",
    tint: "from-red-500/20 to-red-500/5",
  },
  generic: {
    icon: FileX,
    title: "No data available",
    description: "There's nothing to display at the moment.",
    tint: "from-slate-500/15 to-slate-500/5",
  },
};

export default function EmptyState({
  type = "generic",
  title,
  description,
  action,
  className,
  icon,
}: EmptyStateProps) {
  const content = defaultContent[type];
  const Icon = content.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-14 px-6 text-center",
        "glass-panel rounded-2xl",
        className,
      )}
    >
      {/* Illustrated backdrop circle */}
      <div
        className={cn(
          "mb-5 flex h-20 w-20 items-center justify-center rounded-2xl",
          "bg-gradient-to-br border border-[var(--glass-border)] shadow-glass",
          content.tint,
        )}
      >
        {icon || <Icon className="h-9 w-9 text-[var(--ink-muted)]" />}
      </div>

      <h3 className="text-base font-semibold text-[var(--ink-primary)] mb-1">
        {title || content.title}
      </h3>

      <p className="text-sm text-[var(--ink-muted)] max-w-xs mb-7 leading-relaxed">
        {description || content.description}
      </p>

      {action && (
        <GradientButton onClick={action.onClick} size="md">
          <Plus className="h-4 w-4" />
          {action.label}
        </GradientButton>
      )}
    </div>
  );
}
