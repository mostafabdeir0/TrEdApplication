"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
  ClipboardList,
  Clock3,
  LogOut,
  Search,
  Settings,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "All Applications", status: null, icon: ClipboardList },
  { label: "Pending Review", status: "submitted", icon: Clock3 },
  { label: "Scheduled Meetings", status: "meeting_invited", icon: CalendarCheck },
  { label: "Accepted", status: "accepted", icon: CheckCircle2 },
  { label: "Rejected", status: "rejected", icon: XCircle },
] as const;

export default function Sidebar({ professorName }: { professorName: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const initials = professorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  function isActive(status: string | null) {
    if (pathname.startsWith("/professor/applications")) return status === null;
    if (status === null) return pathname === "/professor" && !currentStatus;
    return currentStatus === status;
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-aub-line bg-cream px-5 shadow-sm md:px-10">
        <div className="flex items-center gap-8">
          <Link
            href="/professor"
            className="font-display text-2xl font-semibold text-burgundy"
          >
            AUB TrEd Portal
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/professor"
              className="border-b-2 border-burgundy pb-1 text-sm font-bold text-burgundy"
            >
              Dashboard
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Search className="hidden h-5 w-5 text-aub-muted sm:block" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-aub-line bg-aub-panel text-xs font-bold text-burgundy">
            {initials}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 text-sm font-semibold text-aub-ink transition-colors hover:text-burgundy disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 md:hidden" />
            <span className="hidden md:inline">
              {loggingOut ? "Signing out..." : "Logout"}
            </span>
          </button>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 flex-col border-r border-aub-line bg-aub-soft p-4 md:flex">
        <div className="mb-8 border-b border-aub-line px-2 pb-8 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-burgundy text-lg font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-burgundy">{professorName}</p>
              <p className="text-sm text-aub-muted">Club Advisor</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV.map((item) => {
            const href = item.status
              ? `/professor?status=${item.status}`
              : "/professor";
            const active = isActive(item.status);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "flex items-center gap-4 rounded px-4 py-3.5 text-sm transition-all",
                  active
                    ? "bg-burgundy font-semibold text-white shadow-sm"
                    : "text-aub-muted hover:bg-aub-panel hover:text-burgundy"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-aub-line pt-5">
          <Link
            href="/professor?status=submitted"
            className="mb-4 flex w-full items-center justify-center rounded bg-burgundy px-4 py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
          >
            Review Pending
          </Link>
          <span className="flex items-center gap-4 rounded px-4 py-3 text-sm text-aub-muted">
            <Settings className="h-5 w-5" />
            Settings
          </span>
          <span className="flex items-center gap-4 rounded px-4 py-3 text-sm text-aub-muted">
            <HelpCircle className="h-5 w-5" />
            Support
          </span>
        </div>
      </aside>
    </>
  );
}
