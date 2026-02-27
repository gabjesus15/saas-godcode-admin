"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAntiZoom } from "./use-anti-zoom";

interface TenantShellProps {
  children: React.ReactNode;
}

export function TenantShell({ children }: TenantShellProps) {
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useAntiZoom();

  useEffect(() => {
    const handleVisualLock = () => {
      const contentLayer = document.getElementById("app-content-layer");
      const uiLayer = document.getElementById("app-ui-layer");

      if (!contentLayer || !uiLayer) return;

      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isIPad = /iPad|Macintosh/.test(navigator.userAgent) && isTouchDevice;

      if (!isIPad && !isTouchDevice) {
        const dpr = window.devicePixelRatio || 1;
        const inverseScale = 1 / dpr;

        (document.body.style as any).zoom = String(inverseScale);

        if (!document.body.style.zoom) {
          const transformProps = `scale(${inverseScale})`;
          const originProps = "top left";
          const widthProps = `${dpr * 100}vw`;
          const heightProps = `${dpr * 100}vh`;

          contentLayer.style.transform = transformProps;
          contentLayer.style.transformOrigin = originProps;
          contentLayer.style.width = widthProps;
          contentLayer.style.minHeight = heightProps;

          uiLayer.style.transform = transformProps;
          uiLayer.style.transformOrigin = originProps;
          uiLayer.style.width = widthProps;
          uiLayer.style.height = heightProps;
        } else {
          contentLayer.style.transform = "";
          contentLayer.style.width = "100%";
          contentLayer.style.height = "";
          contentLayer.style.overflowY = "";

          uiLayer.style.transform = "";
          uiLayer.style.width = "100%";
          uiLayer.style.height = "100%";
        }

        uiLayer.style.position = "fixed";
        uiLayer.style.top = "0";
        uiLayer.style.left = "0";
        uiLayer.style.pointerEvents = "none";
        uiLayer.style.zIndex = "9999";

        document.body.style.overflowX = "hidden";
      } else {
        document.body.style.zoom = "";
        document.body.style.overflowX = "";

        contentLayer.style.transform = "";
        contentLayer.style.transformOrigin = "";
        contentLayer.style.width = "";
        contentLayer.style.height = "";
        contentLayer.style.minHeight = "";

        uiLayer.style.transform = "";
        uiLayer.style.transformOrigin = "";
        uiLayer.style.position = "fixed";
        uiLayer.style.width = "100%";
        uiLayer.style.height = "100%";
        uiLayer.style.pointerEvents = "none";
        uiLayer.style.zIndex = "9999";
      }
    };

    window.addEventListener("resize", handleVisualLock);
    const timerId = window.setTimeout(handleVisualLock, 100);

    return () => {
      window.removeEventListener("resize", handleVisualLock);
      window.clearTimeout(timerId);
    };
  }, [pathname]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        background: "var(--bg-primary, #0a0a0a)",
        touchAction: "pan-x pan-y",
      }}
    >
      <div
        className="app-bg-layer"
        style={{
          position: "fixed",
          inset: "-200% -50%",
          zIndex: 0,
          backgroundImage: "var(--tenant-bg-image, url(/tenant/menu-pattern.webp))",
          backgroundRepeat: "repeat",
          backgroundSize: "1200px",
          opacity: 0.5,
          filter: "brightness(0.18) blur(3px)",
          transform: `translateY(${-scrollY * 0.1}px)`,
          transition: "transform 0.1s ease-out",
          pointerEvents: "none",
          willChange: "transform",
        }}
      />

      <div
        id="app-content-layer"
        className="app-wrapper"
        style={{ position: "relative", zIndex: 1, background: "transparent" }}
      >
        {children}
      </div>

      <div id="app-ui-layer" style={{ position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none" }}>
        <div id="navbar-portal-root" style={{ pointerEvents: "auto", width: "100%" }} />
        <div id="cart-portal-root" style={{ pointerEvents: "auto" }} />
        <div id="modal-root" style={{ pointerEvents: "auto" }} />
      </div>
    </div>
  );
}
