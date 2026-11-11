import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { getDashboardRoute } from "@/lib/rbac";

const movements = [
  { title: "Transfer received", detail: "Today · Account activity", direction: "Credit" },
  { title: "Card payment", detail: "Yesterday · Card activity", direction: "Debit" },
  { title: "Scheduled transfer", detail: "Upcoming · Payments", direction: "Scheduled" },
];

const capabilities = [
  {
    number: "01",
    title: "Accounts",
    description: "Balances and account activity, arranged for a quick read.",
  },
  {
    number: "02",
    title: "Payments",
    description: "Transfer details and confirmations kept together.",
  },
  {
    number: "03",
    title: "Operations",
    description: "Role-based access for customers and bank teams.",
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { brandName, consoleTagline } = useBrand();
  const primaryAction = user ? getDashboardRoute(user.roles) : "/login";
  const primaryLabel = user ? "Open workspace" : "Sign in";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="layout-shell flex min-h-[72px] items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label={`${brandName} home`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-display text-xl leading-none text-foreground">{brandName}</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">{consoleTagline}</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden border-r border-border pr-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:inline">
              Secure workspace
            </span>
            <ThemeToggle />
            <Button asChild size="sm" className="ml-1 rounded-md px-4">
              <Link to={primaryAction}>{primaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="layout-shell grid gap-12 py-14 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Banking, made legible
          </p>
          <h1 className="max-w-xl font-display text-5xl font-normal leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Banking, kept in good order.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
            A secure place to follow your accounts, make payments, and understand the details behind every movement.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-md px-6">
              <Link to={primaryAction}>{primaryLabel}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-md px-6">
              <a href="#capabilities">Explore the workspace</a>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 sm:gap-8">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Access with purpose</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Workspace tools follow your banking role.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">Records stay in scope</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Account access respects ownership.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="overflow-hidden border border-border bg-card shadow-sm" aria-label="Illustrative account activity preview">
          <div className="flex items-center justify-between gap-4 bg-foreground px-5 py-4 text-background sm:px-7">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-background/65">
                {brandName} · Sample view
              </p>
              <h2 className="mt-1 font-display text-2xl font-normal">Account activity</h2>
            </div>
            <span className="hidden h-9 w-9 items-center justify-center border border-background/25 sm:flex">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-end justify-between border-b border-border pb-5">
              <div>
                <p className="text-xs text-muted-foreground">Available balance</p>
                <p className="mt-1 font-display text-3xl tracking-tight">₹ ••••••</p>
              </div>
              <span className="text-right text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Everyday
                <br />
                account
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span>Recent movements</span>
                <span>Illustration</span>
              </div>
              <div className="divide-y divide-border">
                {movements.map((movement) => {
                  const isCredit = movement.direction === "Credit";
                  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <div key={movement.title} className="flex items-center gap-3 py-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-border text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{movement.title}</span>
                        <span className="mt-1 block truncate text-xs text-muted-foreground">{movement.detail}</span>
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        {movement.direction}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 border-t border-border pt-4 text-[11px] leading-5 text-muted-foreground">
              Example layout only. No account data is displayed.
            </p>
          </div>
        </aside>
      </section>

      <section id="capabilities" className="scroll-mt-24 border-y border-border bg-card/60">
        <div className="layout-shell py-12 sm:py-16">
          <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_0.8fr] sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">At a glance</p>
              <h2 className="mt-2 font-display text-3xl font-normal sm:text-4xl">A workspace for the work of banking.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground sm:justify-self-end">
              Clear paths for everyday account activity and the teams responsible for keeping it in order.
            </p>
          </div>

          <div className="grid border-t border-border md:grid-cols-3">
            {capabilities.map((item) => (
              <article key={item.number} className="border-b border-border py-5 md:border-b-0 md:px-6 md:py-6 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l">
                <p className="font-mono text-xs text-primary">{item.number}</p>
                <h3 className="mt-3 font-display text-2xl font-medium">{item.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="layout-shell flex flex-col gap-3 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{brandName}</span>
        <span>Secure access · Account ownership · Clear records</span>
      </footer>
    </main>
  );
}
