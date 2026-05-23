import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Building2, Mail, Phone, User, Eye, EyeOff } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordStrength } from '@/components/PasswordStrength';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuroraBackdrop from '@/components/AuroraBackdrop';
import GradientButton from '@/components/ui/GradientButton';
import { Button } from '@/components/ui/button';

const registerSchema = z
  .object({
    fullName: z.string().min(3, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Enter a valid email"),
    phoneNumber: z
      .string()
      .optional()
      .refine((value) => !value || /^[+\d][\d\s-]{6,}$/.test(value), {
        message: "Enter a valid phone number",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/\d/, "Add at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phoneNumber: "",
    },
  });

  const handleSubmit = async (values: RegisterValues) => {
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || "",
      });
      navigate('/dashboard');
    } catch (error) {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-8">
      <AuroraBackdrop />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-8 pb-6 text-center border-b border-[var(--glass-border)] bg-gradient-to-b from-violet-500/10 to-transparent">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/15 border border-[var(--glass-border)] shadow-glass">
              <Building2 className="h-8 w-8 text-[var(--accent-primary)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--ink-primary)]">Create Account</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">Register for banking portal access</p>
          </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="px-7 py-6 space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        autoComplete="name"
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="johndoe"
                          className="pl-10"
                          autoComplete="username"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="pl-10"
                          autoComplete="email"
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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="+1234567890"
                          className="pl-10"
                          autoComplete="tel"
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
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
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
                    <FormLabel>Confirm Password *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
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

            {/* Footer */}
            <div className="px-7 py-5 border-t border-[var(--glass-border)] bg-white/10 dark:bg-white/[0.02] space-y-3">
              <GradientButton type="submit" fullWidth loading={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating account…' : 'Create Account'}
              </GradientButton>
              <p className="text-sm text-center text-[var(--ink-muted)]">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--accent-primary)] hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </Form>
        </div>
      </div>
    </div>
  );
}
