import { CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CreditCardApplicationPanelProps {
  isApprover: boolean;
  isRequester: boolean;
}

export default function CreditCardApplicationPanel({
  isApprover,
  isRequester,
}: CreditCardApplicationPanelProps) {
  const description = isRequester
    ? "Credit card applications are not available in this workspace yet. Your existing cards and plans appear under Credit Cards."
    : isApprover
      ? "This workspace supports debit card requests, but does not yet have a credit card application review workflow."
      : "No credit card application workflow is currently available for this account.";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-primary">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <CardTitle>Credit card applications</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          role="status"
          className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center"
        >
          <p className="text-sm font-medium text-foreground">
            Applications are not enabled
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            No application actions are available right now.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
