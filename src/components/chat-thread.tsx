import { Link } from "react-router-dom";
import { Lock, SendHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ContentItem, Message, Role, Transaction, User } from "@/types";

interface ChatThreadProps {
  currentUser: User;
  messages: Message[];
  content: ContentItem[];
  transactions: Transaction[];
  onSendMessage: (text: string) => void;
  onSimulatePayment: (contentId: string) => void;
}

export function ChatThread({
  currentUser,
  messages,
  content,
  transactions,
  onSendMessage,
  onSimulatePayment,
}: ChatThreadProps) {
  const [draft, setDraft] = useState("");

  const contentById = useMemo(
    () => Object.fromEntries(content.map((item) => [item.id, item])),
    [content],
  );

  const canAccess = (item: ContentItem) => {
    if (currentUser.role !== "subscriber") return true;
    if (item.price === 0) return true;
    return transactions.some(
      (transaction) =>
        transaction.contentId === item.id && transaction.buyerId === currentUser.id && transaction.accessGranted,
    );
  };

  const resolveSenderName = (message: Message) => {
    if (currentUser.role === "subscriber") {
      return message.subscriberVisibleSenderName;
    }
    return message.senderDisplayName;
  };

  const resolveRoleBadge = (messageRole: Role) => {
    if (currentUser.role === "subscriber") return null;
    if (messageRole === "modele") return <Badge variant="premium">modèle</Badge>;
    if (messageRole === "chateur") return <Badge variant="accent">chateur</Badge>;
    return <Badge variant="default">subscriber</Badge>;
  };

  const handleSubmit = () => {
    if (!draft.trim()) return;
    onSendMessage(draft);
    setDraft("");
  };

  return (
    <div className="flex h-[calc(100vh-11rem)] min-h-[560px] flex-col overflow-hidden rounded-[1.5rem] border border-white/5 bg-card/80 shadow-premium">
      <div className="border-b border-white/5 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Conversation active</p>
            <h2 className="text-xl font-semibold">
              {currentUser.role === "subscriber" ? "modele_test" : "fan_test"}
            </h2>
          </div>
          {currentUser.role !== "subscriber" ? (
            <Badge variant="warning">Invisible côté fan</Badge>
          ) : (
            <Badge variant="success">Chat direct</Badge>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.map((message) => {
          const isMe = message.senderId === currentUser.id;
          const attachedContent = message.contentId ? contentById[message.contentId] : undefined;
          const unlocked = attachedContent ? canAccess(attachedContent) : false;

          return (
            <div key={message.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[92%] sm:max-w-[78%] ${isMe ? "order-2" : "order-1"}`}>
                <div className="mb-2 flex items-center gap-3">
                  {!isMe ? (
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={currentUser.role === "subscriber" ? "https://picsum.photos/id/64/100/100" : "https://picsum.photos/id/65/100/100"} />
                      <AvatarFallback>O</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{resolveSenderName(message)}</span>
                    {resolveRoleBadge(message.senderRole)}
                    <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                  </div>
                </div>
                <Card className={`rounded-[1.25rem] ${isMe ? "bg-primary/15" : "bg-white/5"}`}>
                  <div className="p-4">
                    <p className="text-sm leading-6 text-white/90">{message.text}</p>
                    {attachedContent ? (
                      <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/10 bg-background/70">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <img
                            src={attachedContent.previewUrl}
                            alt={attachedContent.title}
                            className={`h-full w-full object-cover ${unlocked ? "blur-0" : "blur-md"}`}
                          />
                          {!unlocked ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="rounded-full bg-black/60 p-3 text-white">
                                <Lock className="h-5 w-5" />
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{attachedContent.title}</p>
                              <p className="text-sm text-muted-foreground">{attachedContent.caption}</p>
                            </div>
                            <Badge variant={attachedContent.price === 0 ? "success" : "premium"}>
                              {attachedContent.price === 0 ? "Free" : formatCurrency(attachedContent.price)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <Button asChild variant="secondary" className="flex-1">
                              <Link to={`/content/${attachedContent.id}`}>Voir</Link>
                            </Button>
                            {!unlocked && attachedContent.price > 0 ? (
                              <Button
                                variant="premium"
                                className="flex-1"
                                onClick={() => onSimulatePayment(attachedContent.id)}
                              >
                                Simuler paiement
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/5 p-4 sm:p-6">
        <div className="flex gap-3">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={currentUser.role === "subscriber" ? "Écrire à modele_test" : "Répondre au fan"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button variant="premium" size="icon" onClick={handleSubmit}>
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
