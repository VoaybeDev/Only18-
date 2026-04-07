import { DollarSign, LockOpen, Percent, ShoppingBag } from "lucide-react";
import { DashboardRevenueChart } from "@/components/dashboard-revenue-chart";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";
import { PaymentSource } from "@/types";

const formatPreciseCurrency = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const sourceLabel: Record<PaymentSource, string> = {
  chat: "Chat",
  viewer: "Viewer",
  catalogue: "Catalogue",
};

export function DashboardPage() {
  const currentUser = useAppStore(selectCurrentUser);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);

  if (!currentUser) return null;

  const modelTransactions = transactions.filter(
    (transaction) => transaction.creatorId === currentUser.id,
  );

  const chateurTransactions = transactions.filter(
    (transaction) =>
      transaction.soldByUserId === currentUser.id && transaction.soldByRole === "chateur",
  );

  const visibleTransactions =
    currentUser.role === "modele" ? modelTransactions : chateurTransactions;

  const totalUnlockedUnits = transactions.filter((transaction) => transaction.accessGranted).length;

  const modelGrossRevenue = modelTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const modelTotalChatterCommission = modelTransactions.reduce(
    (sum, transaction) => sum + transaction.chatterCommissionAmount,
    0,
  );
  const modelNetRevenue = modelTransactions.reduce(
    (sum, transaction) => sum + transaction.modelNetAmount,
    0,
  );
  const modelDirectSales = modelTransactions.filter(
    (transaction) => transaction.soldByRole === "modele",
  ).length;
  const modelChatterSales = modelTransactions.filter(
    (transaction) => transaction.soldByRole === "chateur",
  ).length;

  const chateurGeneratedBase = chateurTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const chateurCommission = chateurTransactions.reduce(
    (sum, transaction) => sum + transaction.chatterCommissionAmount,
    0,
  );
  const chateurNetForModel = chateurTransactions.reduce(
    (sum, transaction) => sum + transaction.modelNetAmount,
    0,
  );

  const chartData =
    currentUser.role === "modele"
      ? content
          .filter((item) => item.price > 0)
          .map((item) => ({
            label: item.title,
            value: modelTransactions
              .filter((transaction) => transaction.contentId === item.id)
              .reduce((sum, transaction) => sum + transaction.amount, 0),
          }))
      : content
          .filter((item) =>
            chateurTransactions.some((transaction) => transaction.contentId === item.id),
          )
          .map((item) => ({
            label: item.title,
            value: chateurTransactions
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
              ? "Vue détaillée des paiements, du vendeur réel et du net encaissé."
              : "Vue détaillée des ventes attribuées au chateur et de sa commission."}
          </p>
        </div>
        <Badge variant={currentUser.role === "modele" ? "premium" : "accent"}>
          {currentUser.role}
        </Badge>
      </div>

      {currentUser.role === "modele" ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Ventes totales"
              value={String(modelTransactions.length)}
              hint={`${modelDirectSales} par la modèle • ${modelChatterSales} par le chateur`}
              icon={ShoppingBag}
            />
            <StatCard
              title="Revenu brut"
              value={formatPreciseCurrency(modelGrossRevenue)}
              hint="Total payé par les fans"
              icon={DollarSign}
            />
            <StatCard
              title="Net modèle"
              value={formatPreciseCurrency(modelNetRevenue)}
              hint="Après déduction des commissions"
              icon={LockOpen}
            />
            <StatCard
              title="Commission chateur"
              value={formatPreciseCurrency(modelTotalChatterCommission)}
              hint="Somme des 10% attribués"
              icon={Percent}
            />
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
                <CardTitle>Résumé opérationnel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Accès accordés</p>
                  <p className="mt-2 text-2xl font-semibold">{totalUnlockedUnits}</p>
                </div>
                <div className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Ventes réalisées par la modèle</p>
                  <p className="mt-2 text-2xl font-semibold">{modelDirectSales}</p>
                </div>
                <div className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Ventes réalisées par le chateur</p>
                  <p className="mt-2 text-2xl font-semibold">{modelChatterSales}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique détaillé des paiements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {modelTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun paiement pour le moment.</p>
              ) : (
                modelTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{transaction.contentTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Acheté par <strong>{transaction.buyerUsername}</strong> le{" "}
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <Badge variant="premium">
                        {formatPreciseCurrency(transaction.amount)}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Vendu par</p>
                        <p className="mt-1 text-sm font-medium">
                          {transaction.soldByUsername}{" "}
                          <span className="text-muted-foreground">
                            ({transaction.soldByRole === "chateur" ? "chateur" : "modèle"})
                          </span>
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="mt-1 text-sm font-medium">
                          {sourceLabel[transaction.source]}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Commission chateur</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatPreciseCurrency(transaction.chatterCommissionAmount)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Net modèle</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatPreciseCurrency(transaction.modelNetAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={transaction.soldByRole === "modele" ? "premium" : "accent"}>
                        {transaction.soldByRole === "modele"
                          ? "Vente modèle"
                          : "Vente chateur"}
                      </Badge>
                      <Badge variant={transaction.accessGranted ? "success" : "warning"}>
                        {transaction.accessGranted ? "Paiement validé" : "En attente"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Ventes générées"
              value={String(chateurTransactions.length)}
              hint="Paiements attribués au chateur"
              icon={ShoppingBag}
            />
            <StatCard
              title="Montant vendu"
              value={formatPreciseCurrency(chateurGeneratedBase)}
              hint="Volume brut généré"
              icon={DollarSign}
            />
            <StatCard
              title="Commission gagnée"
              value={formatPreciseCurrency(chateurCommission)}
              hint="10% des ventes attribuées"
              icon={Percent}
            />
            <StatCard
              title="Net pour la modèle"
              value={formatPreciseCurrency(chateurNetForModel)}
              hint="Ce qui reste à la modèle"
              icon={LockOpen}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Performance par offre</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardRevenueChart data={chartData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Règle métier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p>Le subscriber ne doit jamais savoir qu’un chateur existe.</p>
                <p>
                  Dans le chat fan, chaque message du chateur prend automatiquement le nom visible{" "}
                  <strong>modele_test</strong>.
                </p>
                <p>
                  Le dashboard interne indique malgré tout qui a réellement vendu : la modèle ou le
                  chateur.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique détaillé des paiements générés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {chateurTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune vente attribuée au chateur.</p>
              ) : (
                chateurTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-[1.15rem] border border-white/5 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{transaction.contentTitle}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Acheté par <strong>{transaction.buyerUsername}</strong> le{" "}
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                      <Badge variant="accent">
                        {formatPreciseCurrency(transaction.amount)}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Vendu par</p>
                        <p className="mt-1 text-sm font-medium">{transaction.soldByUsername}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="mt-1 text-sm font-medium">
                          {sourceLabel[transaction.source]}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Commission chateur</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatPreciseCurrency(transaction.chatterCommissionAmount)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
                        <p className="text-xs text-muted-foreground">Net modèle</p>
                        <p className="mt-1 text-sm font-medium">
                          {formatPreciseCurrency(transaction.modelNetAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="accent">Vente chateur</Badge>
                      <Badge variant={transaction.accessGranted ? "success" : "warning"}>
                        {transaction.accessGranted ? "Paiement validé" : "En attente"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}