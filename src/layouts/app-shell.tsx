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
    <div className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 space-y-4">
            <div className="premium-border rounded-[1.75rem] bg-card/75 p-5 backdrop-blur-xl">
              <AppLogo />
              <div className="mt-6 flex items-center gap-3 rounded-[1.2rem] bg-white/5 p-3">
                <Avatar>
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{currentUser.displayName}</p>
                  <p className="truncate text-sm text-muted-foreground">@{currentUser.username}</p>
                </div>
                <Badge variant={currentUser.role === "subscriber" ? "success" : currentUser.role === "modele" ? "premium" : "accent"}>
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
                        active ? "bg-primary/15 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <Button variant="outline" className="w-full justify-start rounded-2xl" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between gap-4 rounded-[1.75rem] border border-white/5 bg-card/70 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div>
              <p className="text-sm text-muted-foreground">Prototype React complet</p>
              <h1 className="text-xl font-semibold sm:text-2xl">Only18+ Premium Demo</h1>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Badge variant="accent">React 18 + Vite</Badge>
              <Badge variant="premium">Zustand + Tailwind</Badge>
            </div>
          </div>
          {children}
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
        <div className="premium-border mx-auto grid max-w-xl grid-cols-4 rounded-[1.5rem] bg-card/85 p-2 backdrop-blur-xl">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[11px]",
                  active ? "bg-primary/15 text-white" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
