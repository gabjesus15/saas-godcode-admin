"use client";

import { motion } from "framer-motion";

export function LandingHeroPhoneMockupAnimated() {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[320px] lg:max-w-[360px]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="absolute -right-4 top-8 h-48 w-48 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-600/20"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-8 bottom-16 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-600/15"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 p-1.5 shadow-[0_32px_64px_-12px_rgba(15,23,42,0.45)] dark:border-slate-700"
        animate={{ y: [0, -6, 0], rotate: [0, -0.4, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-indigo-50 via-white to-slate-100 aspect-[9/18] dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950">
          <div className="flex h-10 items-center justify-center border-b border-slate-200/80 bg-white/90 dark:border-zinc-700 dark:bg-zinc-900/90">
            <div className="h-1 w-12 rounded-full bg-slate-300 dark:bg-zinc-600" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90 shadow-inner" />
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-zinc-700" />
              <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-zinc-700" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-16 rounded-xl bg-white shadow dark:bg-zinc-800" />
              <div className="h-16 rounded-xl bg-white shadow dark:bg-zinc-800" />
              <div className="h-16 rounded-xl bg-white shadow dark:bg-zinc-800" />
              <div className="h-16 rounded-xl bg-white shadow dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

