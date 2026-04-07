import { DollarSign, LockOpen, Percent, ShoppingBag } from "lucide-react";
import { DashboardRevenueChart } from "@/components/dashboard-revenue-chart";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

export function DashboardPage() {
  const currentUser = useAppStore(selectCurrentUser);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);

  if (!currentUser) return null;

  const salesForModel = transactions.filter((transaction) => transaction.sellerId === "user-modele");
  const salesForChateur = transactions.filter((transaction) => transaction.chateurId === currentUser.id);
  const modelRevenue = salesForModel.reduce((sum, transaction) => sum + transaction.amount, 0);
  const chateurRevenueBase = salesForChateur.reduce((sum, transaction) => sum + transaction.amount, 0);
  const chateurCommission = chateurRevenueBase * 0.1;
  const unlockedUnits = transactions.filter((transaction) => transaction.accessGranted).length;

  const chartData = content
    .filter((item) => item.price > 0)
    .map((item) => ({
      label: item.title,
      value: transactions
        .filter((transaction) => transaction.contentId === item.id)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">Dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentUser.role === "modele"
              ? "Vue revenu, ventes et performance catalogue."
              : "Vue commission et ventes générées par le chateur."}
          </p>
        </div>
        <Badge variant={currentUser.role === "modele" ? "premium" : "accent"}>{currentUser.role}</Badge>
      </div>

      {currentUser.role === "modele" ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Ventes" value={String(salesForModel.length)} hint="Transactions simulées" icon={ShoppingBag} />
            <StatCard title="Revenu brut" value={formatCurrency(modelRevenue)} hint="Toutes ventes confondues" icon={DollarSign} />
            <StatCard title="Contenus unlock" value={String(unlockedUnits)} hint="Accès accordés" icon={LockOpen} />
            <StatCard title="Commission chateur" value={formatCurrency(salesForModel.filter((tx) => tx.chateurId).reduce((sum, tx) => sum + tx.amount * 0.1, 0))} hint="10% sur les ventes attribuées" icon={Percent} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Revenu par média</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardRevenueChart data={chartData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Catalogue payant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {content.map((item) => (
                  <div key={item.id} className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.caption}</p>
                      </div>
                      <Badge variant={item.price === 0 ? "success" : "premium"}>{formatCurrency(item.price)}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Ventes générées" value={String(salesForChateur.length)} hint="Transactions associées" icon={ShoppingBag} />
            <StatCard title="Base générée" value={formatCurrency(chateurRevenueBase)} hint="Volume vendu via le chat" icon={DollarSign} />
            <StatCard title="Commission 10%" value={formatCurrency(chateurCommission)} hint="Règle fixe de la démo" icon={Percent} />
            <StatCard title="Packs PPV" value={String(content.filter((item) => item.chateurId === currentUser.id).length)} hint="Contenus associés" icon={LockOpen} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Performance par offre</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardRevenueChart
                  data={content
                    .filter((item) => item.chateurId === currentUser.id)
                    .map((item) => ({
                      label: item.title,
                      value: transactions
                        .filter((transaction) => transaction.contentId === item.id)
                        .reduce((sum, transaction) => sum + transaction.amount, 0),
                    }))}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Règle métier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p>Le subscriber ne doit jamais savoir qu’un chateur existe.</p>
                <p>Dans le chat fan, chaque message du chateur prend automatiquement le nom visible <strong>modele_test</strong>.</p>
                <p>La commission appliquée ici est fixe et simulée à <strong>10%</strong> du montant vendu.</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
