import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

export function ProfilePage() {
  const currentUser = useAppStore(selectCurrentUser);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const logout = useAppStore((state) => state.logout);
  const transactions = useAppStore((state) => state.transactions);

  if (!currentUser) return null;

  const myTransactions = transactions.filter((transaction) => transaction.buyerId === currentUser.id);
  const mySpend = myTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-semibold">{currentUser.displayName}</h2>
              <p className="text-muted-foreground">@{currentUser.username}</p>
              <Badge className="mt-3" variant={currentUser.role === "modele" ? "premium" : currentUser.role === "chateur" ? "accent" : "success"}>
                {currentUser.role}
              </Badge>
            </div>
          </div>
          <p className="text-base leading-7 text-muted-foreground">{currentUser.bio}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="mt-2 text-2xl font-semibold">{myTransactions.length}</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4">
              <p className="text-sm text-muted-foreground">Montant dépensé</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(mySpend)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Réinitialiser la démo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              Cette action restaure les comptes prédéfinis, le catalogue, le chat, les transactions simulées et efface la progression locale.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetDemo();
                  logout();
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser la démo
              </Button>
              <Button asChild variant="premium">
                <Link to="/home">Retour au catalogue</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comptes prédéfinis</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4 text-sm">
              <p className="font-medium">modele_test</p>
              <p className="mt-1 text-muted-foreground">123456</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4 text-sm">
              <p className="font-medium">chateur_test</p>
              <p className="mt-1 text-muted-foreground">123456</p>
            </div>
            <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4 text-sm">
              <p className="font-medium">fan_test</p>
              <p className="mt-1 text-muted-foreground">123456</p>
            </div>
          </CardContent>
        </Card>

        {currentUser.role !== "subscriber" ? (
          <Card>
            <CardHeader>
              <CardTitle>Rappel équipe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                Côté fan, tous les messages du modèle et du chateur apparaissent comme envoyés par <strong>modele_test</strong>.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
