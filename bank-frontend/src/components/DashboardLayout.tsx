import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { getDashboardRoute, getVisibleNavItems } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppSidebar from "@/components/AppSidebar";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, User, LogOut, Menu, ChevronDown, Bell, Search, X, CircleCheck, AlertTriangle, Info } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { brandName, consoleTagline, setBrandName, setConsoleTagline, resetBrand } = useBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sb.sidebar.collapsed") === "true";
  });
  const [moduleSearch, setModuleSearch] = useState("");
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [draftBrandName, setDraftBrandName] = useState(brandName);
  const [draftConsoleTagline, setDraftConsoleTagline] = useState(consoleTagline);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const visibleNavItems = user ? getVisibleNavItems(user.roles) : [];
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

  const currentPageLabel =
    visibleNavItems.find((item) => {
      const to = item.path === "/dashboard" ? dashboardPath : item.path;
      return location.pathname === to;
    })?.label || "Dashboard";

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
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
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
    <div className="min-h-screen bg-background text-foreground bg-app">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-md"
      >
        Skip to main content
      </a>

      <div className="hidden md:block">
        <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      <div className={cn("min-h-screen flex flex-col transition-all duration-300", sidebarCollapsed ? "md:pl-[68px]" : "md:pl-[240px]")}>
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/65 backdrop-blur-xl supports-[backdrop-filter]:bg-background/45">
          <div className="h-14 px-4 lg:px-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden h-8 w-8" aria-label="Open navigation menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-r border-border/60 bg-sidebar/95 backdrop-blur-xl">
                  <div className="h-14 px-4 border-b border-border/60 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{brandName}</p>
                      <p className="text-[11px] text-muted-foreground">{consoleTagline}</p>
                    </div>
                  </div>
                  <nav className="p-3 space-y-1">
                    {visibleNavItems.map((item) => {
                      const Icon = item.icon;
                      const to = item.path === "/dashboard" ? dashboardPath : item.path;
                      const isActive = location.pathname === to;
                      return (
                        <Link
                          key={item.path}
                          to={to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm",
                            isActive
                              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="hidden sm:block min-w-0">
                <p className="text-xs text-muted-foreground">Workspace</p>
                <p className="text-sm font-semibold truncate">{currentPageLabel}</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search modules..."
                className="h-9 pl-9 pr-16 rounded-xl bg-card/70"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleModuleSearch();
                  }
                  if (e.key === "Escape") {
                    setModuleSearch("");
                    e.currentTarget.blur();
                  }
                }}
                aria-label="Search modules"
              />
              {moduleSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-7 h-6 w-6"
                  onClick={() => setModuleSearch("")}
                  aria-label="Clear module search"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 h-6 w-6"
                onClick={handleModuleSearch}
                aria-label="Submit module search"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>

              {!!moduleSearch && (
                <div className="absolute top-11 left-0 right-0 z-50 rounded-xl border border-border/70 bg-popover/95 backdrop-blur-xl shadow-xl">
                  {searchMatches.length > 0 ? (
                    <div className="py-1">
                      {searchMatches.map((match) => (
                        <button
                          key={match.to}
                          className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/70"
                          onClick={() => {
                            navigate(match.to);
                            setModuleSearch("");
                          }}
                        >
                          {match.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No matching modules</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle withLabel className="hidden sm:inline-flex" />
              <ThemeToggle className="sm:hidden" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 relative rounded-xl"
                    aria-label="View notifications"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] leading-none">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-xl border-border/70 bg-popover/95 backdrop-blur-xl">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <span className="text-xs font-normal text-muted-foreground">{unreadCount} new</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="items-start gap-2.5 py-2.5">
                      {n.tone === "success" ? (
                        <CircleCheck className="mt-0.5 h-4 w-4 text-emerald-500" />
                      ) : n.tone === "warning" ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                      ) : (
                        <Info className="mt-0.5 h-4 w-4 text-sky-500" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.time}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 rounded-full px-1.5 hover:bg-muted/70">
                    <Avatar className="h-7 w-7 border border-primary/30">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/70 bg-popover/95 backdrop-blur-xl">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile (Coming soon)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setBrandingOpen(true)}
                  >
                    <span>Customize brand</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-3 py-4 sm:px-4 lg:px-6" tabIndex={-1}>
          <Outlet />
        </main>

        <footer className="border-t border-border/60 bg-background/40 backdrop-blur-xl">
          <div className="px-4 lg:px-6 py-3">
            <p className="text-center text-xs text-muted-foreground">© 2026 {brandName}. Enterprise Banking Platform.</p>
          </div>
        </footer>
      </div>

      <Dialog open={brandingOpen} onOpenChange={setBrandingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize UI brand</DialogTitle>
            <DialogDescription>
              Update branding text across the UI in real time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Brand name</label>
              <Input
                value={draftBrandName}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraftBrandName(value);
                  setBrandName(value);
                }}
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Console tagline</label>
              <Input
                value={draftConsoleTagline}
                onChange={(e) => {
                  const value = e.target.value;
                  setDraftConsoleTagline(value);
                  setConsoleTagline(value);
                }}
                placeholder="Enter tagline"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetBrand();
                setDraftBrandName("SecureBank");
                setDraftConsoleTagline("Enterprise Console");
              }}
            >
              Reset defaults
            </Button>
            <Button onClick={() => setBrandingOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
