"use client";

import { useEffect } from "react";
import { useAntiZoom } from "../tenant/use-anti-zoom";

export function LandingThemeEnforcer() {
  useAntiZoom();

  useEffect(() => {
    const root = document.documentElement;
    const applyLightMode = () => {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    };

    applyLightMode();

    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark") || root.getAttribute("data-theme") !== "light") {
        applyLightMode();
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      observer.disconnect();
      root.style.removeProperty("color-scheme");
    };
  }, []);

  return null;
}
