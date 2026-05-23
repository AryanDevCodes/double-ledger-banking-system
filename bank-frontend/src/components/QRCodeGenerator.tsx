import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QrCode, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { qrApi } from "@/lib/api-client";

interface QRCodeGeneratorProps {
  upiId?: string;
  amount?: number;
  name?: string;
}

export default function QRCodeGenerator({ upiId: initialUpiId, amount: initialAmount, name: initialName }: QRCodeGeneratorProps) {
  const [upiId, setUpiId] = useState(initialUpiId || "");
  const [amount, setAmount] = useState(initialAmount?.toString() || "");
  const [name, setName] = useState(initialName || "");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialUpiId !== undefined) setUpiId(initialUpiId);
  }, [initialUpiId]);

  useEffect(() => {
    if (initialAmount !== undefined) setAmount(initialAmount.toString());
  }, [initialAmount]);

  useEffect(() => {
    if (initialName !== undefined) setName(initialName);
  }, [initialName]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!upiId) {
      newErrors.upiId = "UPI ID is required";
    } else if (!/^[\w.-]+@[\w]+$/.test(upiId)) {
      newErrors.upiId = "Invalid UPI ID format (e.g., name@bank)";
    }
    
    if (amount) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      } else if (amountNum > 100000) {
        newErrors.amount = "Amount cannot exceed ₹1,00,000";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateQRCode = async () => {
    if (!validate()) return;
    
    try {
      setLoading(true);
      const blob = await qrApi.generateUpi({
        upiId,
        name: name || undefined,
        amount: amount || undefined,
        width: 400,
        height: 400,
      });
      const url = URL.createObjectURL(blob);
      setQrCode(url);
      toast.success("QR code generated successfully!");
    } catch (error) {
      toast.error("Failed to generate QR code");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `upi-qr-${upiId}.png`;
    link.click();
    toast.success("QR code downloaded!");
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Generate UPI QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="upiId" className="text-sm font-medium">
              UPI ID *
            </Label>
            <Input
              id="upiId"
              placeholder="username@bank"
              value={upiId}
              onChange={(e) => {
                setUpiId(e.target.value);
                setErrors({ ...errors, upiId: "" });
              }}
              className={errors.upiId ? "border-destructive" : ""}
            />
            {errors.upiId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.upiId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Receiver Name (Optional)
            </Label>
            <Input
              id="name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (₹) (Optional)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors({ ...errors, amount: "" });
              }}
              className={errors.amount ? "border-destructive" : ""}
              min="0"
              step="0.01"
            />
            {errors.amount && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.amount}
              </p>
            )}
            {amount && !errors.amount && (
              <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-xs">
                  Amount: ₹{parseFloat(amount).toFixed(2)}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={generateQRCode}
            disabled={loading || !upiId}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {loading ? "Generating..." : "Generate QR Code"}
          </Button>
        </div>

        {qrCode && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg shadow-lg">
                <img src={qrCode} alt="UPI QR Code" className="w-64 h-64" />
              </div>
            </div>
            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <div>
                  <p className="font-semibold">QR Code Generated Successfully!</p>
                  <p className="text-xs mt-1">UPI ID: {upiId}</p>
                  {name && <p className="text-xs">Name: {name}</p>}
                  {amount && <p className="text-xs">Amount: ₹{parseFloat(amount).toFixed(2)}</p>}
                </div>
              </AlertDescription>
            </Alert>
            <Button
              onClick={downloadQRCode}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
