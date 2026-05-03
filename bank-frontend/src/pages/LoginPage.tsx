import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBrand } from '@/contexts/BrandContext';

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
      const needsPasswordChange = await login(values.username, values.password || "");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md overflow-hidden border-border/60 bg-card/85 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-2 text-center border-b border-border/60 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
          <div className="flex justify-center mb-2">
            <div className="rounded-2xl border border-primary/25 bg-primary/15 p-3 shadow-md">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{brandName} Login</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4 pt-6">
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
                <div className="rounded-xl border border-border/70 bg-muted/35 p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Test Credentials:</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
                    <p>Manager: <strong>manager</strong> / <strong>manager123</strong></p>
                    <p>User: <strong>user</strong> / <strong>user123</strong></p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t border-border/60 bg-muted/20 pt-6">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Need access? Contact your bank administrator.
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
