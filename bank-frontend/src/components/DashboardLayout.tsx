import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { getDashboardRoute, getVisibleNavItems } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AppSidebar from "@/components/AppSidebar";
import NotificationCenter from "@/components/NotificationCenter";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import KbdHint from "@/components/ui/KbdHint";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Building2,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Search,
  X,
  Command,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDisabledFeatureModules } from "@/lib/features";

/* ───────────────────────────────────────────
   Dashboard Layout v2.0
   Glassmorphic masthead, command palette,
   global search, notification center, and
   real-time brand customization.
   ─────────────────────────────────────────── */

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
  const [searchFocused, setSearchFocused] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const visibleNavItems = user ? getVisibleNavItems(user.roles) : [];
  const disabledModules = getDisabledFeatureModules();
  const dashboardPath = user ? getDashboardRoute(user.roles) : "/dashboard";

  const userInitials = useMemo(
    () =>
      user?.fullName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ||
      user?.username?.substring(0, 2).toUpperCase() ||
      "U",
    [user]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; to: string }[] = [
      { label: "Home", to: dashboardPath },
    ];
    const matched = visibleNavItems.find((item) => {
      const to = item.path === "/dashboard" ? dashboardPath : item.path;
      return (
        location.pathname === to ||
        (item.path !== "/dashboard" && location.pathname.startsWith(to))
      );
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
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.to.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [moduleSearch, visibleNavItems, dashboardPath]);

  const commandNavItems = useMemo(
    () =>
      visibleNavItems.map((item) => ({
        ...item,
        to: item.path === "/dashboard" ? dashboardPath : item.path,
      })),
    [visibleNavItems, dashboardPath]
  );

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
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (!isTyping && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!searchContainerRef.current?.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleModuleSearch = () => {
    const value = moduleSearch.trim();
    if (!value) {
      toast.info("Type a module name to search");
      return;
    }
    const first = searchMatches[0];
    if (!first) {
      toast.error("No matching module found");
      return;
    }
    navigate(first.to);
    setModuleSearch("");
    setSearchFocused(false);
  };

  return (
    <div className="h-screen overflow-hidden text-foreground flex bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2 focus:ring-primary/50"
      >
        Skip to main content
      </a>

      {/* Sidebar spacer */}
      <div
        className={cn(
          "hidden md:block shrink-0 h-full transition-all duration-300",
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 h-full overflow-y-auto flex flex-col min-w-0">
        {/* Masthead */}
        <header className="sticky top-0 z-40 border-b border-border bg-background px-3 py-2">
          <div className="mx-auto max-w-[1480px] flex items-center justify-between gap-3">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9 rounded-xl"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[280px] p-0 border-0 bg-transparent shadow-none"
                >
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Navigate to the sections available for your account.
                  </SheetDescription>
                  <div className="h-full flex flex-col border-r border-border bg-card shadow-sm">
                    <div className="h-14 px-4 border-b border-border flex items-center gap-2 shrink-0">
                      <Building2 className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{brandName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {consoleTagline}
                        </p>
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
                              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-medium">
                  Section
                </span>
                <span className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {currentCrumb?.label}
                </span>
              </div>
            </div>

            {/* Center: Search */}
            <div ref={searchContainerRef} className="hidden lg:flex items-center relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Search modules…"
                className={cn(
                  "h-9 pl-9 pr-8 rounded-md bg-card border-border text-sm transition-colors duration-150",
                  "placeholder:text-muted-foreground/50",
                  "focus-visible:ring-primary/30 focus-visible:bg-card focus-visible:border-primary/40",
                  searchFocused && "bg-card border-primary/40"
                )}
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleModuleSearch();
                  }
                  if (e.key === "Escape") {
                    setModuleSearch("");
                    setSearchFocused(false);
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Search modules"
              />
              {moduleSearch ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg text-muted-foreground/50 hover:text-foreground"
                  onClick={() => {
                    setModuleSearch("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              ) : (
                <KbdHint keys={["/"]} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40" />
              )}

              {/* Search dropdown */}
              {searchFocused && moduleSearch.trim() && (
                <div className="absolute top-11 left-0 right-0 z-50 rounded-md overflow-hidden border border-border bg-card shadow-md animate-in fade-in zoom-in-95 duration-150">
                  {searchMatches.length > 0 ? (
                    searchMatches.map((m) => (
                      <button
                        key={m.to}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 text-foreground"
                        onClick={() => {
                          navigate(m.to);
                          setModuleSearch("");
                          setSearchFocused(false);
                        }}
                      >
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                        {m.label}
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-xs text-muted-foreground">
                      No matching modules
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {disabledModules.length > 0 && (
                <Badge
                  variant="secondary"
                  className="hidden md:inline-flex rounded-full text-[10px] font-medium px-2 py-0.5"
                >
                  {disabledModules.length} offline
                </Badge>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex h-8 rounded-md gap-1.5 text-xs text-muted-foreground border border-border bg-card hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => setCommandOpen(true)}
                aria-label="Open command palette"
              >
                <Command className="h-3 w-3" />
                <span>Palette</span>
                <KbdHint keys={["Ctrl", "K"]} className="ml-0.5" />
              </Button>

              <ThemeToggle className="h-8 w-8 rounded-md" />

              <NotificationCenter />

              {/* User */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 rounded-md pl-1 pr-2 gap-1.5 hover:bg-muted/50"
                  >
                    <Avatar className="h-6 w-6 border border-primary/30">
                      {user?.avatarUrl ? (
                        <AvatarImage
                          src={user.avatarUrl}
                          alt={user?.fullName || user?.username || "User"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-muted-foreground/50 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-md border-border bg-card shadow-md overflow-hidden p-0"
                >
                  <DropdownMenuLabel className="px-4 pt-3 pb-2">
                    <p className="font-semibold text-sm">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50 mx-0" />
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="px-4 py-2.5 hover:bg-muted/50 cursor-pointer focus:bg-muted/50"
                  >
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setBrandingOpen(true)}
                    className="px-4 py-2.5 hover:bg-muted/50 cursor-pointer focus:bg-muted/50"
                  >
                    <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Customize brand</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 mx-0" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="px-4 py-2.5 text-destructive focus:text-destructive hover:bg-destructive/10 cursor-pointer focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page */}
        <main id="main-content" className="flex-1 page-transition" tabIndex={-1}>
          <div className="px-4 py-4 md:px-6 md:py-6 max-w-[1480px] mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-3 px-4 mt-auto">
          <p className="text-center text-[11px] text-muted-foreground/60">
            © {new Date().getFullYear()} {brandName}. Enterprise Banking Platform.
          </p>
        </footer>
      </div>

      {/* Brand Dialog */}
      <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Customize UI Brand</DialogTitle>
            <DialogDescription>
              Update branding text across the UI in real time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Brand name</label>
              <Input
                value={draftBrandName}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftBrandName(v);
                  setBrandName(v);
                }}
                placeholder="Enter brand name"
                className="rounded-md"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Console tagline</label>
              <Input
                value={draftConsoleTagline}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraftConsoleTagline(v);
                  setConsoleTagline(v);
                }}
                placeholder="Enter tagline"
                className="rounded-md"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetBrand();
                setDraftBrandName("SecureBank");
                setDraftConsoleTagline("Enterprise Console");
              }}
              className="rounded-md"
            >
              Reset defaults
            </Button>
            <Button onClick={() => setBrandingOpen(false)} className="rounded-md">
              Done
            </Button>
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