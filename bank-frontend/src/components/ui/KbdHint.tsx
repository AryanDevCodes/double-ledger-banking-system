import { cn } from "@/lib/utils";

interface KbdHintProps {
  keys: string[];
  className?: string;
}

export default function KbdHint({ keys, className }: KbdHintProps) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded border px-1",
            "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[10px] font-medium",
            "text-[var(--ink-muted)] shadow-[0_1px_0_var(--glass-border)]",
            "font-mono tracking-tight",
          )}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
