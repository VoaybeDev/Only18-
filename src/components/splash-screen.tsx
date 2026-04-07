import { motion } from "framer-motion";
import { AppLogo } from "@/components/app-logo";

export function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-hero px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6"
      >
        <motion.div
          className="absolute -inset-20 rounded-full bg-pink-500/20 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ repeat: Infinity, duration: 5 }}
        />
        <motion.div
          className="absolute -inset-24 rounded-full bg-blue-500/20 blur-3xl"
          animate={{ scale: [1.05, 0.95, 1.05], opacity: [0.25, 0.45, 0.25] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <div className="relative glass rounded-[2rem] px-8 py-7 premium-border">
          <AppLogo />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm uppercase tracking-[0.35em] text-white/70"
        >
          experience premium simulée
        </motion.p>
      </motion.div>
    </div>
  );
}
