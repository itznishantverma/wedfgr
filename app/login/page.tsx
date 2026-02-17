"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { InstituteBadge } from "@/components/auth/institute-badge";
import { useAuth } from "@/lib/auth/auth-context";
import { useInstituteResolver } from "@/hooks/use-institute-resolver";

const loginSchema = z.object({
  unique_id: z
    .string()
    .min(8, "Unique ID must be at least 8 characters")
    .regex(/^[A-Za-z]+\d{2}[A-Za-z0-9]{2}\d{4}$/, "Invalid ID format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, authStatus } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { unique_id: "", password: "" },
  });

  const watchedId = watch("unique_id");
  const {
    institute,
    isLoading: instituteLoading,
    error: instituteError,
    roleCode,
  } = useInstituteResolver(watchedId);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  if (authStatus === "loading" || authStatus === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function onSubmit(values: LoginFormValues) {
    if (instituteLoading) {
      toast.error("Still verifying institute, please wait");
      return;
    }

    if (instituteError) {
      toast.error("Institute could not be verified");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(values.unique_id, values.password, institute || undefined);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-teal-300/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <GraduationCap className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">OXEDRO</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Education Management,
              <br />
              <span className="text-teal-200">Simplified.</span>
            </h1>
            <p className="text-lg text-teal-100/80 leading-relaxed">
              A comprehensive platform that brings together students, teachers,
              and administrators under one unified system.
            </p>
          </div>

          <p className="text-sm text-teal-200/50">
            Secure multi-tenant architecture
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden flex items-center gap-2.5 justify-center">
            <div className="p-2 bg-teal-600 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">OXEDRO</span>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 pb-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                Sign in
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter your unique ID and password to access your account
              </p>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="unique_id">Unique ID</Label>
                  <Input
                    id="unique_id"
                    placeholder="e.g. DEMO24SA0001"
                    autoComplete="username"
                    autoFocus
                    disabled={isSubmitting}
                    className="h-11"
                    {...register("unique_id")}
                  />
                  {watchedId.length >= 8 && (
                    <InstituteBadge
                      institute={institute}
                      isLoading={instituteLoading}
                      error={instituteError}
                      roleCode={roleCode}
                    />
                  )}
                  {errors.unique_id && (
                    <p className="text-xs text-destructive">
                      {errors.unique_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="h-11 pr-10"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || instituteLoading}
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Contact your institute administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
}
