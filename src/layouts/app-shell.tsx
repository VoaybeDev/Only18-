import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { selectActiveModel, selectCurrentUser, useAppStore } from "@/store/useAppStore";

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[];
}

const navigation: NavItem[] = [
  { href: "/home", label: "Catalogue", icon: Home },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profil", icon: UserRound },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["modele", "chateur"] },
];

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const logout = useAppStore((state) => state.logout);
  const setActiveModel = useAppStore((state) => state.setActiveModel);
  const users = useAppStore((state) => state.users);
  const currentUser = useAppStore(selectCurrentUser);
  const activeModel = useAppStore(selectActiveModel);

  const [modelSwitcherOpen, setModelSwitcherOpen] = useState(false);

  if (!currentUser) return null;

  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(currentUser.role),
  );

  const accessibleModels = useMemo(() => {
    if (currentUser.role === "modele") {
      return users.filter((user) => user.role === "modele" && user.id === currentUser.id);
    }

    if (currentUser.role === "chateur") {
      return users.filter(
        (user) =>
          user.role === "modele" &&
          (currentUser.accessibleModelIds ?? []).includes(user.id),
      );
    }

    return users.filter((user) => user.role === "modele");
  }, [currentUser, users]);

  const roleBadgeVariant =
    (currentUser.role === "subscriber"
      ? "success"
      : currentUser.role === "modele"
        ? "premium"
        : "accent") as "success" | "premium" | "accent";

  return (
    <>
      <div className="min-h-screen w-full bg-hero">
        <div className="w-full px-3 pb-24 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6 xl:px-8">
          <div className="grid min-h-screen w-full gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="hidden min-w-0 lg:block">
              <div className="sticky top-4 space-y-4">
                <div className="premium-border rounded-[1.75rem] bg-card/75 p-5 backdrop-blur-xl">
                  <AppLogo />

                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (accessibleModels.length > 1) {
                          setModelSwitcherOpen(true);
                        }
                      }}
                      className={cn(
                        "w-full rounded-[1.2rem] bg-white/5 p-3 text-left",
                        accessibleModels.length > 1
                          ? "transition hover:bg-white/10"
                          : "cursor-default",
                      )}
                    >
                      <div className="flex items-center gap-3">
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

                        <Badge variant={roleBadgeVariant} className="shrink-0">
                          {currentUser.role}
                        </Badge>
                      </div>

                      {activeModel ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-[1rem] border border-white/5 bg-black/20 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={activeModel.avatar} />
                              <AvatarFallback>
                                {activeModel.displayName.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {activeModel.displayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                Modèle active
                              </p>
                            </div>
                          </div>

                          {accessibleModels.length > 1 ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : null}
                        </div>
                      ) : null}
                    </button>
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
          <div
            className="premium-border grid w-full rounded-[1.5rem] bg-card/85 p-2 backdrop-blur-xl"
            style={{ gridTemplateColumns: `repeat(${visibleNavigation.length}, minmax(0, 1fr))` }}
          >
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

      {modelSwitcherOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.5rem] border border-white/10 bg-[#0f0b18] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-pink-300">Changement de modèle</p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Choisir la modèle active
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setModelSwitcherOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {accessibleModels.map((model) => {
                const isActive = activeModel?.id === model.id;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setActiveModel(model.id);
                      setModelSwitcherOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[1.15rem] border p-4 text-left transition",
                      isActive
                        ? "border-pink-500/40 bg-pink-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    )}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={model.avatar} />
                      <AvatarFallback>
                        {model.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{model.displayName}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        @{model.username}
                      </p>
                    </div>

                    {isActive ? <Badge variant="premium">active</Badge> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}