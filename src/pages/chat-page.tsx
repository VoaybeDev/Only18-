import { useEffect, useMemo, useState } from "react";
import { CreditCard, Lock, MessageCircle, X } from "lucide-react";
import { ChatThread } from "@/components/chat-thread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SUBSCRIPTION_DURATION_DAYS,
  SUBSCRIPTION_PRICE,
  isSubscriptionActive,
  selectCurrentUser,
  useAppStore,
} from "@/store/useAppStore";

export function ChatPage() {
  const currentUser = useAppStore(selectCurrentUser);
  const users = useAppStore((state) => state.users);
  const messages = useAppStore((state) => state.messages);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const subscribeToModel = useAppStore((state) => state.subscribeToModel);
  const pushToast = useAppStore((state) => state.pushToast);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);

  if (!currentUser) return null;

  const subscriberUsers = users.filter((user) => user.role === "subscriber");

  const conversationList = useMemo(() => {
    return subscriberUsers
      .map((fan) => {
        const conversationId = `conv-${fan.id}`;
        const conversationMessages = messages
          .filter((message) => message.conversationId === conversationId)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

        const lastMessage =
          conversationMessages.length > 0
            ? conversationMessages[conversationMessages.length - 1]
            : null;

        return {
          id: conversationId,
          fan,
          lastMessage,
          count: conversationMessages.length,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [subscriberUsers, messages]);

  const isActiveSubscriber =
    currentUser.role === "subscriber" && isSubscriptionActive(currentUser);
  const isInactiveSubscriber =
    currentUser.role === "subscriber" && !isSubscriptionActive(currentUser);

  const ownConversationId =
    currentUser.role === "subscriber" ? `conv-${currentUser.id}` : null;

  useEffect(() => {
    if (currentUser.role === "subscriber") return;

    if (conversationList.length === 0) {
      if (selectedConversationId !== null) {
        setSelectedConversationId(null);
      }
      return;
    }

    if (
      !selectedConversationId ||
      !conversationList.some((item) => item.id === selectedConversationId)
    ) {
      setSelectedConversationId(conversationList[0].id);
    }
  }, [currentUser.role, conversationList, selectedConversationId]);

  const effectiveConversationId =
    currentUser.role === "subscriber"
      ? ownConversationId
      : selectedConversationId ?? conversationList[0]?.id ?? null;

  const selectedMessages = effectiveConversationId
    ? messages
        .filter((message) => message.conversationId === effectiveConversationId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
    : [];

  const selectedConversation =
    currentUser.role === "subscriber"
      ? {
          id: ownConversationId ?? `conv-${currentUser.id}`,
          fan: currentUser,
          lastMessage: selectedMessages[selectedMessages.length - 1] ?? null,
        }
      : conversationList.find((item) => item.id === effectiveConversationId) ?? null;

  const handleSimulatePayment = (contentId: string) => {
    const result = simulatePayment(contentId, "chat");
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

  const handleSendMessage = (text: string) => {
    const conversationId =
      currentUser.role === "subscriber"
        ? ownConversationId
        : selectedConversation?.id ?? null;

    if (!conversationId) {
      pushToast("Conversation introuvable", "Impossible d’envoyer le message.");
      return;
    }

    const result = sendMessage(conversationId, text);

    if (!result.ok) {
      pushToast("Envoi impossible", result.message);
    }
  };

  const publicPosts = content.filter((item) => item.visibility === "public");

  const openSubscribeModal = () => setSubscribeOpen(true);

  const closeSubscribeModal = () => {
    if (isProcessingSubscription) return;
    setSubscribeOpen(false);
  };

  const confirmSubscription = async () => {
    setIsProcessingSubscription(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = subscribeToModel();

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

  if (isInactiveSubscriber) {
    return (
      <>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-amber-500/10 p-3 text-amber-300">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">
                      Audience privée réservée aux abonnés
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ce compte n’est pas abonné. Il peut voir seulement les
                      publications publiques de la modèle.
                    </p>
                  </div>
                </div>

                <Button variant="premium" size="lg" onClick={openSubscribeModal}>
                  S’abonner
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5 lg:grid-cols-2">
              {publicPosts.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-[16/10] overflow-hidden bg-black">
                    <img
                      src={item.previewUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.caption}
                        </p>
                      </div>
                      <Badge variant="success">Public</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit">
              <CardContent className="space-y-4 p-5">
                <h3 className="text-xl font-semibold">Offre abonnement</h3>
                <div className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Prix</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatCurrency(SUBSCRIPTION_PRICE)}
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Durée</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {SUBSCRIPTION_DURATION_DAYS} jours
                  </p>
                </div>
                <div className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Expiration prévue</p>
                  <p className="mt-2 text-base font-medium">
                    {subscriptionEndsPreview}
                  </p>
                </div>
                <Button variant="premium" className="w-full" onClick={openSubscribeModal}>
                  Activer l’abonnement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {subscribeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#0f0b18] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-pink-300">Abonnement simulé</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Débloquer l’audience privée
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
                  <span className="text-muted-foreground">Abonnement</span>
                  <span className="font-medium text-white">Only18+ privé</span>
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
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Compte débité</span>
                  <span className="font-medium text-white">•••• 4242</span>
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

  if (currentUser.role !== "subscriber") {
    return (
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Fans</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Clique sur un fan pour ouvrir sa conversation.
              </p>
            </div>

            <div className="space-y-3">
              {conversationList.map((item) => {
                const active = selectedConversation?.id === item.id;
                const fanIsActive = isSubscriptionActive(item.fan);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedConversationId(item.id)}
                    className={`w-full rounded-[1.1rem] border p-3 text-left transition ${
                      active
                        ? "border-pink-500/40 bg-pink-500/10"
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={item.fan.avatar} />
                        <AvatarFallback>
                          {item.fan.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{item.fan.displayName}</p>
                          <Badge variant={fanIsActive ? "success" : "warning"}>
                            {fanIsActive ? "abonné" : "non abonné"}
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {item.lastMessage?.text ?? "Aucun message"}
                        </p>

                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.lastMessage
                            ? formatDate(item.lastMessage.createdAt)
                            : "Conversation vide"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {conversationList.length === 0 ? (
                <div className="rounded-[1.1rem] border border-white/5 bg-white/5 p-4 text-sm text-muted-foreground">
                  Aucune conversation pour le moment.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {selectedConversation ? (
          <ChatThread
            currentUser={currentUser}
            title={selectedConversation.fan.displayName}
            subtitle={
              isSubscriptionActive(selectedConversation.fan)
                ? "Fan abonné"
                : "Fan non abonné"
            }
            canReply={true}
            replyPlaceholder="Répondre au fan"
            messages={selectedMessages}
            content={content}
            transactions={transactions}
            onSendMessage={handleSendMessage}
            onSimulatePayment={handleSimulatePayment}
          />
        ) : (
          <Card>
            <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">Sélectionne une conversation</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choisis un fan dans la liste pour voir ses messages.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <ChatThread
      currentUser={currentUser}
      title="modele_test"
      subtitle={
        isActiveSubscriber && currentUser.subscriptionExpiresAt
          ? `Audience privée · expire le ${formatDate(currentUser.subscriptionExpiresAt)}`
          : "Audience privée"
      }
      canReply={isActiveSubscriber}
      replyPlaceholder="Écrire à modele_test"
      messages={selectedMessages}
      content={content}
      transactions={transactions}
      onSendMessage={handleSendMessage}
      onSimulatePayment={handleSimulatePayment}
    />
  );
}