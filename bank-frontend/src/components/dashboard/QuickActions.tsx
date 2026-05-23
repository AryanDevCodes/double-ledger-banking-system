import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export interface QuickAction {
  to: string;
  label: string;
  icon: ReactNode;
  description?: string;
}

interface Props {
  title?: string;
  actions: QuickAction[];
  className?: string;
}

export default function QuickActions({ title = "Quick Actions", actions, className }: Props) {
  if (!actions.length) return null;
  return (
    <div className={`glass-panel rounded-2xl p-5 ${className || ""}`}>
      <h3 className="text-sm font-semibold mb-3 text-[var(--ink-primary)]">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <Button
            key={a.to}
            asChild
            variant="outline"
            className="justify-start h-auto py-3 px-3.5 text-left"
          >
            <Link to={a.to} className="flex items-start gap-3 w-full">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/25">
                {a.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold truncate">{a.label}</span>
                {a.description ? (
                  <span className="block text-xs text-muted-foreground whitespace-normal">{a.description}</span>
                ) : null}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
