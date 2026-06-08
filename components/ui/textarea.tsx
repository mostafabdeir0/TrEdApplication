import { cn } from "@/lib/utils";
import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="px-1 text-sm font-medium text-aub-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-xl border border-aub-line/50 bg-white/60 px-4 py-3 text-sm text-aub-ink transition-all",
            "placeholder:text-aub-muted/35",
            "focus:border-burgundy focus:bg-white focus:outline-none focus:ring-4 focus:ring-burgundy/5",
            "disabled:cursor-not-allowed disabled:bg-aub-soft disabled:opacity-60",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="px-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
