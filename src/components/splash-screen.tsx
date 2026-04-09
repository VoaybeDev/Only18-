import { motion } from "framer-motion";
import { AppLogo } from "@/components/app-logo";

export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero px-6">
      <motion.div
        className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-red-500/20 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.22, 0.4, 0.22] }}
        transition={{ repeat: Infinity, duration: 5.5 }}
      />
      <motion.div
        className="absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl"
        animate={{ scale: [1.08, 0.95, 1.08], opacity: [0.18, 0.34, 0.18] }}
        transition={{ repeat: Infinity, duration: 6.2 }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-8"
      >
        <div className="glass premium-border rounded-[2.6rem] px-14 py-12 sm:px-16 sm:py-14">
          <AppLogo
            className="items-center gap-5"
            logoClassName="h-44 w-44 rounded-[2.2rem] p-3 sm:h-52 sm:w-52"
            textClassName="text-4xl sm:text-5xl"
            subtitleClassName="text-lg sm:text-xl"
          />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm uppercase tracking-[0.35em] text-white/70 sm:text-base"
        >
          expérience premium simulée
        </motion.p>
      </motion.div>
    </div>
  );
}