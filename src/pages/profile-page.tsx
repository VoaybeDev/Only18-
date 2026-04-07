import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MAX_CHATTER_MODELS,
  DEFAULT_CHATTER_PASSWORD,
  isModelSubscribedByUser,
  selectActiveModel,
  selectCurrentUser,
  useAppStore,
} from "@/store/useAppStore";

export function ProfilePage() {
  const currentUser = useAppStore(selectCurrentUser);
  const activeModel = useAppStore(selectActiveModel);
  const users = useAppStore((state) => state.users);
  const subscriptions = useAppStore((state) => state.subscriptions);
  const transactions = useAppStore((state) => state.transactions);
  const createOrGrantChatterAccess = useAppStore((state) => state.createOrGrantChatterAccess);
  const setActiveModel = useAppStore((state) => state.setActiveModel);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const logout = useAppStore((state) => state.logout);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  if (!currentUser) return null;

  const accessibleModels = useMemo(() => {
    if (currentUser.role === "modele") {
      return users.filter((user) => user.role === "modele" && user.id === currentUser.id);
    }

    if (currentUser.role === "chateur") {
      return users.filter(
        (user) =>
          user.role === "modele" &&
          (currentUser.accessibleModelIds ?? []).includes(user.id),
      );
    }

    return users.filter(
      (user) =>
        user.role === "modele" &&
        (currentUser.subscribedModelIds ?? []).includes(user.id),
    );
  }, [currentUser, users]);

  const myTransactions = transactions.filter((transaction) => transaction.buyerId === currentUser.id);
  const mySpend = myTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  const chattersForActiveModel =
    currentUser.role === "modele" && activeModel
      ? users.filter(
          (user) =>
            user.role === "chateur" &&
            (user.accessibleModelIds ?? []).includes(activeModel.id),
        )
      : [];

  const mySubscriptions =
    currentUser.role === "subscriber"
      ? subscriptions.filter((subscription) => subscription.subscriberId === currentUser.id)
      : [];

  const handleCreateOrGrantChatter = (event: FormEvent) => {
    event.preventDefault();
    setResultMessage("");

    const result = createOrGrantChatterAccess({
      username,
      email,
      displayName,
    });

    setResultMessage(
      result.temporaryPassword
        ? `${result.message} Mot de passe temporaire : ${result.temporaryPassword}`
        : result.message,
    );

    if (result.ok) {
      setUsername("");
      setEmail("");
      setDisplayName("");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>
                {currentUser.displayName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-2xl font-semibold">{currentUser.displayName}</h2>
              <p className="text-muted-foreground">@{currentUser.username}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>

              <Badge
                className="mt-3"
                variant={
                  currentUser.role === "modele"
                    ? "premium"
                    : currentUser.role === "chateur"
                      ? "accent"
                      : "success"
                }
              >
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

          {activeModel ? (
            <div className="rounded-[1.2rem] border border-white/5 bg-white/5 p-4">
              <p className="text-sm text-muted-foreground">Modèle active</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={activeModel.avatar} />
                  <AvatarFallback>
                    {activeModel.displayName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{activeModel.displayName}</p>
                  <p className="text-sm text-muted-foreground">@{activeModel.username}</p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {currentUser.role === "modele" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Créer ou attribuer un chateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-7 text-muted-foreground">
                  Si le username ou l’email existent déjà pour un compte chateur, le compte n’est pas recréé :
                  l’accès à cette modèle est simplement ajouté. Un chateur peut gérer au maximum{" "}
                  <strong>{MAX_CHATTER_MODELS}</strong> modèles.
                </p>

                <form className="grid gap-4" onSubmit={handleCreateOrGrantChatter}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="username"
                    />
                    <Input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email"
                      type="email"
                    />
                  </div>

                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="pseudo affiché"
                  />

                  <div className="rounded-[1rem] border border-white/5 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
                    Mot de passe temporaire par défaut : <strong>{DEFAULT_CHATTER_PASSWORD}</strong>.  
                    Le chateur devra le changer à sa première connexion.
                  </div>

                  <Button variant="premium" type="submit">
                    Créer ou donner accès
                  </Button>
                </form>

                {resultMessage ? (
                  <div className="rounded-[1rem] border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/80">
                    {resultMessage}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Chatteurs liés à {activeModel?.displayName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chattersForActiveModel.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun chateur lié à cette modèle pour le moment.
                  </p>
                ) : (
                  chattersForActiveModel.map((chatter) => (
                    <div
                      key={chatter.id}
                      className="flex items-center justify-between gap-4 rounded-[1rem] border border-white/5 bg-white/5 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={chatter.avatar} />
                          <AvatarFallback>
                            {chatter.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{chatter.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{chatter.username}</p>
                          <p className="text-xs text-muted-foreground">{chatter.email}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="accent">chateur</Badge>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {(chatter.accessibleModelIds ?? []).length}/{MAX_CHATTER_MODELS} modèles
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {currentUser.role === "chateur" ? (
          <Card>
            <CardHeader>
              <CardTitle>Mes modèles accessibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(currentUser.accessibleModelIds ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun accès modèle.
                </p>
              ) : (
                accessibleModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setActiveModel(model.id)}
                    className={`flex w-full items-center justify-between gap-4 rounded-[1rem] border p-4 text-left transition ${
                      activeModel?.id === model.id
                        ? "border-pink-500/40 bg-pink-500/10"
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={model.avatar} />
                        <AvatarFallback>
                          {model.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{model.displayName}</p>
                        <p className="text-sm text-muted-foreground">@{model.username}</p>
                      </div>
                    </div>

                    {activeModel?.id === model.id ? (
                      <Badge variant="premium">active</Badge>
                    ) : null}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        ) : null}

        {currentUser.role === "subscriber" ? (
          <Card>
            <CardHeader>
              <CardTitle>Mes abonnements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mySubscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun abonnement actif ou passé.
                </p>
              ) : (
                mySubscriptions.map((subscription) => {
                  const model = users.find((user) => user.id === subscription.modelId);

                  if (!model) return null;

                  const active = isModelSubscribedByUser(currentUser, model.id);

                  return (
                    <button
                      key={subscription.id}
                      type="button"
                      onClick={() => setActiveModel(model.id)}
                      className={`flex w-full items-center justify-between gap-4 rounded-[1rem] border p-4 text-left transition ${
                        activeModel?.id === model.id
                          ? "border-pink-500/40 bg-pink-500/10"
                          : "border-white/5 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={model.avatar} />
                          <AvatarFallback>
                            {model.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">{model.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            {active ? "abonnement actif" : "abonnement expiré"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            expire le {subscription.expiresAt ? formatDate(subscription.expiresAt) : "-"}
                          </p>
                        </div>
                      </div>

                      <Badge variant={active ? "success" : "warning"}>
                        {active ? "actif" : "expiré"}
                      </Badge>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Réinitialiser la démo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              Cette action restaure les comptes prédéfinis, les modèles, les accès chateurs, les abonnements, le catalogue, le chat et efface la progression locale.
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
      </div>
    </div>
  );
}