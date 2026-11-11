import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, ShieldCheck, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PasswordStrength } from "@/components/PasswordStrength";
import { ThemeToggle } from "@/components/ThemeToggle";

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
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

type PasswordValues = z.infer<typeof passwordSchema>;

export default function SetPasswordPage() {
  const { changePassword, passwordChangeRequired } = useAuth();
  const navigate = useNavigate();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordValues) => {
    try {
      await changePassword(values.currentPassword || "", values.newPassword);
      navigate("/dashboard");
    } finally {
      // state handled by react-hook-form
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-7 pb-5 pt-7">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/50">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-medium text-foreground">Set your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">For security, set a new password before continuing.</p>
          </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-7 py-6 space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Current Password {passwordChangeRequired ? "(optional for first login)" : ""}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={passwordChangeRequired ? "Leave blank if none" : "Your current password"}
                          className="pl-10"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Required if you already set a password.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New password"
                          className="pl-10 pr-10"
                          disabled={form.formState.isSubmitting}
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
                    <FormDescription>Use 8+ characters with upper, lower, and a number.</FormDescription>
                    <PasswordStrength password={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat new password"
                          className="pl-10 pr-10"
                          disabled={form.formState.isSubmitting}
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
            </div>

            <div className="border-t border-border px-7 py-5">
              <Button type="submit" className="h-11 w-full rounded-md" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {form.formState.isSubmitting ? "Updating…" : "Update Password"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </div>
    </div>
  );
}
