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

const schema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z
      .string()
      .email("Invalid email address")
      .refine(
        (v) => v.toLowerCase().endsWith("@mail.aub.edu"),
        "Only AUB email addresses are allowed (@mail.aub.edu)"
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, role: "student" },
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("user already")
      ) {
        setServerError("This email is already registered. Please sign in.");
      } else {
        setServerError(error.message);
      }
      return;
    }

    router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
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
            <p className="mt-1 text-sm text-white/70">Create your account</p>
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
              id="full_name"
              label="Full Name"
              placeholder="e.g. Layla Hassan"
              autoComplete="name"
              {...register("full_name")}
              error={errors.full_name?.message}
            />

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
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              {...register("password")}
              error={errors.password?.message}
            />

            <Input
              id="confirm_password"
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              {...register("confirm_password")}
              error={errors.confirm_password?.message}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="mt-1 w-full"
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-burgundy hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
