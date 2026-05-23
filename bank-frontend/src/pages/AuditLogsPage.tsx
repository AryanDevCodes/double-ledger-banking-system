import { useCallback, useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import DataTableToolbar from "@/components/DataTableToolbar";
import AuditLogTable from "@/components/AuditLogTable";
import { StatCardSkeleton, TableSkeleton } from "@/components/LoadingStates";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { auditApi, type AuditLogEntry } from "@/lib/api-client";
import { toast } from "sonner";

const ACTION_OPTIONS = [
  { label: "Create", value: "CREATE" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
  { label: "View", value: "VIEW" },
  { label: "Login", value: "LOGIN" },
  { label: "Logout", value: "LOGOUT" },
  { label: "Export", value: "EXPORT" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 25;
  const [filters, setFilters] = useState<Record<string, string | Date | undefined>>({
    action: undefined,
    resource: undefined,
    date: undefined,
  });

  const toDateParam = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const selectedDate = filters.date as Date | undefined;
      const dateParam = selectedDate ? toDateParam(selectedDate) : undefined;

      const response = await auditApi.getLogs({
        startDate: dateParam,
        endDate: dateParam,
        action: filters.action as string | undefined,
        resource: filters.resource as string | undefined,
        page,
        size: pageSize,
      });

      setLogs(response.items);
      setTotalElements(response.totalElements);
      setTotalPages(Math.max(response.totalPages, 1));

      if (response.totalPages > 0 && page > response.totalPages) {
        setPage(response.totalPages);
      }
    } catch (error) {
      toast.error("Failed to load audit logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters.action, filters.date, filters.resource, page]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [filters.action, filters.resource, filters.date]);

  const resourceOptions = useMemo(() => {
    const options = Array.from(new Set(logs.map((log) => log.resource).filter(Boolean))).map((resource) => ({
      label: resource,
      value: resource,
    }));

    const activeResource = filters.resource as string | undefined;
    if (activeResource && !options.some((option) => option.value === activeResource)) {
      options.unshift({ label: activeResource, value: activeResource });
    }

    return options;
  }, [logs, filters.resource]);

  const searchTerm = search.trim().toLowerCase();

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !searchTerm ||
        log.userName.toLowerCase().includes(searchTerm) ||
        log.userId.toLowerCase().includes(searchTerm) ||
        log.resource.toLowerCase().includes(searchTerm) ||
        log.details.toLowerCase().includes(searchTerm) ||
        log.id.toLowerCase().includes(searchTerm);

      return matchesSearch;
    });
  }, [logs, searchTerm]);

  const successCount = filteredLogs.filter((log) => log.status === "SUCCESS").length;
  const failedCount = filteredLogs.filter((log) => log.status === "FAILED").length;
  const exportCount = filteredLogs.filter((log) => log.action === "EXPORT").length;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          subtitle="System activity and compliance tracking"
          icon={<FileText className="h-5 w-5" />}
          actions={
            <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        {loading ? (
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard title="Total Logs" value={totalElements} subtitle="Server total" icon={<FileText className="h-5 w-5" />} />
            <StatCard title="Successful" value={successCount} subtitle="Current page" icon={<ShieldCheck className="h-5 w-5" />} />
            <StatCard title="Failed" value={failedCount} subtitle="Current page" icon={<AlertCircle className="h-5 w-5" />} />
            <StatCard title="Exports" value={exportCount} subtitle="Current page" icon={<FileText className="h-5 w-5" />} />
          </div>
        )}

        <div className="data-table-shell">
          <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--accent-primary)]/8 to-transparent">
            <DataTableToolbar
              searchPlaceholder="Search audit logs..."
              searchValue={search}
              onSearchChange={setSearch}
              filters={[
                { key: "action", label: "Action", type: "select", options: ACTION_OPTIONS },
                { key: "resource", label: "Resource", type: "select", options: resourceOptions },
                { key: "date", label: "Date", type: "date" },
              ]}
              activeFilters={filters}
              onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
              onClearFilters={() => setFilters({ action: undefined, resource: undefined, date: undefined })}
            />
          </div>

          <div className="p-4">
            {loading ? <TableSkeleton columns={7} rows={8} /> : <AuditLogTable logs={filteredLogs} />}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {filteredLogs.length} of {totalElements} logs
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={loading || page <= 1}
                >
                  Previous
                </Button>

                <span className="text-xs text-muted-foreground px-2">
                  Page {page} of {Math.max(totalPages, 1)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.min(Math.max(totalPages, 1), current + 1))}
                  disabled={loading || page >= Math.max(totalPages, 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
