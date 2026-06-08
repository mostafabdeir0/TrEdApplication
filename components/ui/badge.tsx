import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

const variantClasses = {
  default: "bg-aub-panel text-aub-muted",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-800",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusVariantMap: Record<ApplicationStatus, BadgeProps["variant"]> = {
  submitted: "info",
  under_review: "warning",
  meeting_invited: "warning",
  meeting_done: "info",
  accepted: "success",
  rejected: "error",
};

const statusLabelMap: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  meeting_invited: "Meeting Invited",
  meeting_done: "Meeting Done",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={statusVariantMap[status]}>
      {statusLabelMap[status]}
    </Badge>
  );
}
