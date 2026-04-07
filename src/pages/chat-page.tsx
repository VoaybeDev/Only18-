import { useEffect, useMemo, useState } from "react";
import { Lock, MessageCircle } from "lucide-react";
import { ChatThread } from "@/components/chat-thread";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

export function ChatPage() {
  const currentUser = useAppStore(selectCurrentUser);
  const users = useAppStore((state) => state.users);
  const messages = useAppStore((state) => state.messages);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const pushToast = useAppStore((state) => state.pushToast);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSimulatePayment = (contentId: string) => {
    const result = simulatePayment(contentId, "chat");
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

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

  const ownConversationId =
    currentUser.role === "subscriber" ? `conv-${currentUser.id}` : null;

  useEffect(() => {
    if (currentUser.role === "subscriber") {
      setSelectedConversationId(ownConversationId);
      return;
    }

    if (!selectedConversationId && conversationList.length > 0) {
      setSelectedConversationId(conversationList[0].id);
    }

    if (
      selectedConversationId &&
      !conversationList.some((item) => item.id === selectedConversationId)
    ) {
      setSelectedConversationId(conversationList[0]?.id ?? null);
    }
  }, [currentUser.role, ownConversationId, selectedConversationId, conversationList]);

  const selectedConversation =
    currentUser.role === "subscriber"
      ? conversationList.find((item) => item.id === ownConversationId) ?? null
      : conversationList.find((item) => item.id === selectedConversationId) ?? null;

  const selectedMessages = selectedConversation
    ? messages
        .filter((message) => message.conversationId === selectedConversation.id)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
    : [];

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

  const publicPosts = content.filter(
    (item) => item.visibility === "public" || item.price === 0,
  );

  const isInactiveSubscriber =
    currentUser.role === "subscriber" &&
    currentUser.subscriptionStatus !== "active";

  if (isInactiveSubscriber) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-300">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Audience privée réservée aux abonnés</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ce compte n’est pas abonné. Il peut voir seulement les publications publiques
                  de la modèle.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <p className="mt-1 text-sm text-muted-foreground">{item.caption}</p>
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
    );
  }

  if (currentUser.role !== "subscriber") {
    return (
      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardContent className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Fans</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Clique sur un fan pour ouvrir sa conversation.
              </p>
            </div>

            <div className="space-y-3">
              {conversationList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedConversationId(item.id)}
                  className={`w-full rounded-[1.1rem] border p-3 text-left transition ${
                    selectedConversationId === item.id
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
                        <Badge
                          variant={
                            item.fan.subscriptionStatus === "active" ? "success" : "warning"
                          }
                        >
                          {item.fan.subscriptionStatus === "active"
                            ? "abonné"
                            : "non abonné"}
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
              ))}

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
              selectedConversation.fan.subscriptionStatus === "active"
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
      subtitle="Audience privée"
      canReply={currentUser.subscriptionStatus === "active"}
      replyPlaceholder={
        currentUser.subscriptionStatus === "active"
          ? "Écrire à modele_test"
          : "Réservé aux abonnés"
      }
      messages={selectedMessages}
      content={content}
      transactions={transactions}
      onSendMessage={handleSendMessage}
      onSimulatePayment={handleSimulatePayment}
    />
  );
}