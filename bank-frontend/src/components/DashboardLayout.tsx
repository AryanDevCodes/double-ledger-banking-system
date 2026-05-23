import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { getDashboardRoute, getVisibleNavItems } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppSidebar from "@/components/AppSidebar";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import AuroraBackdrop from "@/components/AuroraBackdrop";
import KbdHint from "@/components/ui/KbdHint";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, User, LogOut, Menu, ChevronDown, Bell, Search, X, CircleCheck, AlertTriangle, Info, Command, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getDisabledFeatureModules } from "@/lib/features";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { brandName, consoleTagline, setBrandName, setConsoleTagline, resetBrand } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sb.sidebar.collapsed") !== "false";
  });
  const [moduleSearch, setModuleSearch] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [draftBrandName, setDraftBrandName] = useState(brandName);
  const [draftConsoleTagline, setDraftConsoleTagline] = useState(consoleTagline);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const visibleNavItems = user ? getVisibleNavItems(user.roles) : [];
  const disabledModules = getDisabledFeatureModules();
  const dashboardPath = user ? getDashboardRoute(user.roles) : "/dashboard";
  const userInitials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; to: string }[] = [{ label: "Home", to: dashboardPath }];
    const matched = visibleNavItems.find((item) => {
      const to = item.path === "/dashboard" ? dashboardPath : item.path;
      return location.pathname === to || (item.path !== "/dashboard" && location.pathname.startsWith(to));
    });
    if (matched && matched.path !== "/dashboard") {
      crumbs.push({ label: matched.label, to: matched.path });
    }
    return crumbs;
  }, [location.pathname, visibleNavItems, dashboardPath]);

  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];

  const searchMatches = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return [] as Array<{ label: string; to: string }>;

    return visibleNavItems
      .map((item) => ({
        label: item.label,
        to: item.path === "/dashboard" ? dashboardPath : item.path,
      }))
      .filter((item) => item.label.toLowerCase().includes(q) || item.to.toLowerCase().includes(q))
      .slice(0, 5);
  }, [moduleSearch, visibleNavItems, dashboardPath]);

  const commandNavItems = useMemo(
    () =>
      visibleNavItems.map((item) => ({
        ...item,
        to: item.path === "/dashboard" ? dashboardPath : item.path,
      })),
    [visibleNavItems, dashboardPath],
  );

  const notifications = useMemo(
    () => [
      { id: "n1", title: "Daily reconciliation completed", tone: "success" as const, time: "2m ago" },
      { id: "n2", title: "2 failed transfer attempts detected", tone: "warning" as const, time: "18m ago" },
      { id: "n3", title: "System health check passed", tone: "info" as const, time: "1h ago" },
    ],
    []
  );
  const unreadCount = notifications.length;

  useEffect(() => {
    if (brandingOpen) {
      setDraftBrandName(brandName);
      setDraftConsoleTagline(consoleTagline);
    }
  }, [brandingOpen, brandName, consoleTagline]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sb.sidebar.collapsed", String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (!isTypingTarget && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isTypingTarget && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleModuleSearch = () => {
    const value = moduleSearch.trim();
    if (!value) {
      toast.info("Type a module name to search");
      return;
    }

    const firstMatch = searchMatches[0];
    if (!firstMatch) {
      toast.error("No matching module found");
      return;
    }

    navigate(firstMatch.to);
    setModuleSearch("");
  };

  return (
    <div className="h-screen overflow-hidden text-foreground flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Aurora animated background */}
      <AuroraBackdrop />

      {/* Sidebar spacer — width mirrors the fixed sidebar; height fills viewport */}
      <div
        className={cn(
          "hidden md:block shrink-0 h-full transition-all duration-300",
          sidebarCollapsed ? "w-[84px]" : "w-[260px]",
        )}
      >
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Main content — only this column scrolls */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col min-w-0">
        {/* Masthead bar */}
        <header className="sticky top-0 z-40 px-3 pt-4 pb-3">
          <div className="tower-strip mx-auto max-w-[980px] flex items-center justify-between gap-3">
            {/* Left: hamburger + current section */}
            <div className="flex items-center gap-3 min-w-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 rounded-xl" aria-label="Open navigation menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-0 bg-transparent shadow-none">
                  <div className="h-full glass-panel rounded-r-2xl flex flex-col border-l-0">
                    <div className="h-14 px-4 border-b border-[var(--glass-border)] flex items-center gap-2 shrink-0">
                      <Building2 className="h-5 w-5 text-[var(--accent-primary)] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{brandName}</p>
                        <p className="text-[11px] text-[var(--ink-muted)] truncate">{consoleTagline}</p>
                      </div>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                      {visibleNavItems.map((item, index) => {
                        const Icon = item.icon;
                        const to = item.path === "/dashboard" ? dashboardPath : item.path;
                        const isActive = location.pathname === to;
                        return (
                          <Link
                            key={`${item.path}-${index}`}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                              isActive
                                ? "bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]"
                                : "text-[var(--ink-muted)] hover:bg-white/30 dark:hover:bg-white/5 hover:text-[var(--ink-primary)]",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <div className="hidden sm:flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</span>
                <span className="font-display text-sm sm:text-base text-foreground truncate">
                  {currentCrumb?.label}
                </span>
              </div>
            </div>

            {/* Center: search */}
            <div className="hidden lg:flex items-center relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-muted)] pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Search modules…"
                className="h-9 pl-9 pr-8 rounded-xl bg-card/70 border-border/70 text-sm placeholder:text-muted-foreground focus-visible:ring-[var(--accent-primary)]/40"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleModuleSearch(); }
                  if (e.key === "Escape") { setModuleSearch(""); e.currentTarget.blur(); }
                }}
                aria-label="Search modules"
              />
              {moduleSearch && (
                <Button variant="ghost" size="icon" className="absolute right-1 h-7 w-7 rounded-lg" onClick={() => setModuleSearch("")} aria-label="Clear">
                  <X className="h-3 w-3" />
                </Button>
              )}
              {!!moduleSearch && (
                <div className="absolute top-11 left-0 right-0 z-50 glass-panel rounded-xl overflow-hidden shadow-glass">
                  {searchMatches.length > 0
                    ? searchMatches.map((m) => (
                        <button key={m.to} className="w-full px-3 py-2.5 text-left text-sm hover:bg-white/30 dark:hover:bg-white/5 transition-colors text-[var(--ink-primary)]" onClick={() => { navigate(m.to); setModuleSearch(""); }}>
                          {m.label}
                        </button>
                      ))
                    : <p className="px-3 py-2.5 text-xs text-[var(--ink-muted)]">No matching modules</p>
                  }
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1">
              {disabledModules.length > 0 && (
                <Badge variant="secondary" className="hidden md:inline-flex rounded-full text-xs">
                  {disabledModules.length} offline
                </Badge>
              )}
              {/* Ctrl+K pill */}
              <Button
                type="button" variant="ghost" size="sm"
                className="hidden lg:inline-flex h-8 rounded-xl gap-1.5 text-xs text-[var(--ink-muted)] border border-[var(--glass-border)] bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command palette (Ctrl+K)"
              >
                <Command className="h-3 w-3" />
                <span>Palette</span>
                <KbdHint keys={["Ctrl", "K"]} className="ml-0.5" />
              </Button>

              <ThemeToggle className="h-8 w-8 rounded-xl" />

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative rounded-xl" aria-label="View notifications">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 glass-panel rounded-2xl border-[var(--glass-border)] p-0 shadow-glass overflow-hidden">
                  <DropdownMenuLabel className="flex items-center justify-between px-4 pt-3 pb-2">
                    <span className="font-semibold">Notifications</span>
                    <span className="text-xs font-normal text-[var(--ink-muted)]">{unreadCount} new</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--glass-border)] mx-0" />
                  {notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="items-start gap-2.5 px-4 py-3 hover:bg-white/20 dark:hover:bg-white/5 cursor-pointer">
                      {n.tone === "success" ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        : n.tone === "warning" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        : <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />}
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{n.title}</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-0.5">{n.time}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 rounded-full pl-1 pr-2 gap-1 hover:bg-white/20 dark:hover:bg-white/5">
                    <Avatar className="h-6 w-6 border border-[var(--accent-primary)]/40">
                      {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user?.fullName || user?.username || "User"} /> : null}
                      <AvatarFallback className="bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] text-[10px] font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-[var(--ink-muted)] hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel rounded-2xl border-[var(--glass-border)] p-0 shadow-glass overflow-hidden">
                  <DropdownMenuLabel className="px-4 pt-3 pb-2">
                    <p className="font-semibold">{user?.fullName || user?.username}</p>
                    <p className="text-xs font-normal text-[var(--ink-muted)]">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--glass-border)] mx-0" />
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="px-4 py-2.5 hover:bg-white/20 dark:hover:bg-white/5 cursor-pointer">
                    <User className="mr-2 h-4 w-4" /><span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBrandingOpen(true)} className="px-4 py-2.5 hover:bg-white/20 dark:hover:bg-white/5 cursor-pointer">
                    <span>Customize brand</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--glass-border)] mx-0" />
                  <DropdownMenuItem onClick={handleLogout} className="px-4 py-2.5 text-red-500 focus:text-red-500 hover:bg-red-500/10 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 page-transition" tabIndex={-1}>
          <div className="px-4 py-4 md:py-6 max-w-[1200px] mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/70 py-4 px-4">
          <p className="text-center text-xs text-muted-foreground">© 2026 {brandName}. Enterprise Banking Platform.</p>
        </footer>
      </div>

      {/* Brand customization dialog */}
      <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize UI brand</DialogTitle>
            <DialogDescription>Update branding text across the UI in real time.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Brand name</label>
              <Input
                value={draftBrandName}
                onChange={(e) => { const v = e.target.value; setDraftBrandName(v); setBrandName(v); }}
                placeholder="Enter brand name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Console tagline</label>
              <Input
                value={draftConsoleTagline}
                onChange={(e) => { const v = e.target.value; setDraftConsoleTagline(v); setConsoleTagline(v); }}
                placeholder="Enter tagline"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetBrand(); setDraftBrandName("SecureBank"); setDraftConsoleTagline("Enterprise Console"); }}>
              Reset defaults
            </Button>
            <Button onClick={() => setBrandingOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GlobalCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        navItems={commandNavItems}
        onNavigate={(to) => navigate(to)}
        onOpenBranding={() => setBrandingOpen(true)}
        onLogout={handleLogout}
        disabledModules={disabledModules}
      />
    </div>
  );
}
