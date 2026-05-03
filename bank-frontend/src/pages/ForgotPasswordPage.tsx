import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const handleRequestToken = async (values: RequestValues) => {
    try {
      const response = await authApi.requestPasswordReset(values.identifier.trim());
      setRequestMessage(response.message);

      if (response.resetToken) {
        resetForm.setValue("token", response.resetToken);
        toast.success("Reset token generated. You can set a new password now.");
      } else {
        toast.success(response.message || "If an account exists, a reset token has been generated.");
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-lg border-border/60 shadow-xl bg-card/95">
        <CardHeader className="space-y-2 text-center border-b border-border/60 bg-muted/30">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <KeyRound className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Request a reset token and set a new password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <Form {...requestForm}>
            <form onSubmit={requestForm.handleSubmit(handleRequestToken)} className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-sm font-semibold">1. Request Reset Token</p>
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
                <p className="text-xs text-muted-foreground rounded-md bg-background/60 border border-border/50 px-3 py-2">
                  {requestMessage}
                </p>
              ) : null}

              <Button type="submit" size="sm" disabled={requestForm.formState.isSubmitting}>
                {requestForm.formState.isSubmitting ? "Requesting..." : "Generate Reset Token"}
              </Button>
            </form>
          </Form>

          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
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
                    <FormDescription>Use the token generated in step 1.</FormDescription>
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

              <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting}>
                {resetForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-border/60 bg-muted/30 pt-6">
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
