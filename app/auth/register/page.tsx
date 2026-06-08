"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, TreePine } from "lucide-react";
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
    <main className="aub-mesh flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex flex-col items-center text-burgundy">
          <div className="flex items-center gap-1">
            <TreePine className="h-9 w-9" strokeWidth={1.8} />
            <span className="font-display text-4xl font-bold leading-none">AUB</span>
          </div>
          <span className="mt-2 text-[10px] font-semibold uppercase italic tracking-[0.2em] text-burgundy/70">
            Ut vitam abundantius habeant
          </span>
        </div>

        <div className="aub-glass rounded-2xl p-8 md:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-semibold text-burgundy">
              Club Application Portal
            </h1>
            <p className="mt-1 text-sm text-aub-muted/80">
              Empowering Student Leadership at AUB
            </p>
          </div>

          <div className="relative mb-8 grid grid-cols-2 rounded-xl bg-aub-panel p-1">
            <Link
              href="/auth/login"
              className="relative z-10 py-2.5 text-center text-sm font-medium text-aub-muted"
            >
              Login
            </Link>
            <span className="absolute inset-y-1 right-1 w-[calc(50%-4px)] rounded-lg bg-burgundy" />
            <span className="relative z-10 py-2.5 text-center text-sm font-medium text-white">
              Register
            </span>
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
              id="full_name"
              label="Full Name"
              placeholder="e.g. Layla Hassan"
              autoComplete="name"
              className="h-14"
              {...register("full_name")}
              error={errors.full_name?.message}
            />
            <Input
              id="email"
              label="AUB Email"
              type="email"
              placeholder="username@mail.aub.edu"
              autoComplete="email"
              className="h-14"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="h-14"
              {...register("password")}
              error={errors.password?.message}
            />
            <Input
              id="confirm_password"
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="h-14"
              {...register("confirm_password")}
              error={errors.confirm_password?.message}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="mt-5 h-14 w-full"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 border-t border-aub-line/20 pt-8 text-center">
            <p className="text-sm leading-relaxed text-aub-muted/60">
              Register with your{" "}
              <span className="font-medium text-burgundy">
                official AUB email
              </span>{" "}
              to verify your student profile.
            </p>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-aub-muted/50">
          <p>© 2026 American University of Beirut.</p>
          <div className="mt-3 flex justify-center gap-6">
            <span>Support</span>
            <span className="text-aub-muted/15">•</span>
            <span>Privacy Policy</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
