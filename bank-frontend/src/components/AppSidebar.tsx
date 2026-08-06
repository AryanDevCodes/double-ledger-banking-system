import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, LogOut, User as UserIcon, Shield as ShieldIcon, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { getDashboardRoute, getVisibleNavItems } from "@/lib/rbac";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const NAV_GROUPS = [
  { label: "Overview",   paths: ["/dashboard", "/admin", "/manager", "/customer-manager", "/user"] },
  { label: "Banking",    paths: ["/banks", "/customers", "/accounts", "/transactions", "/my-transactions"] },
  { label: "Payments",   paths: ["/send-money", "/upi-pay", "/payments", "/upi"] },
  { label: "Compliance", paths: ["/audit", "/security", "/webhooks"] },
  { label: "Cards & Loans", paths: ["/cards", "/loans", "/emi"] },
  { label: "Account",    paths: ["/profile", "/my-account"] },
];

export default function AppSidebar({ collapsed: controlledCollapsed, onCollapsedChange }: AppSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { brandName, consoleTagline } = useBrand();
  
  // Scroll state management
  const navRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Calculate visible nav items first
  const visibleNavItems = user ? getVisibleNavItems(user.roles) : [];
  const dashboardPath = user ? getDashboardRoute(user.roles) : "/dashboard";

  // Check scroll position to show/hide scroll indicators
  useEffect(() => {
    const checkScroll = () => {
      if (!navRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setShowScrollTop(scrollTop > 10);
      setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 10);
    };

    const nav = navRef.current;
    if (nav) {
      checkScroll();
      nav.addEventListener('scroll', checkScroll, { passive: true });
    }

    return () => {
      if (nav) {
        nav.removeEventListener('scroll', checkScroll);
      }
    };
  }, [collapsed, visibleNavItems]);

  const handleToggle = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onCollapsedChange?.(next);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside
      className={cn(
        "fixed left-3 top-3 bottom-3 z-40 flex flex-col rounded-2xl overflow-hidden transition-all duration-300",
        // Pure glassmorphism — light mode
        "bg-white/40 dark:bg-slate-900/40",
        "backdrop-blur-2xl",
        "border border-white/60 dark:border-white/10",
        "shadow-[0_8px_40px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      {/* Subtle inner glass sheen overlay */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/30 via-transparent to-transparent dark:from-white/5 dark:via-transparent dark:to-transparent" />

      {/* ── Brand ── */}
      <div
        className={cn(
          "relative flex h-[64px] shrink-0 items-center transition-all duration-300",
          "border-b border-white/50 dark:border-white/10",
          collapsed ? "justify-center px-0" : "gap-3 px-4",
        )}
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm",
          "bg-gradient-to-br from-amber-400 to-orange-500",
          "shadow-[0_4px_16px_rgba(245,158,11,0.45)]",
          "text-white select-none",
        )}>
          <Sparkles className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 animate-fade-in">
            <p className="text-sm font-bold text-foreground truncate tracking-tight">{brandName}</p>
            <p className="text-[10px] text-muted-foreground/80 truncate">{consoleTagline}</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute top-0 left-0 right-0 h-10 z-10 transition-opacity duration-200",
            "bg-gradient-to-b from-white/50 dark:from-slate-900/50 to-transparent",
            showScrollTop ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          ref={navRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4"
          style={{ scrollbarWidth: "none" }}
        >
          {NAV_GROUPS.map((group) => {
            const items = visibleNavItems.filter((item) => group.paths.includes(item.path));
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const to = item.path === "/dashboard" ? dashboardPath : item.path;
                    const isActive =
                      location.pathname === to ||
                      (item.path !== "/dashboard" && location.pathname.startsWith(to));
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={`${group.label}-${item.path}`}
                        to={to}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 group",
                          collapsed ? "justify-center px-0" : "gap-3 px-3",
                          isActive
                            ? [
                                "bg-gradient-to-r from-amber-500/20 to-orange-400/10",
                                "dark:from-amber-500/25 dark:to-orange-400/10",
                                "text-amber-700 dark:text-amber-300",
                                "border border-amber-400/25 dark:border-amber-400/15",
                                "shadow-[0_2px_16px_rgba(245,158,11,0.20)]",
                              ].join(" ")
                            : [
                                "text-muted-foreground",
                                "hover:bg-white/50 dark:hover:bg-white/5",
                                "hover:text-foreground",
                                "border border-transparent",
                              ].join(" "),
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute left-0 inset-y-[6px] w-[3px] rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-[17px] w-[17px] shrink-0 transition-all duration-200",
                            isActive
                              ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                              : "group-hover:scale-110",
                          )}
                        />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="h-4" />
        </div>

        <div
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 right-0 h-10 z-10 transition-opacity duration-200",
            "bg-gradient-to-t from-white/50 dark:from-slate-900/50 to-transparent",
            showScrollBottom ? "opacity-100" : "opacity-0",
          )}
        />
      </div>

      {/* ── User card ── */}
      <div className="relative shrink-0 border-t border-white/50 dark:border-white/10 p-2">
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full h-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-150"
            aria-label="Log out"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left group transition-all duration-150",
                "hover:bg-white/50 dark:hover:bg-white/5",
                "border border-transparent hover:border-white/60 dark:hover:border-white/10",
              )}>
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 ring-2 ring-amber-400/30 ring-offset-1 ring-offset-transparent">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user?.fullName || user?.username || "User"} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold">
                      {user?.fullName ? getInitials(user.fullName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white/80 dark:border-slate-900/80 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                    title="Online"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={6}
              className={cn(
                "w-56 rounded-2xl p-0 overflow-hidden border",
                "bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl",
                "border-white/60 dark:border-white/10",
                "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
              )}
            >
              <DropdownMenuLabel className="px-4 pt-3 pb-2">
                <p className="font-semibold text-sm truncate">{user?.fullName || user?.username}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10 mx-0" />
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="px-4 py-2.5 opacity-50 cursor-default">
                <ShieldIcon className="mr-2 h-4 w-4" />
                <span className="truncate text-xs">
                  {user?.roles.join(", ").replace(/ROLE_/g, "")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/5 dark:bg-white/10 mx-0" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-4 py-2.5 text-red-500 focus:text-red-500 hover:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={handleToggle}
        className={cn(
          "relative shrink-0 flex items-center h-8 transition-all duration-150",
          "border-t border-white/50 dark:border-white/10",
          "text-muted-foreground/50 hover:text-foreground",
          "hover:bg-white/40 dark:hover:bg-white/5",
          collapsed ? "justify-center" : "justify-end gap-1.5 px-4 text-xs",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <>
            <span className="text-[10px] tracking-wide">Collapse</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </aside>
  );
}