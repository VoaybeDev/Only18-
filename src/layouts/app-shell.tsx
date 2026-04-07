import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, LogOut, MessageSquare, UserRound } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  { href: "/home", label: "Catalogue", icon: Home },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profil", icon: UserRound },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["modele", "chateur"] },
] as const;

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const logout = useAppStore((state) => state.logout);
  const currentUser = useAppStore(selectCurrentUser);

  if (!currentUser) return null;

  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(currentUser.role),
  );

  return (
    <div className="min-h-screen w-full bg-hero">
      <div className="w-full px-3 pb-24 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6 xl:px-8">
        <div className="grid min-h-screen w-full gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-4 space-y-4">
              <div className="premium-border rounded-[1.75rem] bg-card/75 p-5 backdrop-blur-xl">
                <AppLogo />
                <div className="mt-6 flex items-center gap-3 rounded-[1.2rem] bg-white/5 p-3">
                  <Avatar>
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>
                      {currentUser.displayName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{currentUser.displayName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      @{currentUser.username}
                    </p>
                  </div>

                  <Badge
                    variant={
                      currentUser.role === "subscriber"
                        ? "success"
                        : currentUser.role === "modele"
                          ? "premium"
                          : "accent"
                    }
                    className="shrink-0"
                  >
                    {currentUser.role}
                  </Badge>
                </div>
              </div>

              <nav className="premium-border rounded-[1.75rem] bg-card/75 p-3 backdrop-blur-xl">
                <div className="space-y-1">
                  {visibleNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                          active
                            ? "bg-primary/15 text-white"
                            : "text-muted-foreground hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <Button
                variant="outline"
                className="w-full justify-start rounded-2xl"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Déconnexion
              </Button>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 rounded-[1.75rem] border border-white/5 bg-card/70 px-4 py-4 backdrop-blur-xl sm:mb-6 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Prototype React complet</p>
                  <h1 className="truncate text-xl font-semibold sm:text-2xl">
                    Only18+ Premium Demo
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge variant="accent">React 18 + Vite</Badge>
                  <Badge variant="premium">Zustand + Tailwind</Badge>
                </div>
              </div>
            </div>

            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>

      <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden">
        <div className="premium-border grid w-full grid-cols-4 rounded-[1.5rem] bg-card/85 p-2 backdrop-blur-xl">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px] transition",
                  active ? "bg-primary/15 text-white" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}