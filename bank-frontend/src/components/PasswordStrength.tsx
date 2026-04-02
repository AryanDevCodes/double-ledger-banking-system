import { cn } from "@/lib/utils";

const getStrengthScore = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
};

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"] as const;

export function PasswordStrength({ password, className }: { password: string; className?: string }) {
  const score = getStrengthScore(password);
  const label = LABELS[score];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted",
              idx < score && score <= 1 && "bg-destructive",
              idx < score && score === 2 && "bg-warning",
              idx < score && score === 3 && "bg-info",
              idx < score && score >= 4 && "bg-success",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}
