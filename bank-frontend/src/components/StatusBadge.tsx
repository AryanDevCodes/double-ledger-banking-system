import { forwardRef } from "react";
import type { Status } from "@/types/api";
import { getStatusClass } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    return (
      <span ref={ref} className={cn("status-badge", getStatusClass(status), className)}>
        {status}
      </span>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
