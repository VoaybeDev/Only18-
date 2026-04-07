import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";

export function RegisterPage() {
  const register = useAppStore((state) => state.register);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    const result = register({ username, password });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardContent className="flex h-full flex-col justify-between p-8 sm:p-10">
            <div className="space-y-6">
              <AppLogo />
              <Badge variant="success">Inscription fan</Badge>
              <h1 className="text-4xl font-semibold leading-tight">Créer un compte subscriber pour tester le flux PPV.</h1>
              <p className="text-base leading-7 text-muted-foreground">
                Dans cette démo, l’inscription crée un compte fan. Les rôles modèle et chateur sont fournis comme comptes de simulation.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-5 text-sm text-muted-foreground">
              Après l’inscription, tu arrives directement dans le catalogue avec persistance locale via localStorage.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>Compte fan local pour déverrouiller du contenu et discuter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nom d’utilisateur</label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="fan_premium" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button variant="premium" size="lg" className="w-full" onClick={handleRegister}>
              <UserPlus className="h-4 w-4" />
              Créer le compte fan
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Déjà un compte ? <Link to="/login" className="text-pink-300 underline-offset-4 hover:underline">Se connecter</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
