"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowRight, TreePine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
      setServerError("Invalid email or password. Please try again.");
      return;
    }

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
    <main className="aub-mesh flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <BrandMark />

        <div className="aub-glass rounded-2xl p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-semibold text-burgundy">
              TrEd Application Portal
            </h1>
            <p className="mt-1 text-sm text-aub-muted/80">
              Empowering Student Leadership at AUB
            </p>
          </div>

          <div className="relative mb-8 grid grid-cols-2 rounded-xl bg-aub-panel p-1">
            <span className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-burgundy" />
            <span className="relative z-10 py-2.5 text-center text-sm font-medium text-white">
              Login
            </span>
            <Link
              href="/auth/register"
              className="relative z-10 py-2.5 text-center text-sm font-medium text-aub-muted"
            >
              Register
            </Link>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-4"
          >
            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="AUB Email only"
              autoComplete="email"
              className="h-14"
              {...register("email")}
              error={errors.email?.message}
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-14"
              {...register("password")}
              error={errors.password?.message}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="mt-5 h-14 w-full"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 border-t border-aub-line/20 pt-8 text-center">
            <p className="text-sm leading-relaxed text-aub-muted/60">
              Use your{" "}
              <span className="font-medium text-burgundy">
                AUB SIS credentials
              </span>{" "}
              to link your profile automatically.
            </p>
          </div>
        </div>

        <AuthFooter />
      </div>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="mb-8 flex flex-col items-center text-burgundy">
      <div className="flex items-center gap-1">
        <TreePine className="h-9 w-9" strokeWidth={1.8} />
        <span className="font-display text-4xl font-bold leading-none">AUB</span>
      </div>
      <span className="mt-2 text-[10px] font-semibold uppercase italic tracking-[0.2em] text-burgundy/70">
        Ut vitam abundantius habeant
      </span>
    </div>
  );
}

function AuthFooter() {
  return (
    <footer className="mt-8 text-center text-sm text-aub-muted/50">
      <p>
        © 2026 American University of Beirut.{" "}
        <span className="italic">&quot;Ut vitam abundantius habeant&quot;</span>
      </p>
      <div className="mt-3 flex justify-center gap-6">
        <span>Support</span>
        <span className="text-aub-muted/15">•</span>
        <span>Privacy Policy</span>
      </div>
    </footer>
  );
}
