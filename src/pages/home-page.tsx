import { Crown, Eye, LockKeyhole, Sparkles } from "lucide-react";
import { ContentCard } from "@/components/content-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { hasAccessToContent, selectCurrentUser, useAppStore } from "@/store/useAppStore";

export function HomePage() {
  const currentUser = useAppStore(selectCurrentUser);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const pushToast = useAppStore((state) => state.pushToast);

  if (!currentUser) return null;

  const unlockedCount = content.filter((item) => hasAccessToContent(currentUser, item, transactions)).length;
  const paidCount = content.filter((item) => item.price > 0).length;
  const highestPrice = Math.max(...content.map((item) => item.price), 0);

  const handleSimulatePayment = (contentId: string) => {
    const result = simulatePayment(contentId);
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Badge variant="premium">Catalogue premium</Badge>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Contenus gratuits et PPV prêts à tester avec reveal instantané.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Les médias payants sont floutés jusqu’au paiement simulé. Les comptes internes ont accès direct, le subscriber doit déverrouiller.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">React Router protégé</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Persistance locale</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Design sombre premium</div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-pink-500/10 p-3 text-pink-300"><Eye className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Accès actuel</p>
                  <p className="text-2xl font-semibold">{unlockedCount}/{content.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300"><LockKeyhole className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Médias PPV</p>
                  <p className="text-2xl font-semibold">{paidCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-white/5 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300"><Crown className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket max</p>
                  <p className="text-2xl font-semibold">{formatCurrency(highestPrice)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold">Catalogue</h3>
          <p className="text-sm text-muted-foreground">Images et vidéo simulées avec URLs publiques.</p>
        </div>
        <Badge variant="accent">
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {currentUser.role}
        </Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {content.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            unlocked={hasAccessToContent(currentUser, item, transactions)}
            onSimulatePayment={handleSimulatePayment}
          />
        ))}
      </div>
    </div>
  );
}
