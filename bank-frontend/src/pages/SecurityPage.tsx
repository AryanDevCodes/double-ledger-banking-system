import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import StatCard from "@/components/StatCard";
import SessionCard from "@/components/SessionCard";
import AccessLogTable from "@/components/AccessLogTable";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertTriangle, RefreshCw, LogOut, Activity, UserCheck } from "lucide-react";
import { securityApi } from "@/lib/api-client";
import type { AccessLogEntry, SessionInfo } from "@/lib/api-client";
import { toast } from "sonner";

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | Date | undefined>>({
    eventType: undefined,
    date: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, accessLogsData] = await Promise.all([
        securityApi.getSessions(),
        securityApi.getAccessLogs(),
      ]);
      setSessions(sessionsData);
      setAccessLogs(accessLogsData);
    } catch (error) {
      toast.error("Failed to load security data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      await securityApi.terminateSession(sessionId);
      toast.success("Session terminated");
      loadData();
    } catch (error) {
      toast.error("Failed to terminate session");
      console.error(error);
    }
  };

  const terminateAll = async () => {
    try {
      await securityApi.terminateAllSessions(true);
      toast.success("All other sessions terminated");
      loadData();
    } catch (error) {
      toast.error("Failed to terminate sessions");
      console.error(error);
    }
  };

  const last24h = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return accessLogs.filter((log) => new Date(log.timestamp).getTime() >= dayAgo);
  }, [accessLogs]);

  const failedLogins24h = last24h.filter((log) => log.eventType === "FAILED_LOGIN").length;
  const successfulLogins24h = last24h.filter((log) => log.eventType === "LOGIN" && log.success).length;
  const activeSessions = sessions.filter((s) => s.isActive).length;

  const searchTerm = search.trim().toLowerCase();
  const filteredLogs = accessLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.userName.toLowerCase().includes(searchTerm) ||
      log.userId.toLowerCase().includes(searchTerm) ||
      log.ipAddress.toLowerCase().includes(searchTerm);
    const matchesEvent = !filters.eventType || log.eventType === filters.eventType;
    const filterDate = filters.date as Date | undefined;
    const matchesDate = !filterDate
      ? true
      : new Date(log.timestamp).toDateString() === filterDate.toDateString();
    return matchesSearch && matchesEvent && matchesDate;
  });

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Security Center</h1>
            <p className="page-subtitle">Monitor sessions, access logs, and security posture</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="destructive" size="sm" onClick={terminateAll} disabled={loading || sessions.length === 0}>
              <LogOut className="h-4 w-4 mr-2" />
              Terminate Others
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <StatCard
            title="Active Sessions"
            value={activeSessions}
            subtitle={`${sessions.length} total`}
            icon={<Lock className="h-5 w-5" />}
          />
          <StatCard
            title="Access Logs"
            value={accessLogs.length}
            subtitle="All time"
            icon={<Shield className="h-5 w-5" />}
          />
          <StatCard
            title="Failed Logins"
            value={failedLogins24h}
            subtitle="Last 24h"
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            title="Successful Logins"
            value={successfulLogins24h}
            subtitle="Last 24h"
            icon={<UserCheck className="h-5 w-5" />}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.length === 0 ? (
                <EmptyState type="generic" title="No sessions" description="No active sessions available." />
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onTerminate={terminateSession}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Access Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pb-4">
                <DataTableToolbar
                  searchPlaceholder="Search logs..."
                  searchValue={search}
                  onSearchChange={setSearch}
                  filters={[
                    {
                      key: "eventType",
                      label: "Event",
                      type: "select",
                      options: [
                        { label: "Login", value: "LOGIN" },
                        { label: "Logout", value: "LOGOUT" },
                        { label: "Failed Login", value: "FAILED_LOGIN" },
                        { label: "Password Change", value: "PASSWORD_CHANGE" },
                        { label: "MFA Enabled", value: "MFA_ENABLED" },
                        { label: "MFA Disabled", value: "MFA_DISABLED" },
                      ],
                    },
                    { key: "date", label: "Date", type: "date" },
                  ]}
                  activeFilters={filters}
                  onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
                  onClearFilters={() => setFilters({ eventType: undefined, date: undefined })}
                />
              </div>
              <AccessLogTable logs={filteredLogs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
