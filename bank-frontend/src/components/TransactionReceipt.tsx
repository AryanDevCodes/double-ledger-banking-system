import { CheckCircle2, XCircle, Clock, ArrowRight, Download, Share2, Printer, Copy, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import type { TransactionResponseDTO } from "@/types/api";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────
   Transaction Receipt v2.0
   Premium receipt dialog with print-optimized
   layout, share sheet, and visual flow.
   ─────────────────────────────────────────── */

interface TransactionReceiptProps {
  transaction: TransactionResponseDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senderBalance?: number;
  receiverBalance?: number;
}

export default function TransactionReceipt({
  transaction,
  open,
  onOpenChange,
  senderBalance,
  receiverBalance,
}: TransactionReceiptProps) {
  if (!transaction) return null;

  const isSuccess = transaction.status === "COMPLETED" || transaction.status === "SUCCESS";
  const isPending = transaction.status === "PENDING" || transaction.status === "PROCESSING" || transaction.status === "INITIATED";
  const isFailed = transaction.status === "FAILED" || transaction.status === "REVERSED";

  const statusConfig = isSuccess
    ? { icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30", border: "border-emerald-200 dark:border-emerald-800", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" }
    : isPending
    ? { icon: Clock, color: "text-amber-500", bg: "from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30", border: "border-amber-200 dark:border-amber-800", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" }
    : { icon: XCircle, color: "text-red-500", bg: "from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" };

  const StatusIcon = statusConfig.icon;

  const handleCopyTransactionId = async () => {
    try {
      await navigator.clipboard.writeText(transaction.transactionId?.toString() || "");
      toast.success("Transaction ID copied");
    } catch { toast.error("Failed to copy"); }
  };

  const handleDownloadReceipt = () => {
    try {
      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Receipt #${transaction.transactionId}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:40px auto;padding:24px;color:#18181b}
.header{text-align:center;margin-bottom:32px;border-bottom:2px solid #e4e4e7;padding-bottom:24px}
.header h1{margin:0;font-size:28px;color:#18181b}
.header p{margin:6px 0;color:#52525b;font-size:14px}
.status{display:inline-block;padding:8px 16px;border-radius:9999px;font-weight:700;font-size:14px;margin:8px 0}
.status.success{background:#dcfce7;color:#166534}
.status.pending{background:#dbeafe;color:#1d4ed8}
.status.failed{background:#fee2e2;color:#991b1b}
.amount{text-align:center;font-size:40px;font-weight:800;margin:32px 0;color:#18181b;letter-spacing:-0.02em}
.section{margin:28px 0}
.section-title{font-size:16px;font-weight:700;margin-bottom:16px;color:#18181b;border-bottom:1px solid #e4e4e7;padding-bottom:6px}
.info-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f4f4f5}
.info-label{color:#71717a;font-weight:500;font-size:14px}
.info-value{color:#18181b;font-weight:600;font-size:14px}
.party-box{background:#f8fafc;padding:20px;border-radius:12px;margin:12px 0;border-left:4px solid}
.party-box.sender{border-left-color:#ef4444}
.party-box.receiver{border-left-color:#10b981}
.party-box strong{display:block;margin-bottom:8px;font-size:13px;color:#52525b}
.party-box>div>div{margin:6px 0;font-size:14px}
.arrow{text-align:center;margin:16px 0;color:#a1a1aa;font-size:20px}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e4e4e7;text-align:center;color:#a1a1aa;font-size:12px}
@media print{body{margin:0}}
</style></head><body>
<div class="header"><h1>Transaction Receipt</h1><p>${isSuccess ? "Transfer Completed" : isPending ? "Transfer In Progress" : "Transfer Failed"}</p><span class="status ${isSuccess ? "success" : isPending ? "pending" : "failed"}">${transaction.status}</span></div>
<div class="amount">${formatCurrency(transaction.amount)}</div>
<div class="section"><div class="section-title">Transfer Details</div>
<div class="party-box sender"><strong>FROM (SENDER)</strong><div><div><strong>Name:</strong> ${transaction.senderName || "Unknown"}</div><div><strong>Account:</strong> ${transaction.senderAccountNumber}</div>${transaction.senderBankName ? `<div><strong>Bank:</strong> ${transaction.senderBankName}</div>` : ""}${senderBalance !== undefined ? `<div><strong>Balance:</strong> ${formatCurrency(senderBalance)}</div>` : ""}</div></div>
<div class="arrow">↓</div>
<div class="party-box receiver"><strong>TO (RECEIVER)</strong><div><div><strong>Name:</strong> ${transaction.receiverName || "Unknown"}</div><div><strong>Account:</strong> ${transaction.receiverAccountNumber}</div>${transaction.receiverBankName ? `<div><strong>Bank:</strong> ${transaction.receiverBankName}</div>` : ""}${receiverBalance !== undefined ? `<div><strong>Balance:</strong> ${formatCurrency(receiverBalance)}</div>` : ""}</div></div></div>
<div class="section"><div class="section-title">Transaction Information</div>
<div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value">#${transaction.transactionId}</span></div>
<div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${transaction.transactionDate ? formatDateTime(transaction.transactionDate) : "N/A"}</span></div>
<div class="info-row"><span class="info-label">Type</span><span class="info-value">Bank Transfer</span></div>
<div class="info-row"><span class="info-label">Currency</span><span class="info-value">INR (₹)</span></div>
</div>
<div class="footer"><p><strong>Computer-generated receipt. No signature required.</strong></p><p>For queries, contact support with Transaction ID.</p><p>Generated ${new Date().toLocaleString()}</p></div>
</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${transaction.transactionId}-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded");
    } catch { toast.error("Failed to download receipt"); }
  };

  const handleShareReceipt = async () => {
    const text = `Transaction Receipt\nAmount: ${formatCurrency(transaction.amount)}\nFrom: ${transaction.senderName} (${transaction.senderAccountNumber})\nTo: ${transaction.receiverName} (${transaction.receiverAccountNumber})\nID: #${transaction.transactionId}\nStatus: ${transaction.status}\nDate: ${transaction.transactionDate ? formatDateTime(transaction.transactionDate) : "N/A"}`;
    try {
      if (navigator.share) { await navigator.share({ title: `Receipt #${transaction.transactionId}`, text }); toast.success("Shared successfully"); }
      else { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    } catch (error) { if ((error as Error).name !== "AbortError") toast.error("Failed to share"); }
  };

  const handlePrintReceipt = () => {
    try {
      const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print Receipt #${transaction.transactionId}</title>
<style>
@page{margin:1cm}body{margin:0;font-family:system-ui,sans-serif;color:#000}
.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}
.header h1{margin:0;font-size:28px}.header p{margin:5px 0;color:#666;font-size:14px}
.status{display:inline-block;padding:8px 16px;border:2px solid #333;border-radius:4px;font-weight:700;margin:10px 0}
.amount{text-align:center;font-size:42px;font-weight:800;margin:30px 0;color:#000}
.section{margin:28px 0}.section-title{font-size:16px;font-weight:700;margin-bottom:14px;border-bottom:2px solid #333;padding-bottom:4px}
.info-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #ddd}
.info-label{color:#666;font-weight:500}.info-value{color:#000;font-weight:600}
.party-box{border:2px solid #333;padding:20px;border-radius:8px;margin:14px 0}
.party-box strong{display:block;margin-bottom:10px;font-size:13px}
.party-box>div>div{margin:8px 0;font-size:14px}
.arrow{text-align:center;margin:16px 0;font-size:20px}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #333;text-align:center;color:#666;font-size:11px}
</style></head><body>
<div class="header"><h1>TRANSACTION RECEIPT</h1><p>${isSuccess ? "Transfer Completed" : isPending ? "In Progress" : "Transfer Failed"}</p><span class="status">${transaction.status}</span></div>
<div class="amount">${formatCurrency(transaction.amount)}</div>
<div class="section"><div class="section-title">TRANSFER DETAILS</div>
<div class="party-box"><strong>FROM (SENDER)</strong><div><div><strong>Name:</strong> ${transaction.senderName || "Unknown"}</div><div><strong>Account:</strong> ${transaction.senderAccountNumber}</div>${transaction.senderBankName ? `<div><strong>Bank:</strong> ${transaction.senderBankName}</div>` : ""}${senderBalance !== undefined ? `<div><strong>Balance:</strong> ${formatCurrency(senderBalance)}</div>` : ""}</div></div>
<div class="arrow">↓</div>
<div class="party-box"><strong>TO (RECEIVER)</strong><div><div><strong>Name:</strong> ${transaction.receiverName || "Unknown"}</div><div><strong>Account:</strong> ${transaction.receiverAccountNumber}</div>${transaction.receiverBankName ? `<div><strong>Bank:</strong> ${transaction.receiverBankName}</div>` : ""}${receiverBalance !== undefined ? `<div><strong>Balance:</strong> ${formatCurrency(receiverBalance)}</div>` : ""}</div></div></div>
<div class="section"><div class="section-title">TRANSACTION INFORMATION</div>
<div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value">#${transaction.transactionId}</span></div>
<div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${transaction.transactionDate ? formatDateTime(transaction.transactionDate) : "N/A"}</span></div>
<div class="info-row"><span class="info-label">Type</span><span class="info-value">Bank Transfer</span></div>
<div class="info-row"><span class="info-label">Currency</span><span class="info-value">Indian Rupee (INR - ₹)</span></div>
</div>
<div class="footer"><p><strong>Computer-generated receipt. No signature required.</strong></p><p>For queries, contact support with the Transaction ID.</p><p>Printed: ${new Date().toLocaleString()}</p></div>
</body></html>`;
      const w = window.open("", "_blank");
      if (w) { w.document.write(printHtml); w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250); toast.success("Opening print dialog…"); }
      else toast.error("Please allow popups to print");
    } catch { toast.error("Failed to print receipt"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", statusConfig.bg)}>
              <StatusIcon className={cn("h-6 w-6", statusConfig.color)} />
            </div>
            <div>
              <div className="text-lg font-bold">Transaction Receipt</div>
              <div className="text-sm text-muted-foreground">
                {isSuccess ? "Transfer Completed" : isPending ? "In Progress" : "Transfer Failed"}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Amount Banner */}
          <div className={cn("bg-gradient-to-br rounded-2xl p-6 space-y-3 border-2 text-center", statusConfig.bg, statusConfig.border)}>
            <p className="text-sm text-muted-foreground font-medium">Transaction Amount</p>
            <p className="text-4xl font-bold tracking-tight">{formatCurrency(transaction.amount)}</p>
            <Badge variant="outline" className={cn("mt-1 font-semibold text-xs px-2.5 py-0.5 rounded-full", statusConfig.badge)}>
              {transaction.status}
            </Badge>
          </div>

          {/* Flow */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground/70">Transfer Details</h3>
            <div className="grid gap-3">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  FROM (SENDER)
                </div>
                <div className="pl-4 space-y-0.5">
                  <p className="font-semibold text-foreground">{transaction.senderName || "Unknown"}</p>
                  <p className="font-mono text-sm text-muted-foreground">{transaction.senderAccountNumber}</p>
                  {transaction.senderBankName && <p className="text-sm text-muted-foreground">{transaction.senderBankName}</p>}
                  {senderBalance !== undefined && <p className="text-sm font-medium text-muted-foreground mt-1">Balance: {formatCurrency(senderBalance)}</p>}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-full p-2.5">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  TO (RECEIVER)
                </div>
                <div className="pl-4 space-y-0.5">
                  <p className="font-semibold text-foreground">{transaction.receiverName || "Unknown"}</p>
                  <p className="font-mono text-sm text-muted-foreground">{transaction.receiverAccountNumber}</p>
                  {transaction.receiverBankName && <p className="text-sm text-muted-foreground">{transaction.receiverBankName}</p>}
                  {receiverBalance !== undefined && <p className="text-sm font-medium text-muted-foreground mt-1">Balance: {formatCurrency(receiverBalance)}</p>}
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Meta */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground/70">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-sm">#{transaction.transactionId}</p>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={handleCopyTransactionId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                <p className="font-medium text-sm">{transaction.transactionDate ? formatDateTime(transaction.transactionDate) : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="font-medium text-sm">Bank Transfer</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Currency</p>
                <p className="font-medium text-sm">INR (₹)</p>
              </div>
              {/* reversalReason removed – not available in TransactionResponseDTO */}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handleShareReceipt}>
              <Share2 className="h-4 w-4 mr-2" />Share
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          </div>

          <Separator className="bg-border/50" />

          {/* Footer */}
          <div className="text-center space-y-1">
            <p className="text-[11px] text-muted-foreground/60">Computer-generated receipt. No signature required.</p>
            <p className="text-[11px] text-muted-foreground/60">For queries, contact customer support with the Transaction ID.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Close</Button>
            <Button onClick={() => onOpenChange(false)} className={cn("rounded-xl", isSuccess && "bg-emerald-600 hover:bg-emerald-700 text-white")}>
              <CheckCircle2 className="h-4 w-4 mr-2" />Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}