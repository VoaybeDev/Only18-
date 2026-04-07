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
  getConversationId,
  isModelSubscribedByUser,
  isSubscriptionActive,
  selectActiveModel,
  selectCurrentUser,
  useAppStore,
} from "@/store/useAppStore";

export function ChatPage() {
  const currentUser = useAppStore(selectCurrentUser);
  const activeModel = useAppStore(selectActiveModel);
  const users = useAppStore((state) => state.users);
  const messages = useAppStore((state) => state.messages);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);
  const setActiveModel = useAppStore((state) => state.setActiveModel);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const subscribeToModel = useAppStore((state) => state.subscribeToModel);
  const pushToast = useAppStore((state) => state.pushToast);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);

  if (!currentUser) return null;

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

  useEffect(() => {
    if (!activeModel && accessibleModels.length > 0) {
      setActiveModel(accessibleModels[0].id);
    }
  }, [activeModel, accessibleModels, setActiveModel]);

  const isActiveSubscriber =
    currentUser.role === "subscriber" && isSubscriptionActive(currentUser);

  const subscriberModelList = useMemo(() => {
    if (currentUser.role !== "subscriber") return [];

    return accessibleModels.map((model) => {
      const conversationId = getConversationId(model.id, currentUser.id);
      const conversationMessages = messages
        .filter((message) => message.conversationId === conversationId)
        .sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

      const lastMessage =
        conversationMessages.length > 0
          ? conversationMessages[conversationMessages.length - 1]
          : null;

      return {
        model,
        conversationId,
        lastMessage,
        subscribed: isModelSubscribedByUser(currentUser, model.id),
      };
    });
  }, [accessibleModels, currentUser, messages]);

  const internalConversationList = useMemo(() => {
    if (!activeModel || currentUser.role === "subscriber") return [];

    const modelMessages = messages.filter((message) => message.modelId === activeModel.id);
    const grouped = new Map<
      string,
      {
        id: string;
        fan: (typeof users)[number];
        lastMessage: (typeof modelMessages)[number] | null;
        count: number;
      }
    >();

    modelMessages.forEach((message) => {
      const [, , fanId] = message.conversationId.split("|");
      const fan = users.find((user) => user.id === fanId && user.role === "subscriber");

      if (!fan) return;

      const existing = grouped.get(message.conversationId);

      if (!existing) {
        grouped.set(message.conversationId, {
          id: message.conversationId,
          fan,
          lastMessage: message,
          count: 1,
        });
        return;
      }

      const existingTime = existing.lastMessage
        ? new Date(existing.lastMessage.createdAt).getTime()
        : 0;
      const currentTime = new Date(message.createdAt).getTime();

      grouped.set(message.conversationId, {
        ...existing,
        lastMessage: currentTime > existingTime ? message : existing.lastMessage,
        count: existing.count + 1,
      });
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [activeModel, currentUser.role, messages, users]);

  useEffect(() => {
    if (currentUser.role === "subscriber") return;

    if (internalConversationList.length === 0) {
      if (selectedConversationId !== null) {
        setSelectedConversationId(null);
      }
      return;
    }

    if (
      !selectedConversationId ||
      !internalConversationList.some((item) => item.id === selectedConversationId)
    ) {
      setSelectedConversationId(internalConversationList[0].id);
    }
  }, [currentUser.role, internalConversationList, selectedConversationId]);

  const selectedInternalConversation =
    currentUser.role === "subscriber"
      ? null
      : internalConversationList.find((item) => item.id === selectedConversationId) ?? null;

  const selectedMessages =
    currentUser.role === "subscriber"
      ? activeModel
        ? messages
            .filter(
              (message) =>
                message.conversationId === getConversationId(activeModel.id, currentUser.id),
            )
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            )
        : []
      : selectedInternalConversation
        ? messages
            .filter((message) => message.conversationId === selectedInternalConversation.id)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            )
        : [];

  const handleSimulatePayment = (contentId: string) => {
    const result = simulatePayment(contentId, "chat");
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

  const handleSendMessage = (text: string) => {
    if (!activeModel) {
      pushToast("Modèle introuvable", "Sélectionne d’abord une modèle.");
      return;
    }

    const conversationId =
      currentUser.role === "subscriber"
        ? getConversationId(activeModel.id, currentUser.id)
        : selectedInternalConversation?.id ?? null;

    if (!conversationId) {
      pushToast("Conversation introuvable", "Impossible d’envoyer le message.");
      return;
    }

    const result = sendMessage(conversationId, activeModel.id, text);

    if (!result.ok) {
      pushToast("Envoi impossible", result.message);
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

  if (currentUser.role === "subscriber") {
    const activeModelPublicPosts = activeModel
      ? content.filter(
          (item) => item.creatorId === activeModel.id && item.visibility === "public",
        )
      : [];

    const activeModelSubscribed =
      activeModel ? isModelSubscribedByUser(currentUser, activeModel.id) : false;

    return (
      <>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
          <Card className="h-fit">
            <CardContent className="p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Modèles</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choisis d’abord la modèle.
                </p>
              </div>

              <div className="space-y-3">
                {subscriberModelList.map((item) => {
                  const active = activeModel?.id === item.model.id;

                  return (
                    <button
                      key={item.model.id}
                      type="button"
                      onClick={() => setActiveModel(item.model.id)}
                      className={`w-full rounded-[1.1rem] border p-3 text-left transition ${
                        active
                          ? "border-pink-500/40 bg-pink-500/10"
                          : "border-white/5 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={item.model.avatar} />
                          <AvatarFallback>
                            {item.model.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-medium">{item.model.displayName}</p>
                            <Badge variant={item.subscribed ? "success" : "warning"}>
                              {item.subscribed ? "abonné" : "non abonné"}
                            </Badge>
                          </div>

                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {item.lastMessage?.text ?? "Aucune conversation"}
                          </p>

                          <p className="mt-2 text-xs text-muted-foreground">
                            {item.lastMessage
                              ? formatDate(item.lastMessage.createdAt)
                              : "Aucun message"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {!activeModel ? (
            <Card>
              <CardContent className="flex min-h-[420px] items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">Sélectionne une modèle</p>
                </div>
              </CardContent>
            </Card>
          ) : activeModelSubscribed && isActiveSubscriber ? (
            <ChatThread
              currentUser={currentUser}
              title={activeModel.displayName}
              subtitle={
                currentUser.subscriptionExpiresAt
                  ? `Audience privée · expire le ${formatDate(currentUser.subscriptionExpiresAt)}`
                  : "Audience privée"
              }
              canReply={true}
              replyPlaceholder={`Écrire à ${activeModel.displayName}`}
              messages={selectedMessages}
              content={content.filter((item) => item.creatorId === activeModel.id)}
              transactions={transactions}
              onSendMessage={handleSendMessage}
              onSimulatePayment={handleSimulatePayment}
            />
          ) : (
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
                          Tu consultes <strong>{activeModel.displayName}</strong>. Abonne-toi pour accéder au chat privé et aux contenus abonnés.
                        </p>
                      </div>
                    </div>

                    <Button variant="premium" size="lg" onClick={openSubscribeModal}>
                      S’abonner
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                {activeModelPublicPosts.map((item) => (
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
            </div>
          )}
        </div>

        {subscribeOpen && activeModel ? (
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
                  <span className="font-medium text-white">{subscriptionEndsPreview}</span>
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

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">

      <Card className="h-fit">
        <CardContent className="p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Fans</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique sur un fan pour ouvrir sa conversation.
            </p>
          </div>

          <div className="space-y-3">
            {internalConversationList.map((item) => {
              const active = selectedInternalConversation?.id === item.id;
              const fanIsActive = isModelSubscribedByUser(item.fan, activeModel?.id ?? "");

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

            {internalConversationList.length === 0 ? (
              <div className="rounded-[1.1rem] border border-white/5 bg-white/5 p-4 text-sm text-muted-foreground">
                Aucune conversation pour cette modèle.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {selectedInternalConversation && activeModel ? (
        <ChatThread
          currentUser={currentUser}
          title={selectedInternalConversation.fan.displayName}
          subtitle={`${activeModel.displayName} · ${
            isModelSubscribedByUser(selectedInternalConversation.fan, activeModel.id)
              ? "fan abonné"
              : "fan non abonné"
          }`}
          canReply={true}
          replyPlaceholder={`Répondre comme ${activeModel.displayName}`}
          messages={selectedMessages}
          content={content.filter((item) => item.creatorId === activeModel.id)}
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
                Choisis d’abord la modèle, puis un fan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}