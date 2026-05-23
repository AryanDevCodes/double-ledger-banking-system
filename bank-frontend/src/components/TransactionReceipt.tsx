import { CheckCircle2, XCircle, Clock, ArrowRight, Download, Share2, Printer, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import type { TransactionResponseDTO } from "@/types/api";

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

  const statusIcon = isSuccess ? (
    <CheckCircle2 className="h-8 w-8 text-green-500" />
  ) : isPending ? (
    <Clock className="h-8 w-8 text-amber-500" />
  ) : (
    <XCircle className="h-8 w-8 text-red-500" />
  );

  const statusColor = isSuccess
    ? "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
    : isPending
    ? "from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-amber-200 dark:border-amber-800"
    : "from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800";

  const handleCopyTransactionId = async () => {
    try {
      await navigator.clipboard.writeText(transaction.transactionId?.toString() || "");
      toast.success("Transaction ID copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy transaction ID");
    }
  };

  const handleDownloadReceipt = () => {
    try {
      // Create receipt content as HTML
      const receiptContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Transaction Receipt - ${transaction.transactionId}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .header p { margin: 5px 0; color: #666; }
            .status { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .status.success { background: #dcfce7; color: #166534; }
            .status.pending { background: #fef3c7; color: #92400e; }
            .status.failed { background: #fee2e2; color: #991b1b; }
            .amount { text-align: center; font-size: 36px; font-weight: bold; margin: 30px 0; color: #333; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { color: #666; font-weight: 500; }
            .info-value { color: #333; font-weight: 600; }
            .party-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #3b82f6; }
            .party-box.sender { border-left-color: #ef4444; }
            .party-box.receiver { border-left-color: #10b981; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666; font-size: 12px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transaction Receipt</h1>
            <p>${isSuccess ? 'Transfer Completed Successfully' : isPending ? 'Transfer In Progress' : 'Transfer Failed'}</p>
            <span class="status ${isSuccess ? 'success' : isPending ? 'pending' : 'failed'}">${transaction.status}</span>
          </div>
          
          <div class="amount">${formatCurrency(transaction.amount)}</div>
          
          <div class="section">
            <div class="section-title">Transfer Details</div>
            
            <div class="party-box sender">
              <strong>FROM (SENDER)</strong>
              <div style="margin-top: 10px;">
                <div><strong>Name:</strong> ${transaction.senderName || 'Unknown'}</div>
                <div><strong>Account:</strong> ${transaction.senderAccountNumber}</div>
                ${transaction.senderBankName ? `<div><strong>Bank:</strong> ${transaction.senderBankName}</div>` : ''}
                ${transaction.senderEmail ? `<div><strong>Email:</strong> ${transaction.senderEmail}</div>` : ''}
                ${senderBalance !== undefined ? `<div><strong>Balance:</strong> ${formatCurrency(senderBalance)}</div>` : ''}
              </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">⬇</div>
            
            <div class="party-box receiver">
              <strong>TO (RECEIVER)</strong>
              <div style="margin-top: 10px;">
                <div><strong>Name:</strong> ${transaction.receiverName || 'Unknown'}</div>
                <div><strong>Account:</strong> ${transaction.receiverAccountNumber}</div>
                ${transaction.receiverBankName ? `<div><strong>Bank:</strong> ${transaction.receiverBankName}</div>` : ''}
                ${transaction.receiverEmail ? `<div><strong>Email:</strong> ${transaction.receiverEmail}</div>` : ''}
                ${receiverBalance !== undefined ? `<div><strong>Balance:</strong> ${formatCurrency(receiverBalance)}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Transaction Information</div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">#${transaction.transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${transaction.transactionDate ? formatDateTime(transaction.transactionDate) : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Type</span>
              <span class="info-value">Bank Transfer</span>
            </div>
            <div class="info-row">
              <span class="info-label">Currency</span>
              <span class="info-value">INR (₹)</span>
            </div>
            ${transaction.reversalReason ? `
            <div class="info-row">
              <span class="info-label">Reversal Reason</span>
              <span class="info-value" style="color: #dc2626;">${transaction.reversalReason}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt and does not require a signature.</p>
            <p>For any queries, please contact customer support.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([receiptContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${transaction.transactionId}-${Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Receipt downloaded successfully");
    } catch (error) {
      toast.error("Failed to download receipt");
    }
  };

  const handleShareReceipt = async () => {
    const shareText = `Transaction Receipt
Amount: ${formatCurrency(transaction.amount)}
From: ${transaction.senderName} (${transaction.senderAccountNumber})
To: ${transaction.receiverName} (${transaction.receiverAccountNumber})
Transaction ID: #${transaction.transactionId}
Status: ${transaction.status}
Date: ${transaction.transactionDate ? formatDateTime(transaction.transactionDate) : 'N/A'}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Transaction Receipt #${transaction.transactionId}`,
          text: shareText,
        });
        toast.success("Receipt shared successfully");
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        toast.success("Receipt details copied to clipboard");
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error("Failed to share receipt");
      }
    }
  };

  const handlePrintReceipt = () => {
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print Receipt - ${transaction.transactionId}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; font-size: 28px; }
            .header p { margin: 5px 0; color: #666; }
            .status { display: inline-block; padding: 8px 16px; border: 2px solid #333; border-radius: 4px; font-weight: bold; margin: 10px 0; }
            .amount { text-align: center; font-size: 42px; font-weight: bold; margin: 30px 0; color: #000; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #ddd; }
            .info-label { color: #666; font-weight: 500; }
            .info-value { color: #000; font-weight: 600; }
            .party-box { border: 2px solid #333; padding: 20px; border-radius: 8px; margin: 15px 0; }
            .party-box strong { display: block; margin-bottom: 10px; font-size: 14px; }
            .party-box > div > div { margin: 8px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TRANSACTION RECEIPT</h1>
            <p>${isSuccess ? 'Transfer Completed Successfully' : isPending ? 'Transfer In Progress' : 'Transfer Failed'}</p>
            <span class="status">${transaction.status}</span>
          </div>
          
          <div class="amount">${formatCurrency(transaction.amount)}</div>
          
          <div class="section">
            <div class="section-title">TRANSFER DETAILS</div>
            
            <div class="party-box">
              <strong>FROM (SENDER)</strong>
              <div>
                <div><strong>Name:</strong> ${transaction.senderName || 'Unknown'}</div>
                <div><strong>Account Number:</strong> ${transaction.senderAccountNumber}</div>
                ${transaction.senderBankName ? `<div><strong>Bank:</strong> ${transaction.senderBankName}</div>` : ''}
                ${transaction.senderEmail ? `<div><strong>Email:</strong> ${transaction.senderEmail}</div>` : ''}
                ${senderBalance !== undefined ? `<div><strong>Balance After Transfer:</strong> ${formatCurrency(senderBalance)}</div>` : ''}
              </div>
            </div>
            
            <div class="party-box">
              <strong>TO (RECEIVER)</strong>
              <div>
                <div><strong>Name:</strong> ${transaction.receiverName || 'Unknown'}</div>
                <div><strong>Account Number:</strong> ${transaction.receiverAccountNumber}</div>
                ${transaction.receiverBankName ? `<div><strong>Bank:</strong> ${transaction.receiverBankName}</div>` : ''}
                ${transaction.receiverEmail ? `<div><strong>Email:</strong> ${transaction.receiverEmail}</div>` : ''}
                ${receiverBalance !== undefined ? `<div><strong>Balance After Transfer:</strong> ${formatCurrency(receiverBalance)}</div>` : ''}
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">TRANSACTION INFORMATION</div>
            <div class="info-row">
              <span class="info-label">Transaction ID</span>
              <span class="info-value">#${transaction.transactionId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date & Time</span>
              <span class="info-value">${transaction.transactionDate ? formatDateTime(transaction.transactionDate) : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Transaction Type</span>
              <span class="info-value">Bank Transfer</span>
            </div>
            <div class="info-row">
              <span class="info-label">Currency</span>
              <span class="info-value">Indian Rupee (INR - ₹)</span>
            </div>
            ${transaction.reversalReason ? `
            <div class="info-row">
              <span class="info-label">Reversal Reason</span>
              <span class="info-value">${transaction.reversalReason}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p><strong>This is a computer-generated receipt and does not require a signature.</strong></p>
            <p>For any queries or disputes, please contact customer support with the Transaction ID.</p>
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        
        toast.success("Opening print dialog...");
      } else {
        toast.error("Please allow popups to print receipt");
      }
    } catch (error) {
      toast.error("Failed to print receipt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {statusIcon}
            <div>
              <div className="text-xl font-bold">Transaction Receipt</div>
              <div className="text-sm font-normal text-muted-foreground">
                {isSuccess ? "Transfer Completed Successfully" : isPending ? "Transfer In Progress" : "Transfer Failed"}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Section */}
          <div className={`bg-gradient-to-br ${statusColor} rounded-xl p-6 space-y-4 border-2`}>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Transaction Amount</p>
              <p className="text-4xl font-bold">
                {formatCurrency(transaction.amount)}
              </p>
              <Badge
                variant="outline"
                className={`mt-3 ${
                  isSuccess
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : isPending
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}
              >
                {transaction.status}
              </Badge>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Transfer Details</h3>
            
            <div className="grid gap-4">
              {/* Sender Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  FROM (SENDER)
                </div>
                <div className="pl-4 space-y-1">
                  <p className="font-semibold">{transaction.senderName || "Unknown"}</p>
                  <p className="font-mono text-sm">{transaction.senderAccountNumber}</p>
                  {transaction.senderBankName && (
                    <p className="text-sm text-muted-foreground">{transaction.senderBankName}</p>
                  )}
                  {transaction.senderEmail && (
                    <p className="text-xs text-muted-foreground">{transaction.senderEmail}</p>
                  )}
                  {senderBalance !== undefined && (
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                      Balance: {formatCurrency(senderBalance)}
                    </p>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="bg-primary/10 rounded-full p-3">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  TO (RECEIVER)
                </div>
                <div className="pl-4 space-y-1">
                  <p className="font-semibold">{transaction.receiverName || "Unknown"}</p>
                  <p className="font-mono text-sm">{transaction.receiverAccountNumber}</p>
                  {transaction.receiverBankName && (
                    <p className="text-sm text-muted-foreground">{transaction.receiverBankName}</p>
                  )}
                  {transaction.receiverEmail && (
                    <p className="text-xs text-muted-foreground">{transaction.receiverEmail}</p>
                  )}
                  {receiverBalance !== undefined && (
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                      Balance: {formatCurrency(receiverBalance)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Transaction Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium">#{transaction.transactionId}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCopyTransactionId}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                <p className="font-medium">
                  {transaction.transactionDate ? formatDateTime(transaction.transactionDate) : "N/A"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Transaction Type</p>
                <p className="font-medium">Bank Transfer</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Currency</p>
                <p className="font-medium">INR (₹)</p>
              </div>

              {transaction.reversalReason && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground mb-1">Reversal Reason</p>
                  <p className="font-medium text-red-600">{transaction.reversalReason}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareReceipt}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              This is a computer-generated receipt and does not require a signature.
            </p>
            <p className="text-xs text-muted-foreground">
              For any queries, please contact customer support.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => onOpenChange(false)} className={isSuccess ? "bg-green-600 hover:bg-green-700" : ""}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
