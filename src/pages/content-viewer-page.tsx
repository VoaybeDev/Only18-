import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
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

  const handleSimulatePayment = () => {
    const result = simulatePayment(content.id);
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

  return (
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
              {content.mediaType === "video" && unlocked ? (
                <video src={content.mediaUrl} controls className="h-full w-full object-cover" />
              ) : (
                <img
                  src={unlocked ? content.mediaUrl : content.previewUrl}
                  alt={content.title}
                  className={`h-full w-full object-cover ${unlocked ? "blur-0" : "blur-lg"}`}
                />
              )}
              {!unlocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 p-6 text-center">
                  <div className="rounded-full bg-black/60 p-4 text-white shadow-premium">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">Média verrouillé</p>
                    <p className="mt-2 text-sm text-white/80">Le contenu se révèle instantanément après le paiement simulé.</p>
                  </div>
                  <Button variant="premium" size="lg" onClick={handleSimulatePayment}>
                    Simuler Paiement — {formatCurrency(content.price)}
                  </Button>
                </div>
              ) : null}
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
                : "Effet blur actif jusqu’au paiement simulé. Le bouton reste volontairement très visible pour tester le flux."}
            </div>

            {!unlocked && content.price > 0 ? (
              <Button variant="premium" size="lg" className="w-full" onClick={handleSimulatePayment}>
                Débloquer maintenant
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
