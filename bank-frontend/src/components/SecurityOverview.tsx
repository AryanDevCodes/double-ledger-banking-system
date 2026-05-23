import { cn } from "@/lib/utils";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Lock,
  Key,
  Eye,
  Users,
  Activity
} from "lucide-react";

interface SecurityMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  status?: "good" | "warning" | "critical";
}

interface SecurityOverviewProps {
  className?: string;
}

export default function SecurityOverview({ className }: SecurityOverviewProps) {
  const metrics: SecurityMetric[] = [
    { label: "Active Sessions", value: 4, status: "good" },
    { label: "Failed Logins (24h)", value: 3, status: "warning" },
    { label: "MFA Adoption", value: "67%", status: "warning" },
    { label: "Password Strength", value: "Strong", status: "good" },
  ];

  const securityChecks = [
    { label: "Two-Factor Authentication", enabled: true, icon: Key },
    { label: "Session Timeout (30 min)", enabled: true, icon: Lock },
    { label: "IP Whitelisting", enabled: false, icon: Shield },
    { label: "Audit Logging", enabled: true, icon: Eye },
    { label: "Role-Based Access", enabled: true, icon: Users },
    { label: "Real-time Monitoring", enabled: true, icon: Activity },
  ];

  const overallStatus = metrics.some(m => m.status === "critical") 
    ? "critical" 
    : metrics.some(m => m.status === "warning") 
      ? "warning" 
      : "good";

  const StatusIcon = overallStatus === "good" ? ShieldCheck : ShieldAlert;

  return (
    <div className={cn("glass-card", className)}>
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Status
          </h3>
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            overallStatus === "good" && "text-success",
            overallStatus === "warning" && "text-warning",
            overallStatus === "critical" && "text-destructive"
          )}>
            <StatusIcon className="h-4 w-4" />
            {overallStatus === "good" && "Secure"}
            {overallStatus === "warning" && "Review Needed"}
            {overallStatus === "critical" && "Action Required"}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-5 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <p className={cn(
                "text-2xl font-bold",
                metric.status === "good" && "text-success",
                metric.status === "warning" && "text-warning",
                metric.status === "critical" && "text-destructive"
              )}>
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Checks */}
      <div className="p-5">
        <h4 className="text-sm font-medium mb-3">Security Features</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {securityChecks.map((check, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                check.enabled 
                  ? "bg-success/5 text-success" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <check.icon className="h-4 w-4" />
              <span className={cn(!check.enabled && "line-through")}>{check.label}</span>
              {check.enabled ? (
                <ShieldCheck className="h-3.5 w-3.5 ml-auto" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5 ml-auto" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
