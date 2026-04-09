import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  subtitleClassName?: string;
  compact?: boolean;
}

export function AppLogo({
  className,
  logoClassName,
  textClassName,
  subtitleClassName,
  compact = false,
}: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-premium",
          compact ? "h-12 w-12 p-1.5" : "h-16 w-16 p-2",
          logoClassName,
        )}
      >
        <img
          src="/logo.png"
          alt="Only18+"
          className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(255,80,80,0.35)]"
        />
      </div>

      {!compact ? (
        <div className="min-w-0">
          <p
            className={cn(
              "text-lg font-semibold leading-none tracking-tight text-white",
              textClassName,
            )}
          >
            Only18+
          </p>
          <p
            className={cn(
              "mt-1 text-xs text-muted-foreground",
              subtitleClassName,
            )}
          >
            premium content demo
          </p>
        </div>
      ) : null}
    </div>
  );
}