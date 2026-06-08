"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Supabase returns "Invalid login credentials" for both wrong
      // email and wrong password — surface a clean message.
      setServerError("Invalid email or password. Please try again.");
      return;
    }

    // Read role from profiles table — authoritative source of truth.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setServerError("Something went wrong. Please try again.");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role: string = profile?.role ?? "student";
    window.location.href = role === "professor" ? "/professor" : "/dashboard";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* ── Burgundy header ── */}
          <div className="bg-burgundy px-8 py-7 text-center">
            <span className="text-5xl leading-none">🌲</span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-white">
              AUB Club Portal
            </h1>
            <p className="mt-1 text-sm text-white/70">Sign in to continue</p>
          </div>

          {/* ── Form ── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5 px-8 py-7"
          >
            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Input
              id="email"
              label="AUB Email"
              type="email"
              placeholder="username@mail.aub.edu"
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="mt-1 w-full"
            >
              Sign In
            </Button>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-burgundy hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
