import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordStrength } from "@/components/PasswordStrength";
import { authApi, ApiError } from "@/lib/api-client";
import { KeyRound, Mail, Lock, Eye, EyeOff, LoaderCircle } from "lucide-react";
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
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="auth-shell">
          <aside className="auth-rail">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-white/20 bg-white/10">
                  <KeyRound className="h-6 w-6 text-sidebar-foreground" />
                </div>
                <div>
                  <p className="font-display text-xl text-sidebar-foreground">Password Recovery</p>
                  <p className="text-xs text-sidebar-muted">Account security</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-sidebar-muted">
                <p className="font-semibold text-sidebar-foreground">Recovery checklist</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-sidebar-primary" />
                    Request token from your registered email
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-sidebar-primary" />
                    Set a compliant, strong password
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-sidebar-primary" />
                    Return to sign in when you are finished
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-sidebar-border pt-4 text-xs leading-5 text-sidebar-muted">
              Security-first recovery protects your account.
            </div>
          </aside>

          <div className="auth-card overflow-hidden">
            <div className="border-b border-border px-7 pb-5 pt-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Account security</p>
              <h1 className="mt-2 font-display text-3xl font-medium text-foreground">Forgot password</h1>
              <p className="mt-1 text-sm text-muted-foreground">Request a reset link and set a new password.</p>
            </div>

            <div className="px-7 py-6 space-y-6">
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(handleRequestToken)} className="space-y-4 rounded-md border border-border bg-muted/25 p-4">
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
                    <p className="rounded-md border border-border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
                      {requestMessage}
                    </p>
                  ) : null}

                  <Button type="submit" size="sm" className="rounded-md" disabled={requestForm.formState.isSubmitting}>
                    {requestForm.formState.isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {requestForm.formState.isSubmitting ? "Requesting…" : "Send reset link"}
                  </Button>
                </form>
              </Form>

              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4 rounded-md border border-border bg-muted/25 p-4">
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

                  <Button type="submit" className="h-10 w-full rounded-md" disabled={resetForm.formState.isSubmitting}>
                    {resetForm.formState.isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {resetForm.formState.isSubmitting ? "Resetting…" : "Reset Password"}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="border-t border-border px-7 py-5">
              <Button variant="outline" className="w-full rounded-md" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
