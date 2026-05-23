import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface QuickAction {
  to: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  badgeType?: "success" | "warning" | "danger" | "info";
}

interface FuturisticQuickActionsProps {
  title?: string;
  actions: QuickAction[];
  className?: string;
  columns?: number;
}

const BADGE_STYLES = {
  success: "badge-futuristic--success",
  warning: "badge-futuristic--warning",
  danger: "badge-futuristic--danger",
  info: "badge-futuristic--info",
};

export default function FuturisticQuickActions({
  title = "Quick Actions",
  actions,
  className,
  columns = 2,
}: FuturisticQuickActionsProps) {
  const gridClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2",
  }[columns] || "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={cn("glass-card-futuristic p-5", className)}>
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-cyan-400 rounded-full" />
        {title}
      </h3>
      
      <div className={cn("grid gap-3", gridClass)}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                to={action.to}
                className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30 group-hover:scale-110 transition-all">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{action.label}</span>
                    {action.badge && (
                      <span className={cn("badge-futuristic", BADGE_STYLES[action.badgeType || "info"])}>
                        {action.badge}
                      </span>
                    )}
                  </div>
                  {action.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {action.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
