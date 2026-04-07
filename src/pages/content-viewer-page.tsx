import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { hasAccessToContent, selectCurrentUser, useAppStore } from "@/store/useAppStore";

export function ContentViewerPage() {
  const { contentId } = useParams();
  const currentUser = useAppStore(selectCurrentUser);
  const content = useAppStore((state) => state.content.find((item) => item.id === contentId));
  const transactions = useAppStore((state) => state.transactions);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const pushToast = useAppStore((state) => state.pushToast);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  if (!currentUser || !content) {
    return (
      <Card>
        <CardContent className="p-8">
          <p>Contenu introuvable.</p>
        </CardContent>
      </Card>
    );
  }

  const unlocked = hasAccessToContent(currentUser, content, transactions);
  const isLockedForViewer =
    currentUser.role === "subscriber" && content.price > 0 && !unlocked;

  const openPaymentModal = () => {
    if (!isLockedForViewer) return;
    setPaymentOpen(true);
  };

  const closePaymentModal = () => {
    if (isProcessingPayment) return;
    setPaymentOpen(false);
  };

  const confirmPayment = async () => {
    setIsProcessingPayment(true);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = simulatePayment(content.id, "viewer");

    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }

    setIsProcessingPayment(false);
    setPaymentOpen(false);
  };

  return (
    <>
      <div className="space-y-6">
        <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-white">
          <Link to="/home">
            <ArrowLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>
        </Button>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                {unlocked ? (
                  content.mediaType === "video" ? (
                    <video
                      src={content.mediaUrl}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={content.mediaUrl}
                      alt={content.title}
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <>
                    <img
                      src={content.previewUrl}
                      alt={content.title}
                      className="pointer-events-none h-full w-full scale-110 select-none object-cover blur-2xl brightness-50 saturate-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/75" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <div className="rounded-full bg-black/70 p-4 text-white shadow-premium">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xl font-semibold">Média verrouillé</p>
                        <p className="mt-2 text-sm text-white/80">
                          Le contenu complet apparaît après le paiement simulé.
                        </p>
                      </div>

                      {content.price > 0 ? (
                        <Button variant="premium" size="lg" onClick={openPaymentModal}>
                          Simuler Paiement — {formatCurrency(content.price)}
                        </Button>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Viewer</p>
                  <h2 className="text-3xl font-semibold">{content.title}</h2>
                </div>
                <Badge variant={content.price === 0 ? "success" : "premium"}>
                  {content.price === 0 ? "Free" : formatCurrency(content.price)}
                </Badge>
              </div>

              <p className="text-base leading-7 text-muted-foreground">{content.caption}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="mt-2 font-medium capitalize">{content.mediaType}</p>
                </div>
                <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="mt-2 font-medium">{formatDate(content.createdAt)}</p>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-5 text-sm text-muted-foreground">
                {unlocked
                  ? "Le contenu est déverrouillé pour ce compte."
                  : content.price === 0
                    ? "Ce contenu gratuit est visible immédiatement."
                    : "Le contenu reste flouté tant que le paiement simulé n’a pas été validé."}
              </div>

              {!unlocked && content.price > 0 ? (
                <Button variant="premium" size="lg" className="w-full" onClick={openPaymentModal}>
                  Débloquer maintenant
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-[#0f0b18] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-pink-300">Paiement simulé</p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Débloquer {content.title}
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
                  src={content.previewUrl}
                  alt={content.title}
                  className="h-full w-full scale-110 object-cover blur-2xl brightness-50 saturate-50"
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Contenu</span>
                <span className="font-medium text-white">{content.title}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-white">{formatCurrency(content.price)}</span>
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