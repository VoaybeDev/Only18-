import { useMemo, useState } from "react";
import { Crown, CreditCard, Eye, LockKeyhole, Sparkles, Users, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ContentCard } from "@/components/content-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SUBSCRIPTION_DURATION_DAYS,
  SUBSCRIPTION_PRICE,
  hasAccessToContent,
  isModelSubscribedByUser,
  isSubscriptionActive,
  selectActiveModel,
  selectCurrentUser,
  useAppStore,
} from "@/store/useAppStore";

type CatalogueTab = "all" | "public" | "subscribers" | "ppv";

export function HomePage() {
  const currentUser = useAppStore(selectCurrentUser);
  const activeModel = useAppStore(selectActiveModel);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const subscribeToModel = useAppStore((state) => state.subscribeToModel);
  const pushToast = useAppStore((state) => state.pushToast);

  const [activeTab, setActiveTab] = useState<CatalogueTab>("all");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);

  if (!currentUser) return null;

  const activeModelContent = activeModel
    ? content.filter((item) => item.creatorId === activeModel.id)
    : [];

  const publicItems = useMemo(
    () => activeModelContent.filter((item) => item.visibility === "public"),
    [activeModelContent],
  );

  const subscriberItems = useMemo(
    () => activeModelContent.filter((item) => item.visibility === "subscriber"),
    [activeModelContent],
  );

  const ppvItems = useMemo(
    () => activeModelContent.filter((item) => item.visibility === "ppv"),
    [activeModelContent],
  );

  const hasSubscriptionForActiveModel =
    activeModel && currentUser.role === "subscriber"
      ? isModelSubscribedByUser(currentUser, activeModel.id)
      : currentUser.role !== "subscriber";

  const canSeePrivateForActiveModel =
    currentUser.role !== "subscriber" || (hasSubscriptionForActiveModel && isSubscriptionActive(currentUser));

  const availableContent =
    currentUser.role === "subscriber" && !canSeePrivateForActiveModel
      ? publicItems
      : activeTab === "public"
        ? publicItems
        : activeTab === "subscribers"
          ? subscriberItems
          : activeTab === "ppv"
            ? ppvItems
            : activeModelContent;

  const unlockedCount = activeModelContent.filter((item) =>
    hasAccessToContent(currentUser, item, transactions),
  ).length;
  const paidCount = activeModelContent.filter((item) => item.price > 0).length;
  const highestPrice = Math.max(...activeModelContent.map((item) => item.price), 0);

  const handleSimulatePayment = (contentId: string) => {
    const result = simulatePayment(contentId, "catalogue");
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

  const openSubscribeModal = () => setSubscribeOpen(true);

  const closeSubscribeModal = () => {
    if (isProcessingSubscription) return;
    setSubscribeOpen(false);
  };

  const confirmSubscription = async () => {
    if (!activeModel) return;

    setIsProcessingSubscription(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = subscribeToModel(activeModel.id);

    if (!result.ok) {
      pushToast("Abonnement impossible", result.message);
    }

    setIsProcessingSubscription(false);
    setSubscribeOpen(false);
  };

  const subscriptionEndsPreview = formatDate(
    new Date(
      Date.now() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString(),
  );

  const tabs: Array<{ key: CatalogueTab; label: string; count: number }> = [
    { key: "all", label: "Tous", count: activeModelContent.length },
    { key: "public", label: "Public", count: publicItems.length },
    { key: "subscribers", label: "Abonnés", count: subscriberItems.length },
    { key: "ppv", label: "PPV", count: ppvItems.length },
  ];

  const visibleTabs =
    currentUser.role === "subscriber" && !canSeePrivateForActiveModel
      ? tabs.filter((tab) => tab.key === "public")
      : tabs;

  if (!activeModel) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-semibold">Aucune modèle active</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Choisis d’abord une modèle depuis le sélecteur.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-5">
              <Badge variant="premium" className="w-fit">
                Catalogue premium
              </Badge>

              <div className="flex items-center gap-4">
                <AppLogo
                  className="items-center"
                  logoClassName="h-16 w-16 rounded-[1.25rem] p-2 sm:h-20 sm:w-20 sm:rounded-[1.5rem] sm:p-2.5"
                  textClassName="hidden"
                />
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.25em] text-white/55">
                    Modèle sélectionnée
                  </p>
                  <h2 className="text-2xl font-semibold leading-tight sm:text-3xl xl:text-4xl">
                    {activeModel.displayName}
                  </h2>
                </div>
              </div>

              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Catalogue filtré sur la modèle active. Les contenus abonnés et PPV suivent l’état d’abonnement du fan pour cette modèle.
              </p>

              {currentUser.role === "subscriber" && !canSeePrivateForActiveModel ? (
                <div className="rounded-[1.25rem] border border-amber-500/20 bg-amber-500/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">
                        Abonnement requis pour {activeModel.displayName}
                      </p>
                      <p className="mt-1 text-sm text-white/70">
                        Débloque les contenus privés pendant {SUBSCRIPTION_DURATION_DAYS} jours.
                      </p>
                    </div>
                    <Button variant="premium" onClick={openSubscribeModal}>
                      S’abonner
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-pink-500/10 p-3 text-pink-300">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accès actuel</p>
                    <p className="text-2xl font-semibold">
                      {unlockedCount}/{activeModelContent.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Médias PPV</p>
                    <p className="text-2xl font-semibold">{paidCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket max</p>
                    <p className="text-2xl font-semibold">{formatCurrency(highestPrice)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contenus publics</p>
                    <p className="text-2xl font-semibold">{publicItems.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-2xl font-semibold">Catalogue</h3>
            <p className="text-sm text-muted-foreground">
              Filtré sur {activeModel.displayName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {currentUser.role}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <Button
              key={tab.key}
              type="button"
              variant={activeTab === tab.key ? "premium" : "secondary"}
              onClick={() => setActiveTab(tab.key)}
              className="rounded-full"
            >
              {tab.label}
              <span className="ml-2 rounded-full bg-black/20 px-2 py-0.5 text-xs">
                {tab.count}
              </span>
            </Button>
          ))}
        </div>

        {availableContent.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h4 className="text-xl font-semibold">Aucun contenu dans cette section</h4>
              <p className="mt-3 text-sm text-muted-foreground">
                Essaie un autre filtre du catalogue.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {availableContent.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                unlocked={hasAccessToContent(currentUser, item, transactions)}
                onSimulatePayment={handleSimulatePayment}
              />
            ))}
          </div>
        )}
      </div>

      {subscribeOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#0f0b18] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-pink-300">Abonnement simulé</p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  S’abonner à {activeModel.displayName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeSubscribeModal}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
                disabled={isProcessingSubscription}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Modèle</span>
                <span className="font-medium text-white">{activeModel.displayName}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-white">
                  {formatCurrency(SUBSCRIPTION_PRICE)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Durée</span>
                <span className="font-medium text-white">
                  {SUBSCRIPTION_DURATION_DAYS} jours
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Expire le</span>
                <span className="font-medium text-white">
                  {subscriptionEndsPreview}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={closeSubscribeModal}
                disabled={isProcessingSubscription}
              >
                Annuler
              </Button>
              <Button
                variant="premium"
                className="flex-1"
                onClick={confirmSubscription}
                disabled={isProcessingSubscription}
              >
                <CreditCard className="h-4 w-4" />
                {isProcessingSubscription ? "Paiement..." : "Payer et s’abonner"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}