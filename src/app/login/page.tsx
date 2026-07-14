"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api-client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setIsSubmitting(true);
    try {
      await login(data.username, data.password);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-moss-500 text-white">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Mini Trello</h1>
          <p className="text-sm text-ink-muted">A small, focused board for tasks that actually need doing.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg border border-border bg-white p-6 shadow-card">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username or email</Label>
            <Input id="username" autoComplete="username" {...register("username")} />
            {errors.username && <p className="text-xs text-danger-500">{errors.username.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-xs text-danger-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-moss-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
