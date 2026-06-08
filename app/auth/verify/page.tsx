"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle2, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// ── Inner component that reads search params ──────────────────────────────────
// Must be wrapped in <Suspense> so Next.js can statically render the outer
// shell while this part waits for client-side param resolution.
function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendError, setResendError] = useState("");

  const supabase = createClient();

  async function handleResend() {
    if (!email) return;
    setLoading(true);
    setResendError("");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);
    if (error) {
      setResendError("Could not resend email. Please try again.");
    } else {
      setResent(true);
    }
  }

  return (
    <div className="px-8 py-8 text-center">
      {/* Mail icon */}
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10">
        <Mail className="h-8 w-8 text-burgundy" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        Check your inbox
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        Check your AUB email inbox and click the verification link to activate
        your account.
      </p>

      {email && (
        <p className="mt-2 text-sm font-medium text-gray-800">{email}</p>
      )}

      <div className="mt-6">
        {resent ? (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Verification email resent — check your inbox.
          </div>
        ) : (
          <>
            {resendError && (
              <p className="mb-3 text-sm text-red-600">{resendError}</p>
            )}
            <Button
              variant="secondary"
              className="w-full"
              loading={loading}
              disabled={!email}
              onClick={handleResend}
            >
              {!loading && <RefreshCw className="h-4 w-4" />}
              Resend Verification Email
            </Button>
          </>
        )}
      </div>

      <Link
        href="/auth/login"
        className="mt-5 block text-sm font-medium text-burgundy hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}

// ── Page shell (static, no search-param access) ───────────────────────────────
export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Burgundy header */}
          <div className="bg-burgundy px-8 py-7 text-center">
            <span className="text-5xl leading-none">🌲</span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-white">
              AUB Club Portal
            </h1>
          </div>

          {/* Suspense boundary isolates useSearchParams from static shell */}
          <Suspense
            fallback={
              <div className="px-8 py-8 text-center text-sm text-gray-400">
                Loading…
              </div>
            }
          >
            <VerifyContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
