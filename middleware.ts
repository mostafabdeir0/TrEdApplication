import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request);

  // getUser() validates the JWT with Supabase on every request.
  // Never use getSession() here — it only reads the local cookie without
  // server-side verification, which is exploitable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Unauthenticated → login ───────────────────────────────────────
  if (!user) {
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Read role from profiles table — authoritative source of truth.
  // user_metadata is not reliable (e.g. manually provisioned professors
  // may have a different or missing metadata value).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: string = profile?.role ?? "student";

  // ── Wrong-role redirects ──────────────────────────────────────────
  if (pathname.startsWith("/dashboard") && role !== "student") {
    return NextResponse.redirect(new URL("/professor", request.url));
  }

  if (pathname.startsWith("/professor") && role !== "professor") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Forward the (potentially refreshed) session cookies.
  return supabaseResponse;
}

export const config = {
  // Only run middleware on protected routes. Auth routes are intentionally
  // excluded so unauthenticated users can reach the login/register pages.
  matcher: ["/dashboard/:path*", "/professor/:path*"],
};
