import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBrand } from '@/contexts/BrandContext';
import AuroraBackdrop from '@/components/AuroraBackdrop';
import GradientButton from '@/components/ui/GradientButton';

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username is too long"),
  password: z
    .string()
    .max(100, "Password is too long")
    .refine((value) => value.length === 0 || value.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
  remember: z.boolean().default(false),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { brandName } = useBrand();
  const navigate = useNavigate();
  const isDevMode = import.meta.env.DEV;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      remember: false,
    },
  });

  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    const rememberedUsername = localStorage.getItem("rememberedUsername") || "";
    if (rememberMe) {
      form.setValue("remember", true);
      form.setValue("username", rememberedUsername);
    }
  }, [form]);

  const handleSubmit = async (values: LoginValues) => {
    try {
      const { needsPasswordChange } = await login(values.username, values.password || "");
      if (values.remember) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("rememberedUsername", values.username);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedUsername");
      }
      navigate(needsPasswordChange ? "/set-password" : "/dashboard");
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AuroraBackdrop />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="auth-shell">
          <aside className="auth-rail">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-display text-xl text-foreground">{brandName}</p>
                  <p className="text-xs text-muted-foreground">Secure ledger operations</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="text-foreground font-semibold">Operational highlights</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Daily audit trails with full retention
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Role-based approvals and compliance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Real-time reconciliation monitoring
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Need access? Reach out to your bank administrator.
            </div>
          </aside>

          <div className="auth-card overflow-hidden">
            {/* Header */}
            <div className="px-7 pt-8 pb-6 text-center border-b border-border/70 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-card/80 shadow-sm">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">Access your secure workspace</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="px-7 py-6 space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter username"
                          className="pl-10"
                          autoComplete="username"
                          autoFocus
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password (optional for first login)"
                          className="pl-10 pr-10"
                          autoComplete="current-password"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Leave blank if this is your first login.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                        disabled={form.formState.isSubmitting}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">Remember username</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>

              {isDevMode && (
                <div className="glass-panel--subtle rounded-xl border border-[var(--glass-border)] p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">Test Credentials</p>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
                    <p>Manager: <strong>manager</strong> / <strong>manager123</strong></p>
                    <p>User: <strong>user</strong> / <strong>user123</strong></p>
                  </div>
                </div>
              )}
                </div>

                {/* Footer */}
                <div className="px-7 py-5 border-t border-border/70 bg-card/60 space-y-3">
                  <GradientButton type="submit" fullWidth loading={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Signing in…" : "Sign In"}
                  </GradientButton>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
