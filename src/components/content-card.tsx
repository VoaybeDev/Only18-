import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Lock, PlayCircle, X } from "lucide-react";
import { ContentItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ContentCardProps {
  item: ContentItem;
  unlocked: boolean;
  onSimulatePayment: (contentId: string) => void;
}

export function ContentCard({
  item,
  unlocked,
  onSimulatePayment,
}: ContentCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isPaidLocked = item.price > 0 && !unlocked;
  const isSubscriberOnly = item.visibility === "subscriber" && item.price === 0;

  const openPaymentModal = () => {
    if (!isPaidLocked) return;
    setPaymentOpen(true);
  };

  const closePaymentModal = () => {
    if (isProcessingPayment) return;
    setPaymentOpen(false);
  };

  const confirmPayment = async () => {
    setIsProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    onSimulatePayment(item.id);
    setIsProcessingPayment(false);
    setPaymentOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-card/80 shadow-premium">
        <div className="relative aspect-[16/10] overflow-hidden bg-black">
          {unlocked ? (
            item.mediaType === "video" ? (
              <video
                src={item.mediaUrl}
                controls
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <>
              <img
                src={item.previewUrl}
                alt={item.title}
                className={`h-full w-full object-cover ${
                  item.price > 0 || item.visibility === "subscriber"
                    ? "scale-110 blur-2xl brightness-50 saturate-50"
                    : ""
                }`}
              />

              {(item.price > 0 || item.visibility === "subscriber") && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/75" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="rounded-full bg-black/70 p-3 text-white shadow-premium">
                      {item.mediaType === "video" ? (
                        <PlayCircle className="h-5 w-5" />
                      ) : (
                        <Lock className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <p className="text-base font-semibold text-white">
                        {item.price > 0 ? "Contenu verrouillé" : "Réservé aux abonnés"}
                      </p>
                      <p className="mt-1 text-sm text-white/75">
                        {item.price > 0
                          ? "Débloque ce média PPV en un clic."
                          : "Accès privé réservé aux abonnés actifs."}
                      </p>
                    </div>

                    {isPaidLocked ? (
                      <Button variant="premium" onClick={openPaymentModal}>
                        Simuler Paiement — {formatCurrency(item.price)}
                      </Button>
                    ) : null}
                  </div>
                </>
              )}
            </>
          )}

          <div className="absolute left-3 top-3 flex gap-2">
            {item.mediaType === "video" ? (
              <Badge variant="accent">Vidéo</Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.caption}
              </p>
            </div>

            {item.visibility === "public" ? (
              <Badge variant="success" className="shrink-0">
                Public
              </Badge>
            ) : item.visibility === "subscriber" ? (
              <Badge variant="accent" className="shrink-0">
                Abonnés
              </Badge>
            ) : (
              <Badge variant="premium" className="shrink-0">
                {formatCurrency(item.price)}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary" className="flex-1">
              <Link to={`/content/${item.id}`}>
                {unlocked ? "Ouvrir" : "Voir"}
              </Link>
            </Button>

            {isPaidLocked ? (
              <Button
                variant="premium"
                className="flex-1"
                onClick={openPaymentModal}
              >
                Débloquer
              </Button>
            ) : null}
          </div>

          {isSubscriberOnly && !unlocked ? (
            <div className="rounded-[1rem] border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              Ce contenu devient accessible avec un abonnement actif.
            </div>
          ) : null}
        </div>
      </Card>

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#0f0b18] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-pink-300">Paiement simulé</p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Débloquer {item.title}
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
                  src={item.previewUrl}
                  alt={item.title}
                  className="h-full w-full scale-110 object-cover blur-2xl brightness-50 saturate-50"
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Contenu</span>
                <span className="font-medium text-white">{item.title}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-white">
                  {formatCurrency(item.price)}
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