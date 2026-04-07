import { Link } from "react-router-dom";
import { CreditCard, Lock, SendHorizontal, X } from "lucide-react";
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
  title: string;
  subtitle?: string;
  messages: Message[];
  content: ContentItem[];
  transactions: Transaction[];
  canReply: boolean;
  replyPlaceholder: string;
  onSendMessage: (text: string) => void;
  onSimulatePayment: (contentId: string) => void;
}

const MODEL_AVATAR_URL = "https://picsum.photos/id/64/100/100";
const FAN_AVATAR_URL = "https://picsum.photos/id/1005/100/100";

export function ChatThread({
  currentUser,
  title,
  subtitle,
  messages,
  content,
  transactions,
  canReply,
  replyPlaceholder,
  onSendMessage,
  onSimulatePayment,
}: ChatThreadProps) {
  const [draft, setDraft] = useState("");
  const [paymentTarget, setPaymentTarget] = useState<ContentItem | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const contentById = useMemo(
    () => Object.fromEntries(content.map((item) => [item.id, item])),
    [content],
  );

  const canAccess = (item: ContentItem) => {
    if (currentUser.role !== "subscriber") return true;
    if (item.price === 0) return true;

    return transactions.some(
      (transaction) =>
        transaction.contentId === item.id &&
        transaction.buyerId === currentUser.id &&
        transaction.accessGranted,
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
    return <Badge variant="default">fan</Badge>;
  };

  const resolveAvatarSrc = (message: Message) => {
    if (message.senderRole === "subscriber") {
      return FAN_AVATAR_URL;
    }

    return MODEL_AVATAR_URL;
  };

  const handleSubmit = () => {
    if (!draft.trim() || !canReply) return;
    onSendMessage(draft);
    setDraft("");
  };

  const openPaymentModal = (item: ContentItem) => {
    setPaymentTarget(item);
  };

  const closePaymentModal = () => {
    if (isProcessingPayment) return;
    setPaymentTarget(null);
  };

  const confirmPayment = async () => {
    if (!paymentTarget) return;

    setIsProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    onSimulatePayment(paymentTarget.id);
    setIsProcessingPayment(false);
    setPaymentTarget(null);
  };

  return (
    <>
      <div className="flex min-h-[70dvh] w-full min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-white/5 bg-card/80 shadow-premium lg:min-h-[calc(100dvh-9rem)]">
        <div className="border-b border-white/5 p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Conversation active</p>
              <h2 className="truncate text-xl font-semibold sm:text-2xl">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            {currentUser.role !== "subscriber" ? (
              <Badge variant="warning" className="w-fit">
                Invisible côté fan
              </Badge>
            ) : (
              <Badge variant={canReply ? "success" : "warning"} className="w-fit">
                {canReply ? "Chat privé" : "Public uniquement"}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {messages.map((message) => {
            const attachedContent = message.contentId ? contentById[message.contentId] : undefined;
            const unlocked = attachedContent ? canAccess(attachedContent) : false;

            const isInternalSession =
              currentUser.role === "modele" || currentUser.role === "chateur";

            const isInternalMessage =
              message.senderRole === "modele" || message.senderRole === "chateur";

            const isRightAligned = isInternalSession
              ? isInternalMessage
              : message.senderId === currentUser.id;

            return (
              <div
                key={message.id}
                className={`flex ${isRightAligned ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[96%] sm:max-w-[84%] lg:max-w-[74%]">
                  <div
                    className={`mb-2 flex items-center gap-2 sm:gap-3 ${
                      isRightAligned ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isRightAligned ? (
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                        <AvatarImage src={resolveAvatarSrc(message)} />
                        <AvatarFallback>
                          {resolveSenderName(message).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}

                    <div
                      className={`flex flex-wrap items-center gap-2 ${
                        isRightAligned ? "justify-end text-right" : ""
                      }`}
                    >
                      <span className="text-sm font-medium">{resolveSenderName(message)}</span>
                      {resolveRoleBadge(message.senderRole)}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>

                  <Card
                    className={`rounded-[1.25rem] ${
                      isRightAligned ? "bg-primary/15" : "bg-white/5"
                    }`}
                  >
                    <div className="p-4">
                      <p className="text-sm leading-6 text-white/90">{message.text}</p>

                      {attachedContent ? (
                        <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/10 bg-background/70">
                          <div className="relative aspect-[16/10] overflow-hidden bg-black">
                            {unlocked ? (
                              attachedContent.mediaType === "video" ? (
                                <video
                                  src={attachedContent.mediaUrl}
                                  controls
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <img
                                  src={attachedContent.mediaUrl}
                                  alt={attachedContent.title}
                                  className="h-full w-full object-cover"
                                />
                              )
                            ) : (
                              <>
                                <img
                                  src={attachedContent.previewUrl}
                                  alt={attachedContent.title}
                                  className="pointer-events-none h-full w-full scale-110 select-none object-cover blur-2xl brightness-50 saturate-50"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/70" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                                  <div className="rounded-full bg-black/70 p-3 text-white shadow-premium">
                                    <Lock className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="text-base font-semibold text-white">
                                      Média verrouillé
                                    </p>
                                    <p className="mt-1 text-sm text-white/75">
                                      Paiement requis pour révéler le contenu complet.
                                    </p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium">{attachedContent.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {attachedContent.caption}
                                </p>
                              </div>

                              <Badge
                                variant={attachedContent.price === 0 ? "success" : "premium"}
                                className="shrink-0"
                              >
                                {attachedContent.price === 0
                                  ? "Free"
                                  : formatCurrency(attachedContent.price)}
                              </Badge>
                            </div>

                            {!unlocked && attachedContent.price > 0 ? (
                              <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 px-3 py-2 text-xs text-white/75">
                                Aperçu masqué jusqu’au paiement simulé.
                              </div>
                            ) : null}

                            <div className="flex flex-col gap-3 sm:flex-row">
                              <Button asChild variant="secondary" className="flex-1">
                                <Link to={`/content/${attachedContent.id}`}>
                                  {unlocked ? "Voir" : "Voir détails"}
                                </Link>
                              </Button>

                              {!unlocked && attachedContent.price > 0 ? (
                                <Button
                                  variant="premium"
                                  className="flex-1"
                                  onClick={() => openPaymentModal(attachedContent)}
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

          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-lg font-medium">Aucun message</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cette conversation est vide pour le moment.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/5 p-3 sm:p-5 lg:p-6">
          {canReply ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={replyPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                className="min-w-0"
              />
              <Button
                variant="premium"
                size="icon"
                onClick={handleSubmit}
                className="shrink-0 self-end sm:self-auto"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-[1rem] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              La messagerie privée est réservée aux fans abonnés.
            </div>
          )}
        </div>
      </div>

      {paymentTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#0f0b18] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-pink-300">Paiement simulé</p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Débloquer {paymentTarget.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
                disabled={isProcessingPayment}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/40">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={paymentTarget.previewUrl}
                  alt={paymentTarget.title}
                  className="h-full w-full scale-110 object-cover blur-2xl brightness-50 saturate-50"
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Contenu</span>
                <span className="font-medium text-white">{paymentTarget.title}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-white">
                  {formatCurrency(paymentTarget.price)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Compte débité</span>
                <span className="font-medium text-white">•••• 4242</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Destinataire visible</span>
                <span className="font-medium text-white">modele_test</span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={closePaymentModal}
                disabled={isProcessingPayment}
              >
                Annuler
              </Button>
              <Button
                variant="premium"
                className="flex-1"
                onClick={confirmPayment}
                disabled={isProcessingPayment}
              >
                <CreditCard className="h-4 w-4" />
                {isProcessingPayment ? "Paiement..." : "Payer maintenant"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}