import { cn } from "@/lib/utils";

export function TypingDots({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "typing-dots flex items-center gap-1 text-sm font-medium text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      <span className="inline-block h-2 w-2 rounded-full bg-current" />
      <span className="inline-block h-2 w-2 rounded-full bg-current" />
      <span className="inline-block h-2 w-2 rounded-full bg-current" />
    </div>
  );
}
