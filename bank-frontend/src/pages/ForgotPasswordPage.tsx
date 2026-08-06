import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import AuroraBackdrop from "@/components/AuroraBackdrop";
import GradientButton from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordStrength } from "@/components/PasswordStrength";
import { authApi, ApiError } from "@/lib/api-client";
import { KeyRound, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const requestSchema = z.object({
  identifier: z.string().min(3, "Enter your username or email"),
});

const resetSchema = z
  .object({
    token: z.string().min(10, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/\d/, "Add at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.data && typeof error.data === "object") {
    const maybeData = error.data as { message?: string; error?: { errorMessage?: string } };
    if (typeof maybeData.error?.errorMessage === "string" && maybeData.error.errorMessage.trim()) {
      return maybeData.error.errorMessage;
    }
    if (typeof maybeData.message === "string" && maybeData.message.trim()) {
      return maybeData.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      identifier: "",
    },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      resetForm.setValue("token", token);
    }
  }, [resetForm]);

  const handleRequestToken = async (values: RequestValues) => {
    try {
      const response = await authApi.requestPasswordReset(values.identifier.trim());
      setRequestMessage(response.message);
      toast.success(response.message || "If an account exists, a reset email has been sent.");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Unable to request password reset"));
    }
  };

  const handleResetPassword = async (values: ResetValues) => {
    try {
      await authApi.resetPassword(values.token.trim(), values.newPassword);
      toast.success("Password reset successful. Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(extractErrorMessage(error, "Unable to reset password"));
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-8">
      <AuroraBackdrop />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="auth-shell">
          <aside className="auth-rail">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display text-xl text-foreground">Password Recovery</p>
                  <p className="text-xs text-muted-foreground">Identity verified workflows</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="text-foreground font-semibold">Recovery checklist</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Request token from your registered email
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Set a compliant, strong password
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Confirm updates in the audit log
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Security-first recovery protects your accounts.</div>
          </aside>

          <div className="auth-card overflow-hidden">
            {/* Header */}
            <div className="px-7 pt-8 pb-6 text-center border-b border-border/70 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-card/80 shadow-sm">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Forgot Password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Request a reset link and set a new password.</p>
            </div>

            <div className="px-7 py-6 space-y-6">
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(handleRequestToken)} className="space-y-4 glass-panel--subtle rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold">1. Request Reset Link</p>
                  <FormField
                    control={requestForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username or Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Enter username or email"
                              className="pl-10"
                              disabled={requestForm.formState.isSubmitting}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {requestMessage ? (
                    <p className="text-xs text-muted-foreground rounded-xl glass-panel--subtle border border-border px-3 py-2">
                      {requestMessage}
                    </p>
                  ) : null}

                  <GradientButton type="submit" size="sm" loading={requestForm.formState.isSubmitting}>
                    {requestForm.formState.isSubmitting ? "Requesting…" : "Send Reset Link"}
                  </GradientButton>
                </form>
              </Form>

              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4 glass-panel--subtle rounded-2xl border border-border p-4">
                  <p className="text-sm font-semibold">2. Set New Password</p>

                  <FormField
                    control={resetForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reset Token</FormLabel>
                        <FormControl>
                          <Input placeholder="Paste reset token" disabled={resetForm.formState.isSubmitting} {...field} />
                        </FormControl>
                        <FormDescription>Use the token from the email link.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              className="pl-10 pr-10"
                              disabled={resetForm.formState.isSubmitting}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                              onClick={() => setShowNewPassword((prev) => !prev)}
                              aria-label={showNewPassword ? "Hide password" : "Show password"}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <PasswordStrength password={field.value} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter new password"
                              className="pl-10 pr-10"
                              disabled={resetForm.formState.isSubmitting}
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <GradientButton type="submit" fullWidth loading={resetForm.formState.isSubmitting}>
                    {resetForm.formState.isSubmitting ? "Resetting…" : "Reset Password"}
                  </GradientButton>
                </form>
              </Form>
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-border/70 bg-card/60">
              <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
