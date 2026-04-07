import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-lg">
        <CardContent className="space-y-5 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">404</p>
          <h1 className="text-3xl font-semibold">Page introuvable</h1>
          <p className="text-muted-foreground">Cette route n’existe pas dans le prototype.</p>
          <Button asChild variant="premium">
            <Link to="/home">Retour à l’accueil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
