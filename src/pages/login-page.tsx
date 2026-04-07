import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

const presets = [
  { username: "modele_test", password: "123456", role: "modele" },
  { username: "luna_star", password: "123456", role: "modele" },
  { username: "chateur_test", password: "12345678", role: "chateur" },
  { username: "fan_test", password: "123456", role: "subscriber" },
];

export function LoginPage() {
  const login = useAppStore((state) => state.login);
  const changePassword = useAppStore((state) => state.changePassword);
  const pushToast = useAppStore((state) => state.pushToast);
  const currentUser = useAppStore(selectCurrentUser);

  const [username, setUsername] = useState("fan_test");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const destination = (location.state as { from?: string } | null)?.from ?? "/home";

  useEffect(() => {
    if (currentUser?.role === "chateur" && currentUser.mustChangePassword) {
      setRequiresPasswordChange(true);
    }
  }, [currentUser]);

  const handleLogin = () => {
    setError("");
    const result = login(username, password);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    pushToast("Connexion réussie", result.message);

    if (result.requiresPasswordChange) {
      setRequiresPasswordChange(true);
      return;
    }

    navigate(destination);
  };

  const handlePasswordChange = () => {
    setError("");

    if (!newPassword || newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    const result = changePassword(newPassword);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    pushToast("Mot de passe changé", result.message);
    setRequiresPasswordChange(false);
    navigate(destination);
  };

  if (requiresPasswordChange) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Changement obligatoire du mot de passe</CardTitle>
              <CardDescription>
                Ce compte chateur utilise un mot de passe temporaire. Il doit être changé avant de continuer.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-[1.15rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                Compte connecté : <strong>{currentUser?.displayName ?? "chateur"}</strong>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nouveau mot de passe</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Au moins 8 caractères"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Confirmer le mot de passe</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Répète le mot de passe"
                />
              </div>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <Button variant="premium" size="lg" className="w-full" onClick={handlePasswordChange}>
                <ShieldCheck className="h-4 w-4" />
                Enregistrer et continuer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardContent className="flex min-h-[620px] flex-col justify-between p-8 sm:p-10">
            <div className="space-y-6">
              <AppLogo />
              <div className="space-y-3">
                <Badge variant="premium">Connexion demo</Badge>
                <h1 className="max-w-xl text-4xl font-semibold leading-tight">
                  Prototype multi-modèles, sombre et premium, prêt à tester en local.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Connecte-toi comme modèle, chateur ou fan. Le chateur a un seul compte, plusieurs accès modèles et doit changer son mot de passe au premier login.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {presets.map((preset) => (
                <button
                  key={preset.username}
                  onClick={() => {
                    setUsername(preset.username);
                    setPassword(preset.password);
                  }}
                  className="rounded-[1.25rem] border border-white/5 bg-white/5 p-4 text-left transition hover:bg-white/10"
                >
                  <p className="text-sm text-muted-foreground">Compte</p>
                  <p className="mt-2 font-medium">{preset.username}</p>
                  <Badge
                    className="mt-3"
                    variant={
                      preset.role === "modele"
                        ? "premium"
                        : preset.role === "chateur"
                          ? "accent"
                          : "success"
                    }
                  >
                    {preset.role}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Se connecter</CardTitle>
            <CardDescription>
              Utilise un compte de simulation ou crée un fan depuis l’inscription.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nom d’utilisateur</label>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="modele_test"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="123456"
              />
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <Button variant="premium" size="lg" className="w-full" onClick={handleLogin}>
              <KeyRound className="h-4 w-4" />
              Ouvrir la démo
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Nouveau fan ?{" "}
              <Link to="/register" className="text-pink-300 underline-offset-4 hover:underline">
                Créer un compte
              </Link>
            </p>

            <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-pink-300" />
                Test rapide
              </div>
              <p>
                <strong>chateur_test / 12345678</strong> déclenche le changement obligatoire du mot de passe.
              </p>
              <p className="mt-2">
                <strong>fan_test / 123456</strong> permet de tester le choix de modèle côté fan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}