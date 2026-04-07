import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  compact?: boolean;
}

export function AppLogo({
  className,
  logoClassName,
  textClassName,
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
        <div className={cn("min-w-0", textClassName)}>
          <p className="text-lg font-semibold leading-none tracking-tight text-white">
            Only18+
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            premium content demo
          </p>
        </div>
      ) : null}
    </div>
  );
}