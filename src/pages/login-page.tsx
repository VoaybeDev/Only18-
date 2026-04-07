import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Sparkles } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";

const presets = [
  { username: "modele_test", password: "123456", role: "modele" },
  { username: "chateur_test", password: "123456", role: "chateur" },
  { username: "fan_test", password: "123456", role: "subscriber" },
];

export function LoginPage() {
  const login = useAppStore((state) => state.login);
  const pushToast = useAppStore((state) => state.pushToast);
  const [username, setUsername] = useState("fan_test");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    const result = login(username, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    pushToast("Connexion réussie", result.message);
    const destination = (location.state as { from?: string } | null)?.from ?? "/home";
    navigate(destination);
  };

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
                  Prototype complet, sombre et premium, prêt à tester en local.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  Connecte-toi comme modèle, chateur ou subscriber pour tester le flux PPV, la messagerie unifiée et le dashboard.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
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
                  <Badge className="mt-3" variant={preset.role === "modele" ? "premium" : preset.role === "chateur" ? "accent" : "success"}>
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
            <CardDescription>Utilise un compte de simulation ou crée un fan depuis l’inscription.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nom d’utilisateur</label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="modele_test" />
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
              Nouveau fan ? <Link to="/register" className="text-pink-300 underline-offset-4 hover:underline">Créer un compte</Link>
            </p>
            <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4 text-pink-300" />
                Test rapide
              </div>
              Connecte-toi en <strong>fan_test</strong> pour voir la version où le chateur reste totalement invisible.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
