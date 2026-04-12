"use client";

import { useEffect } from "react";

export function LandingThemeEnforcer() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  return null;
}
