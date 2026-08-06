import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Download, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { qrApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────
   QR Code Generator v2.0
   Clean form layout with validation, skeleton
   loading state, and premium QR display.
   ─────────────────────────────────────────── */

interface QRCodeGeneratorProps {
  upiId?: string;
  amount?: number;
  name?: string;
}

export default function QRCodeGenerator({
  upiId: initialUpiId,
  amount: initialAmount,
  name: initialName,
}: QRCodeGeneratorProps) {
  const [upiId, setUpiId] = useState(initialUpiId || "");
  const [amount, setAmount] = useState(initialAmount?.toString() || "");
  const [name, setName] = useState(initialName || "");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (initialUpiId !== undefined) setUpiId(initialUpiId); }, [initialUpiId]);
  useEffect(() => { if (initialAmount !== undefined) setAmount(initialAmount.toString()); }, [initialAmount]);
  useEffect(() => { if (initialName !== undefined) setName(initialName); }, [initialName]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!upiId) newErrors.upiId = "UPI ID is required";
    else if (!/^[\w.-]+@[\w]+$/.test(upiId)) newErrors.upiId = "Invalid UPI ID format (e.g., name@bank)";
    if (amount) {
      const n = parseFloat(amount);
      if (isNaN(n) || n <= 0) newErrors.amount = "Amount must be greater than 0";
      else if (n > 100000) newErrors.amount = "Amount cannot exceed ₹1,00,000";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateQRCode = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const blob = await qrApi.generateUpi({ upiId, name: name || undefined, amount: amount || undefined, width: 400, height: 400 });
      const url = URL.createObjectURL(blob);
      setQrCode(url);
      toast.success("QR code generated successfully!");
    } catch (error) {
      toast.error("Failed to generate QR code");
      console.error(error);
    } finally { setLoading(false); }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `upi-qr-${upiId}.png`;
    link.click();
    toast.success("QR code downloaded!");
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <QrCode className="h-5 w-5" />
          </div>
          Generate UPI QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="upiId" className="text-sm font-medium">UPI ID *</Label>
            <Input
              id="upiId"
              placeholder="username@bank"
              value={upiId}
              onChange={(e) => { setUpiId(e.target.value); setErrors(p => ({ ...p, upiId: "" })); }}
              className={cn("rounded-xl", errors.upiId && "border-destructive focus-visible:ring-destructive/30")}
            />
            {errors.upiId && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.upiId}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">Receiver Name <span className="text-muted-foreground/60 font-normal">(Optional)</span></Label>
            <Input id="name" placeholder="Enter name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm font-medium">Amount (₹) <span className="text-muted-foreground/60 font-normal">(Optional)</span></Label>
            <Input
              id="amount" type="number" placeholder="Enter amount" value={amount} min="0" step="0.01"
              onChange={(e) => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: "" })); }}
              className={cn("rounded-xl", errors.amount && "border-destructive focus-visible:ring-destructive/30")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {errors.amount}
              </p>
            )}
            {amount && !errors.amount && (
              <Alert className="bg-emerald-500/5 border-emerald-500/10 rounded-xl py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-400">Amount: ₹{parseFloat(amount).toFixed(2)}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={generateQRCode}
            disabled={loading || !upiId}
            className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating…</> : "Generate QR Code"}
          </Button>
        </div>

        {qrCode && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-center">
              <div className="p-5 bg-white rounded-2xl shadow-lg border border-border/30">
                <img src={qrCode} alt="UPI QR Code" className="w-56 h-56" />
              </div>
            </div>
            <Alert className="bg-primary/5 border-primary/10 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <p className="font-semibold text-foreground">QR Code Generated Successfully</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>UPI ID: <span className="font-mono text-foreground">{upiId}</span></p>
                  {name && <p>Name: {name}</p>}
                  {amount && <p>Amount: <span className="font-semibold">₹{parseFloat(amount).toFixed(2)}</span></p>}
                </div>
              </AlertDescription>
            </Alert>
            <Button onClick={downloadQRCode} variant="outline" className="w-full rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}