import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Building2, Lock, ShieldCheck, Sparkles, TrendingUp, Wallet, Workflow } from "lucide-react";
import AuroraBackdrop from "@/components/AuroraBackdrop";
import { ThemeToggle } from "@/components/ThemeToggle";
import NumberTicker from "@/components/ui/NumberTicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GradientButton from "@/components/ui/GradientButton";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";

const highlights = [
  {
    title: "KYC-first workflows",
    description: "Transfers, cards, and approvals stay aligned with verified customer status.",
    icon: BadgeCheck,
  },
  {
    title: "Audit-ready trails",
    description: "Every operational action is designed to leave a clean, reviewable record.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time treasury view",
    description: "Balance, card, and payment activity surface in a single operational console.",
    icon: TrendingUp,
  },
  {
    title: "Policy-backed roles",
    description: "Managers, auditors, and customer teams get exactly the surface they need.",
    icon: Workflow,
  },
];

const metrics = [
  { label: "Protected transfers", value: 12840, suffix: "+" },
  { label: "Compliance score", value: 99, suffix: "%" },
  { label: "Live accounts", value: 418, suffix: "+" },
  { label: "Uptime", value: 99.98, suffix: "%", decimals: 2 },
];

const operations = [
  { label: "Open account", note: "KYC gates built in", tone: "emerald" },
  { label: "Send money", note: "KYC verified parties only", tone: "amber" },
  { label: "Issue cards", note: "Manager-approved lifecycle", tone: "violet" },
  { label: "Review audit", note: "Operational evidence in one view", tone: "sky" },
];

export default function HomePage() {
  const { user } = useAuth();
  const { brandName, consoleTagline } = useBrand();

  const primaryAction = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Sign in";

  return (
    <main className="relative min-h-screen overflow-hidden bg-app">
      <AuroraBackdrop />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="layout-shell flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-lg text-foreground">{brandName}</p>
                <p className="text-xs text-muted-foreground">{consoleTagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden sm:inline-flex rounded-full px-3 py-1">
                {user ? "Authenticated" : "Guest"}
              </Badge>
              <ThemeToggle />
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to={primaryAction}>{primaryLabel}</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="layout-shell grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="rounded-full border border-border bg-card px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                Banking control surface
              </Badge>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  A cleaner command center for banking operations, compliance, and transfers.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {brandName} gives staff one place to open accounts, issue cards, move money, and
                  review policy-backed events without losing operational context.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <GradientButton size="lg" className="min-w-44" onClick={() => window.location.assign(primaryAction)}>
                {primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
              <Button asChild size="lg" variant="outline" className="min-w-44">
                <Link to="/dashboard">View dashboard</Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <Card key={metric.label} className="bg-card/90">
                  <CardContent className="p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{metric.label}</p>
                    <div className="mt-3 text-3xl font-semibold text-foreground">
                      <NumberTicker
                        value={metric.value}
                        decimals={metric.decimals ?? 0}
                        suffix={metric.suffix}
                        className="font-display text-3xl text-foreground"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden border-border bg-card shadow-[var(--shadow-lg)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--chart-1)/0.12),transparent_28%),radial-gradient(circle_at_bottom_left,hsl(var(--chart-6)/0.10),transparent_32%)]" />
            <CardHeader className="relative space-y-2">
              <CardDescription className="uppercase tracking-[0.24em]">Operational snapshot</CardDescription>
              <CardTitle className="font-display text-3xl">Structured, visible, and fast.</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {operations.map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm backdrop-blur-sm",
                      item.tone === "emerald" && "border-success/20 bg-success/10",
                      item.tone === "amber" && "border-warning/20 bg-warning/10",
                      item.tone === "violet" && "border-primary/20 bg-primary/10",
                      item.tone === "sky" && "border-info/20 bg-info/10",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/70 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Current posture</p>
                    <p className="text-xs text-muted-foreground">Policy-aware access and transfer guardrails</p>
                  </div>
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  Transactions require verified KYC on both sides
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-info" />
                  Card approvals and plan assignments stay role-scoped
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="layout-shell pb-16">
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Why it works</p>
            <h2 className="font-display text-3xl text-foreground sm:text-4xl">
              Everything your operations team needs, without clutter.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="bg-card/90 transition-transform duration-200 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/70">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-6">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}