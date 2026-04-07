import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { onboardingSlides } from "@/data/seed";
import { useAppStore } from "@/store/useAppStore";

export function OnboardingPage() {
  const [index, setIndex] = useState(0);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const navigate = useNavigate();

  const slide = onboardingSlides[index];
  const progress = useMemo(() => ((index + 1) / onboardingSlides.length) * 100, [index]);

  const finish = () => {
    completeOnboarding();
    navigate("/login");
  };

  const next = () => {
    if (index === onboardingSlides.length - 1) {
      finish();
      return;
    }
    setIndex((value) => value + 1);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="flex min-h-[560px] flex-col justify-between p-8 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <AppLogo />
              <Button variant="ghost" onClick={finish}>
                Passer
              </Button>
            </div>

            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div className="inline-flex rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1 text-xs uppercase tracking-[0.25em] text-pink-300">
                    {slide.kicker}
                  </div>
                  <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {slide.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Rôles</p>
                  <p className="mt-2 font-medium">Modèle · Chateur · Fan</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Moteur</p>
                  <p className="mt-2 font-medium">Zustand + localStorage</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/5 bg-white/5 p-4">
                  <p className="text-sm text-muted-foreground">Expérience</p>
                  <p className="mt-2 font-medium">Blur, reveal et toasts</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <Progress value={progress} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Slide {index + 1} / {onboardingSlides.length}
                </div>
                <Button variant="premium" size="lg" onClick={next}>
                  {index === onboardingSlides.length - 1 ? "Commencer" : "Continuer"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="flex min-h-[560px] flex-col justify-between bg-gradient-to-br from-pink-500/10 via-transparent to-blue-500/10 p-8 sm:p-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Démo locale avec persistance
              </div>
              <h2 className="text-2xl font-semibold">Flux premium complet prêt à tester</h2>
              <p className="text-muted-foreground">
                Onboarding, authentification, catalogue PPV, contenu verrouillé, chat unifié et dashboard selon le rôle.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Splash animé avec branding sombre",
                "Protection des routes selon les rôles",
                "Chateur invisible côté subscriber",
                "Paiement simulé en un clic",
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] border border-white/5 bg-black/20 p-4 text-sm text-white/80">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
