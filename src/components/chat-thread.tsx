import { Link } from "react-router-dom";
import {
  CreditCard,
  ImagePlus,
  Lock,
  PencilLine,
  SendHorizontal,
  SmilePlus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { demoMediaLibrary, demoScripts } from "@/data/seed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  ContentItem,
  MediaLibraryItem,
  Message,
  Role,
  ScriptTemplate,
  SendMessagePayload,
  Transaction,
  User,
} from "@/types";

interface ChatThreadProps {
  currentUser: User;
  activeModel: User | null;
  title: string;
  subtitle?: string;
  messages: Message[];
  content: ContentItem[];
  transactions: Transaction[];
  canReply: boolean;
  replyPlaceholder: string;
  onSendMessage: (payload: SendMessagePayload) => void;
  onSimulatePayment: (contentId: string) => void;
  onUpdateContentPrice: (contentId: string, nextPrice: number) => void;
  onDeleteContent: (contentId: string) => void;
}

const DEFAULT_EMOJIS = ["😍", "🔥", "😉", "❤️", "🥵", "😘", "😈", "👀"];

export function ChatThread({
  currentUser,
  activeModel,
  title,
  subtitle,
  messages,
  content,
  transactions,
  canReply,
  replyPlaceholder,
  onSendMessage,
  onSimulatePayment,
  onUpdateContentPrice,
  onDeleteContent,
}: ChatThreadProps) {
  const [draft, setDraft] = useState("");
  const [paymentTarget, setPaymentTarget] = useState<ContentItem | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [scriptsOpen, setScriptsOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const [scriptSearch, setScriptSearch] = useState("");
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "image" | "video">("all");
  const [selectedScriptPhase, setSelectedScriptPhase] = useState<string>("Tous");
  const [draftMedia, setDraftMedia] = useState<MediaLibraryItem | null>(null);
  const [draftMediaPrice, setDraftMediaPrice] = useState(0);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  const isInternalComposer = currentUser.role === "modele" || currentUser.role === "chateur";

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

  const isSold = (item: ContentItem) =>
    transactions.some(
      (transaction) => transaction.contentId === item.id && transaction.accessGranted,
    );

  useEffect(() => {
    if (!draftMedia) return;
    setDraftMediaPrice(draftMedia.defaultPrice);
  }, [draftMedia]);

  const availableMedia = useMemo(() => {
    const baseItems =
      currentUser.role === "subscriber"
        ? demoMediaLibrary.filter((item) => item.id.startsWith("fan-media-"))
        : demoMediaLibrary.filter(
            (item) => !item.ownerModelId || item.ownerModelId === activeModel?.id,
          );

    return baseItems.filter((item) => {
      const matchesType =
        selectedMediaType === "all" ? true : item.mediaType === selectedMediaType;
      const haystack = `${item.title} ${item.caption} ${item.collection}`.toLowerCase();
      const matchesSearch = haystack.includes(mediaSearch.trim().toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [activeModel?.id, currentUser.role, mediaSearch, selectedMediaType]);

  const mediaCollections = useMemo(() => {
    const grouped = new Map<string, MediaLibraryItem[]>();

    availableMedia.forEach((item) => {
      if (!grouped.has(item.collection)) {
        grouped.set(item.collection, []);
      }
      grouped.get(item.collection)?.push(item);
    });

    return Array.from(grouped.entries());
  }, [availableMedia]);

  const availableScripts = useMemo(() => {
    if (!isInternalComposer) return [];

    const all = demoScripts.filter(
      (script) => !script.ownerModelId || script.ownerModelId === activeModel?.id,
    );

    return all.filter((script) => {
      const matchesPhase =
        selectedScriptPhase === "Tous" ? true : script.phase === selectedScriptPhase;
      const haystack = `${script.phase} ${script.title} ${script.body}`.toLowerCase();
      const matchesSearch = haystack.includes(scriptSearch.trim().toLowerCase());
      return matchesPhase && matchesSearch;
    });
  }, [activeModel?.id, isInternalComposer, scriptSearch, selectedScriptPhase]);

  const scriptPhases = useMemo(() => {
    const phases = Array.from(new Set(demoScripts.map((script) => script.phase)));
    return ["Tous", ...phases];
  }, []);

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
      return currentUser.role === "subscriber" ? currentUser.avatar : undefined;
    }

    return activeModel?.avatar;
  };

  const submitComposer = () => {
    if (!canReply) return;

    const payload: SendMessagePayload = {
      text: draft,
      mediaItem: draftMedia
        ? {
            title: draftMedia.title,
            caption: draftMedia.caption,
            mediaType: draftMedia.mediaType,
            mediaUrl: draftMedia.mediaUrl,
            previewUrl: draftMedia.previewUrl,
            price: isInternalComposer ? draftMediaPrice : 0,
          }
        : null,
    };

    if (!payload.text.trim() && !payload.mediaItem) {
      return;
    }

    onSendMessage(payload);
    setDraft("");
    setDraftMedia(null);
    setDraftMediaPrice(0);
    setEmojiOpen(false);
    setMediaPickerOpen(false);
    setScriptsOpen(false);
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

  const handleSavePrice = (contentId: string, fallbackPrice: number) => {
    const rawValue = editingPrices[contentId] ?? String(fallbackPrice);
    const numericValue = Number(rawValue);

    if (Number.isNaN(numericValue)) return;

    onUpdateContentPrice(contentId, numericValue);
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
            const directAttachment = message.inlineAttachment;
            const unlocked = attachedContent ? canAccess(attachedContent) : true;
            const contentIsSold = attachedContent ? isSold(attachedContent) : false;

            const isInternalSession =
              currentUser.role === "modele" || currentUser.role === "chateur";

            const isInternalMessage =
              message.senderRole === "modele" || message.senderRole === "chateur";

            const isRightAligned = isInternalSession
              ? isInternalMessage
              : message.senderId === currentUser.id;

            const showInternalManagement =
              Boolean(attachedContent) && isInternalComposer && !contentIsSold;

            const rawEditingPrice =
              attachedContent
                ? editingPrices[attachedContent.id] ?? String(attachedContent.price)
                : "0";

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

                            {showInternalManagement ? (
                              <div className="rounded-[1rem] border border-white/10 bg-white/5 p-3">
                                <div className="mb-3 flex items-center gap-2 text-sm text-white/80">
                                  <PencilLine className="h-4 w-4" />
                                  Média interne modifiable tant qu’il n’est pas vendu
                                </div>
                                <div className="flex flex-col gap-3 md:flex-row">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={rawEditingPrice}
                                    onChange={(event) =>
                                      setEditingPrices((previous) => ({
                                        ...previous,
                                        [attachedContent.id]: event.target.value,
                                      }))
                                    }
                                    className="md:max-w-[180px]"
                                  />
                                  <div className="flex flex-1 gap-2">
                                    <Button
                                      variant="secondary"
                                      className="flex-1"
                                      onClick={() =>
                                        handleSavePrice(attachedContent.id, attachedContent.price)
                                      }
                                    >
                                      Enregistrer le prix
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => onDeleteContent(attachedContent.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Supprimer
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {attachedContent && contentIsSold && isInternalComposer ? (
                              <div className="rounded-[1rem] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                                Ce média a déjà été acheté. Le prix et la suppression sont verrouillés.
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

                      {directAttachment ? (
                        <div className="mt-4 overflow-hidden rounded-[1.1rem] border border-white/10 bg-background/70">
                          <div className="relative aspect-[16/10] overflow-hidden bg-black">
                            {directAttachment.mediaType === "video" ? (
                              <video
                                src={directAttachment.mediaUrl}
                                controls
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={directAttachment.previewUrl}
                                alt={directAttachment.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-medium">{directAttachment.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {directAttachment.caption}
                                </p>
                              </div>

                              <Badge variant="success" className="shrink-0">
                                Média fan
                              </Badge>
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
            <div className="space-y-3">
              {draftMedia ? (
                <div className="rounded-[1rem] border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-black">
                        <img
                          src={draftMedia.previewUrl}
                          alt={draftMedia.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div>
                        <p className="font-medium">{draftMedia.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {draftMedia.collection} · {draftMedia.mediaType === "video" ? "Vidéo" : "Photo"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isInternalComposer ? (
                        <Input
                          type="number"
                          min={0}
                          value={draftMediaPrice}
                          onChange={(event) => setDraftMediaPrice(Number(event.target.value))}
                          className="w-[130px]"
                        />
                      ) : (
                        <Badge variant="success">Sans PPV</Badge>
                      )}

                      <Button variant="outline" size="icon" onClick={() => setDraftMedia(null)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1rem] border border-white/10 bg-white/5 p-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEmojiOpen((previous) => !previous);
                      setMediaPickerOpen(false);
                      setScriptsOpen(false);
                    }}
                  >
                    <SmilePlus className="h-4 w-4" />
                    Emoji
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMediaPickerOpen(true);
                      setEmojiOpen(false);
                      setScriptsOpen(false);
                    }}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Médias
                  </Button>

                  {isInternalComposer ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setScriptsOpen(true);
                        setEmojiOpen(false);
                        setMediaPickerOpen(false);
                      }}
                    >
                      <PencilLine className="h-4 w-4" />
                      Script
                    </Button>
                  ) : null}
                </div>

                {emojiOpen ? (
                  <div className="mb-3 flex flex-wrap gap-2 rounded-[1rem] border border-white/10 bg-black/20 p-3">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setDraft((previous) => `${previous}${emoji}`)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xl transition hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={replyPlaceholder}
                    rows={3}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;

                      if (isInternalComposer) {
                        event.preventDefault();
                        return;
                      }

                      if (!event.shiftKey) {
                        event.preventDefault();
                        submitComposer();
                      }
                    }}
                    className={cn(
                      "min-h-[120px] w-full rounded-2xl border border-input bg-white/5 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
                      "resize-none",
                    )}
                  />

                  <Button
                    variant="premium"
                    size="icon"
                    onClick={submitComposer}
                    className="shrink-0 self-end sm:self-auto"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {isInternalComposer ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Entrée n’envoie pas le message pour éviter les erreurs. Utilise le bouton envoyer.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Entrée envoie le message. Utilise Shift + Entrée pour revenir à la ligne.
                  </p>
                )}
              </div>
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
                <span className="font-medium text-white">
                  {activeModel?.displayName ?? "modele_test"}
                </span>
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

      {mediaPickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0f0b18] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-sm text-pink-300">
                  {isInternalComposer ? "Bibliothèque interne" : "Sélection simple"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-white">
                  Sélection de médias ({availableMedia.length})
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-white/10 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Input
                  value={mediaSearch}
                  onChange={(event) => setMediaSearch(event.target.value)}
                  placeholder="Rechercher un média..."
                  className="lg:max-w-xl"
                />

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedMediaType === "all" ? "premium" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedMediaType("all")}
                  >
                    Tous
                  </Button>
                  <Button
                    variant={selectedMediaType === "image" ? "premium" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedMediaType("image")}
                  >
                    Photos
                  </Button>
                  <Button
                    variant={selectedMediaType === "video" ? "premium" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedMediaType("video")}
                  >
                    Vidéos
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-5">
                {mediaCollections.map(([collection, items]) => (
                  <div
                    key={collection}
                    className="rounded-[1.15rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{collection}</p>
                        <p className="text-sm text-muted-foreground">
                          {items.filter((item) => item.mediaType === "image").length} photo(s) ·{' '}
                          {items.filter((item) => item.mediaType === "video").length} vidéo(s)
                        </p>
                      </div>

                      <Badge variant="default" className="border border-white/15 bg-transparent text-white/80"></Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {items.map((item) => {
                        const selected = draftMedia?.id === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setDraftMedia(item)}
                            className={cn(
                              "overflow-hidden rounded-[1rem] border text-left transition",
                              selected
                                ? "border-pink-500/50 bg-pink-500/10"
                                : "border-white/10 bg-black/20 hover:bg-white/5",
                            )}
                          >
                            <div className="relative aspect-[16/10] overflow-hidden bg-black">
                              <img
                                src={item.previewUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute left-3 top-3">
                                <Badge variant={item.mediaType === "video" ? "accent" : "success"}>
                                  {item.mediaType === "video" ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      Vidéo
                                    </span>
                                  ) : (
                                    "Photo"
                                  )}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{item.title}</p>
                                  <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {item.caption}
                                  </p>
                                </div>

                                {isInternalComposer ? (
                                  <Badge variant={item.defaultPrice === 0 ? "success" : "premium"}>
                                    {item.defaultPrice === 0
                                      ? "Free"
                                      : formatCurrency(item.defaultPrice)}
                                  </Badge>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {mediaCollections.length === 0 ? (
                  <div className="rounded-[1.15rem] border border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground">
                    Aucun média trouvé.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {draftMedia ? (
                  <div className="text-sm text-muted-foreground">
                    Sélection actuelle : <span className="font-medium text-white">{draftMedia.title}</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Choisis un média pour l’ajouter au brouillon.
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setMediaPickerOpen(false)}>
                    Fermer
                  </Button>
                  <Button
                    variant="premium"
                    onClick={() => setMediaPickerOpen(false)}
                    disabled={!draftMedia}
                  >
                    Valider la sélection
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {scriptsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0f0b18] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-sm text-pink-300">Bibliothèque de scripts</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Scripts</h3>
              </div>

              <button
                type="button"
                onClick={() => setScriptsOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-white/10 p-5">
              <div className="mb-3 flex flex-wrap gap-2">
                {scriptPhases.map((phase) => (
                  <Button
                    key={phase}
                    variant={selectedScriptPhase === phase ? "premium" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedScriptPhase(phase)}
                  >
                    {phase}
                  </Button>
                ))}
              </div>

              <Input
                value={scriptSearch}
                onChange={(event) => setScriptSearch(event.target.value)}
                placeholder="Rechercher un script..."
              />
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-3">
                {availableScripts.map((script: ScriptTemplate) => (
                  <button
                    key={script.id}
                    type="button"
                    onClick={() => {
                      setDraft((previous) =>
                        previous.trim() ? `${previous}\n\n${script.body}` : script.body,
                      );
                      setScriptsOpen(false);
                    }}
                    className="w-full rounded-[1rem] border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium">{script.title}</p>
                        <p className="mt-1 text-sm text-pink-300">{script.phase}</p>
                        <p className="mt-3 text-sm leading-6 text-white/80">{script.body}</p>
                      </div>

                      <Badge variant="accent">Insérer</Badge>
                    </div>
                  </button>
                ))}

                {availableScripts.length === 0 ? (
                  <div className="rounded-[1rem] border border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground">
                    Aucun script trouvé.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-white/10 p-5 text-xs text-muted-foreground">
              Le script est inséré dans le champ puis peut être modifié avant l’envoi.
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
