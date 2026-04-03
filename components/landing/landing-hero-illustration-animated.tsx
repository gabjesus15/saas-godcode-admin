"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LandingHeroIllustration } from "./landing-hero-illustration";

export function LandingHeroIllustrationAnimated() {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      className="relative"
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
    >
      <div className="absolute -right-6 top-6 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-700/15" />
      <div className="absolute -left-6 bottom-6 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-700/10" />

      <motion.div
        animate={prefersReduced ? {} : { y: [0, -5, 0] }}
        transition={prefersReduced ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <LandingHeroIllustration />
      </motion.div>
    </motion.div>
  );
}
