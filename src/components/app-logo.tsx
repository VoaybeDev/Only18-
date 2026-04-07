import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-blue-500 shadow-premium">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none tracking-tight">Only18+</p>
        <p className="text-xs text-muted-foreground">premium content demo</p>
      </div>
    </div>
  );
}
