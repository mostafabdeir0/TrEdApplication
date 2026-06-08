import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export function createMiddlewareClient(request: NextRequest) {
  // supabaseResponse must be rebuilt inside setAll so cookie mutations
  // are forwarded to both the request (for chained middleware) and
  // the final response sent to the browser.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
        ) {
          // Write cookies back onto the outgoing request so subsequent
          // middleware (or the route handler) see them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response so Next.js picks up the fresh cookies.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, supabaseResponse };
}
