import { Link } from "react-router-dom";
import { Lock, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ContentItem } from "@/types";

interface ContentCardProps {
  item: ContentItem;
  unlocked: boolean;
  onSimulatePayment: (contentId: string) => void;
}

export function ContentCard({ item, unlocked, onSimulatePayment }: ContentCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.previewUrl}
          alt={item.title}
          className={`h-full w-full object-cover transition duration-500 ${unlocked ? "scale-100 blur-0" : "scale-105 blur-md"}`}
        />
        {!unlocked && item.price > 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/35 p-6 text-center">
            <div className="rounded-full bg-black/50 p-4 text-white shadow-premium">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Contenu verrouillé</p>
              <p className="text-sm text-white/80">Débloque ce média PPV en un clic.</p>
            </div>
            <Button variant="premium" className="w-full max-w-[220px]" onClick={() => onSimulatePayment(item.id)}>
              Simuler Paiement — {formatCurrency(item.price)}
            </Button>
          </div>
        ) : null}
        {item.mediaType === "video" ? (
          <div className="absolute left-4 top-4 rounded-full bg-black/60 p-2 text-white">
            <PlayCircle className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.caption}</p>
          </div>
          <Badge variant={item.price === 0 ? "success" : "premium"}>
            {item.price === 0 ? "Free" : formatCurrency(item.price)}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary" className="flex-1">
            <Link to={`/content/${item.id}`}>Ouvrir</Link>
          </Button>
          {!unlocked && item.price > 0 ? (
            <Button variant="premium" className="flex-1" onClick={() => onSimulatePayment(item.id)}>
              Débloquer
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
