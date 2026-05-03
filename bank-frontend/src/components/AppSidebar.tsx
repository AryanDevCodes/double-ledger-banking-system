import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Shield as ShieldIcon,
} from "lucide-react";
import { useState } from "react";
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

export default function AppSidebar({ collapsed: controlledCollapsed, onCollapsedChange }: AppSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { brandName, consoleTagline } = useBrand();

  const handleToggle = () => {
    const newValue = !collapsed;
    setInternalCollapsed(newValue);
    onCollapsedChange?.(newValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get filtered navigation items based on user's roles
  const visibleNavItems = user ? getVisibleNavItems(user.roles) : [];
  const dashboardPath = user ? getDashboardRoute(user.roles) : "/dashboard";

  // Group nav items by category
  const mainItems = visibleNavItems.filter(item => 
    ['/dashboard', '/profile', '/banks', '/customers', '/accounts', '/transactions', '/upi', '/payments'].includes(item.path)
  );
  const complianceItems = visibleNavItems.filter(item => 
    ['/audit', '/security'].includes(item.path)
  );
  const roleItems = visibleNavItems.filter(item => 
    ['/admin', '/manager', '/customer-manager', '/user'].includes(item.path)
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-sidebar-border/80 bg-sidebar/95 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border/80 px-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md">
          B
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="text-sm font-semibold text-sidebar-primary-foreground">{brandName}</p>
            <p className="text-[10px] text-sidebar-muted">{consoleTagline}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="px-3 py-3">
          {!collapsed && (
            <h3 className="px-3 mb-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
              Main Menu
            </h3>
          )}
          <div className="space-y-1">
            {mainItems.map((item) => {
              const to = item.path === "/dashboard" ? dashboardPath : item.path;
              const isActive = location.pathname === to;
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={to}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent/90 text-sidebar-primary ring-1 ring-sidebar-ring/30 shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <IconComponent className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Compliance & Security Section */}
        {complianceItems.length > 0 && (
          <div className="px-3 py-3 border-t border-sidebar-border/50">
            {!collapsed && (
              <h3 className="px-3 mb-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
                Compliance
              </h3>
            )}
            <div className="space-y-1">
              {complianceItems.map((item) => {
                const to = item.path === "/dashboard" ? dashboardPath : item.path;
                const isActive = location.pathname === to;
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent/90 text-sidebar-primary ring-1 ring-sidebar-ring/30 shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <IconComponent className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Role Dashboards Section */}
        {roleItems.length > 0 && (
          <div className="px-3 py-3 border-t border-sidebar-border/50">
            {!collapsed && (
              <h3 className="px-3 mb-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
                Dashboards
              </h3>
            )}
            <div className="space-y-1">
              {roleItems.map((item) => {
                const to = item.path === "/dashboard" ? dashboardPath : item.path;
                const isActive = location.pathname === to;
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent/90 text-sidebar-primary ring-1 ring-sidebar-ring/30 shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <IconComponent className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-sidebar-border/80 p-2.5">
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full h-10 rounded-md text-sidebar-muted hover:text-destructive hover:bg-sidebar-accent transition-colors"
            aria-label="Log out"
            title="Logout"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-xl px-2.5 py-2 hover:bg-sidebar-accent transition-colors">
                <Avatar className="h-8 w-8">
                  {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user?.fullName || user?.username || 'User'} /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {user?.fullName ? getInitials(user.fullName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-muted truncate">
                    {user?.email || ''}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <ShieldIcon className="mr-2 h-4 w-4" />
                <span>Roles: {user?.roles.join(', ').replace(/ROLE_/g, '')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-center h-10 border-t border-sidebar-border/80 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
