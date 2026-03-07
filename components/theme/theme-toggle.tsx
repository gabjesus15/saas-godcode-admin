"use client";

import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "saas-theme";

export function ThemeToggle() {
  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";

    root.classList.toggle("dark", nextTheme === "dark");
    root.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Cambiar tema"
      title="Cambiar tema"
      className="fixed right-4 top-4 z-[100] inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white/90 text-zinc-700 shadow-sm backdrop-blur transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-900"
    >
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="block dark:hidden" />
    </button>
  );
}
