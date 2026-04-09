import PageWrapper from "@/components/PageWrapper";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuditLogsPage() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          subtitle="System activity and compliance tracking"
          icon={<FileText className="h-5 w-5" />}
        />

        <Alert className="border-border/70 bg-card/70 backdrop-blur-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Audit logging features coming soon. This page will display system events, user actions, and compliance reports.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-elevated transition-shadow">
            <CardHeader className="border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">No audit logs</p>
            </CardContent>
          </Card>

          <Card className="glass-elevated transition-shadow">
            <CardHeader className="border-b border-border/70 bg-gradient-to-r from-primary/10 to-transparent">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Compliant</p>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
