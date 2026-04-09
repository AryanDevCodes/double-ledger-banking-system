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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type EmptyStateType = "banks" | "customers" | "accounts" | "transactions" | "upi" | "search" | "error" | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  icon?: ReactNode;
}

const defaultContent: Record<EmptyStateType, { icon: typeof FileX; title: string; description: string }> = {
  banks: {
    icon: Building2,
    title: "No banks registered",
    description: "Get started by adding your first bank to the system.",
  },
  customers: {
    icon: Users,
    title: "No customers found",
    description: "Add customers to start managing their accounts and transactions.",
  },
  accounts: {
    icon: CreditCard,
    title: "No accounts available",
    description: "Create an account for a customer to begin banking operations.",
  },
  transactions: {
    icon: ArrowLeftRight,
    title: "No transactions yet",
    description: "Transactions will appear here once accounts start transacting.",
  },
  upi: {
    icon: Smartphone,
    title: "No UPI profiles",
    description: "Register UPI IDs for customers to enable instant payments.",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search terms or filters.",
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "We encountered an error loading this data. Please try again.",
  },
  generic: {
    icon: FileX,
    title: "No data available",
    description: "There's nothing to display at the moment.",
  },
};

export default function EmptyState({ 
  type = "generic", 
  title, 
  description, 
  action,
  className,
  icon
}: EmptyStateProps) {
  const content = defaultContent[type];
  const Icon = content.icon;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-border/60 bg-muted/20",
      className
    )}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-md">
        {icon || <Icon className="h-8 w-8 text-muted-foreground" />}
      </div>
      
      <h3 className="text-lg font-semibold mb-1">
        {title || content.title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description || content.description}
      </p>

      {action && (
        <Button onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
