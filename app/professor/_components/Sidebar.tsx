"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "All Applications", status: null },
  { label: "Pending Review", status: "submitted" },
  { label: "Meetings Scheduled", status: "meeting_invited" },
  { label: "Accepted", status: "accepted" },
  { label: "Rejected", status: "rejected" },
] as const;

export default function Sidebar({ professorName }: { professorName: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function isActive(status: string | null) {
    // On detail pages, highlight "All Applications"
    if (pathname.startsWith("/professor/applications")) return status === null;
    if (status === null) return pathname === "/professor" && !currentStatus;
    return currentStatus === status;
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-burgundy-dark">
      {/* Logo */}
      <div className="border-b border-white/10 px-6 py-5">
        <Link href="/professor" className="flex items-center gap-3">
          <span className="text-2xl leading-none">🌲</span>
          <div>
            <p className="text-sm font-bold leading-tight text-white">
              AUB Club Portal
            </p>
            <p className="text-[11px] text-white/40">Professor Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Applications
        </p>
        {NAV.map((item) => {
          const href =
            item.status ? `/professor?status=${item.status}` : "/professor";
          const active = isActive(item.status);
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  active ? "bg-white" : "bg-white/30"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Professor info + logout */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {professorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {professorName}
            </p>
            <p className="text-[11px] text-white/40">Professor</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          {loggingOut ? "Signing out…" : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}
