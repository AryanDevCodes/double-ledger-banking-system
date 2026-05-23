import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import DataTableToolbar from "@/components/DataTableToolbar";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/LoadingStates";
import { Badge } from "@/components/ui/badge";
import { webhookApi, type WebhookSubscription } from "@/lib/api-client";
import { toast } from "sonner";
import { RefreshCw, Plus, Link2 } from "lucide-react";

const webhookSchema = z.object({
  targetUrl: z.string().url("Enter a valid URL"),
  eventTypes: z.string().min(3, "Enter at least one event type"),
  secret: z.string().min(8, "Secret must be at least 8 characters"),
  description: z.string().optional(),
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

export default function WebhooksPage() {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string | Date | undefined>>({
    status: undefined,
  });

  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      targetUrl: "",
      eventTypes: "transaction.completed,transaction.failed,transaction.reversed",
      secret: "",
      description: "",
    },
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const items = await webhookApi.list();
      setWebhooks(items);
    } catch (error) {
      toast.error("Failed to load webhooks");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (values: WebhookFormValues) => {
    try {
      await webhookApi.create({
        targetUrl: values.targetUrl.trim(),
        eventTypes: values.eventTypes.trim(),
        secret: values.secret.trim(),
        description: values.description?.trim() || undefined,
      });
      toast.success("Webhook created");
      form.reset();
      setOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create webhook");
      console.error(error);
    }
  };

  const toggleActive = async (hook: WebhookSubscription) => {
    try {
      await webhookApi.setActive(hook.id, !hook.active);
      toast.success(hook.active ? "Webhook deactivated" : "Webhook activated");
      loadData();
    } catch (error) {
      toast.error("Failed to update webhook status");
      console.error(error);
    }
  };

  const deleteWebhook = async (hook: WebhookSubscription) => {
    if (!window.confirm(`Delete webhook ${hook.targetUrl}?`)) return;
    try {
      await webhookApi.delete(hook.id);
      toast.success("Webhook deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete webhook");
      console.error(error);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const filtered = webhooks.filter((hook) => {
    const matchesSearch =
      !searchTerm ||
      hook.targetUrl.toLowerCase().includes(searchTerm) ||
      hook.eventTypes.toLowerCase().includes(searchTerm) ||
      (hook.description || "").toLowerCase().includes(searchTerm);
    const matchesStatus =
      !filters.status ||
      (filters.status === "active" && hook.active) ||
      (filters.status === "inactive" && !hook.active);
    return matchesSearch && matchesStatus;
  });

  return (
    <PageWrapper>
      <PageHeader
        title="Webhooks"
        subtitle="Manage payment status callbacks"
        icon={<Link2 className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> New Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-[var(--glass-border)]">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="targetUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/webhooks/payments" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="eventTypes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Types</FormLabel>
                          <FormControl>
                            <Input placeholder="transaction.completed,transaction.failed" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signing Secret</FormLabel>
                          <FormControl>
                            <Input placeholder="shared-secret" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Optional notes" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? "Creating..." : "Create Webhook"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="data-table-shell">
        <div className="p-4 border-b border-[var(--glass-border)] bg-gradient-to-r from-[var(--accent-primary)]/8 to-transparent">
          <DataTableToolbar
            searchPlaceholder="Search webhooks..."
            searchValue={search}
            onSearchChange={setSearch}
            filters={[
              {
                key: "status",
                label: "Status",
                type: "select",
                options: [
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ],
              },
            ]}
            activeFilters={filters}
            onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
            onClearFilters={() => setFilters({ status: undefined })}
          />
        </div>

        {loading ? (
          <TableSkeleton columns={5} rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState type="generic" title="No webhooks" description="Create a webhook to receive payment events." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/45">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((hook) => (
                  <TableRow key={hook.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-xs font-mono max-w-[260px] truncate">{hook.targetUrl}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{hook.eventTypes}</TableCell>
                    <TableCell>
                      <Badge variant={hook.active ? "default" : "secondary"}>
                        {hook.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{hook.description || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => toggleActive(hook)}>
                        {hook.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteWebhook(hook)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
