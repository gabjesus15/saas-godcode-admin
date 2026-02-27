"use client";

import { useState } from "react";

import { getTenantHost } from "../../utils/tenant-url";

interface BrandingPreviewProps {
  displayName: string;
  name: string;
  publicSlug: string;
  primaryColor: string;
  secondaryColor: string;
  priceColor: string;
  discountColor: string;
  hoverColor: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  logoUrl: string;
}

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("") || "GC";
};

export function BrandingPreview({
  displayName,
  name,
  publicSlug,
  primaryColor,
  secondaryColor,
  priceColor,
  discountColor,
  hoverColor,
  backgroundColor,
  backgroundImageUrl,
  logoUrl,
}: BrandingPreviewProps) {
  const [logoError, setLogoError] = useState(false);
  const safeName = displayName || name || "Nombre";

  return (
    <details className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4">
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Vista previa del tenant
      </summary>
      <div className="mt-4 grid gap-4">
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Cabecera
          </p>
          <div
            className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3"
            style={{ borderLeft: `4px solid ${primaryColor}` }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-200"
              style={{ backgroundColor: primaryColor }}
            >
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-xs font-semibold text-white">
                  {getInitials(safeName)}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-900">{safeName}</span>
              <span className="text-xs text-zinc-500">
                {publicSlug ? getTenantHost(publicSlug) : "subdominio"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Menu maqueta
          </p>
          <div
            className="mt-3 overflow-hidden rounded-[28px] border border-zinc-200"
            style={{
              backgroundColor,
              backgroundImage: backgroundImageUrl
                ? `url(${backgroundImageUrl})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                padding: 20,
                background: "rgba(6, 6, 6, 0.82)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  borderRadius: 24,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(8, 8, 8, 0.88)",
                  padding: 18,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        background: "rgba(20, 20, 20, 0.9)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {"<"}
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: primaryColor,
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getInitials(safeName)}
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      Ciudad de los Valles
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                      {safeName}
                    </div>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 12,
                        background: "rgba(20, 20, 20, 0.9)",
                      }}
                    >
                      Q
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 12px",
                    borderRadius: 22,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      overflow: "hidden",
                    }}
                  >
                    {
                      [
                        "PROMOCIONES",
                        "Ramen",
                        "ENTRADAS CALIENTES",
                        "SASHIMI",
                        "HOT ROLLS",
                        "ROLLS TRADICIONALES",
                      ].map((tab, index) => {
                      const isActive = index === 0;
                      return (
                        <span
                          key={tab}
                          style={{
                            padding: "9px 14px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.2,
                            color: isActive
                              ? "#fff"
                              : "rgba(255,255,255,0.7)",
                            background: isActive
                              ? primaryColor
                              : "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {tab}
                        </span>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      height: 40,
                      padding: "0 14px",
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      background: "rgba(20, 20, 20, 0.9)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Buscar
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    color: "#fff",
                    fontWeight: 800,
                    letterSpacing: 0.6,
                  }}
                >
                  PROMOCIONES
                </div>

                <div
                  style={{
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(240px, 1fr))",
                    gap: 18,
                  }}
                >
                  {["Roll tempura", "Nigiri mix"].map((title, index) => (
                    <div
                      key={title}
                      style={{
                        minHeight: 460,
                        borderRadius: 26,
                        overflow: "hidden",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        background:
                          "linear-gradient(145deg, rgba(34, 34, 34, 0.95) 0%, rgba(14, 14, 14, 0.95) 100%)",
                        boxShadow: "0 16px 32px rgba(0, 0, 0, 0.45)",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ position: "relative", height: 230 }}>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0))",
                          }}
                        />
                        {index === 0 ? (
                          <span
                            style={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "rgba(20, 20, 20, 0.85)",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 800,
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            OFERTA
                          </span>
                        ) : null}
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: primaryColor,
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid #fff",
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.4)",
                          }}
                        >
                          2
                        </div>
                      </div>

                      <div style={{ padding: "16px 18px", color: "#fff", flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>
                          10 piezas + salsa especial.
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.4,
                          }}
                        >
                          VER DETALLES
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 14,
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: priceColor }}>
                            $7.900
                          </div>
                          <button
                            type="button"
                            style={{
                              border: "none",
                              borderRadius: 999,
                              padding: "8px 14px",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#fff",
                              background: primaryColor,
                              cursor: "default",
                            }}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    position: "absolute",
                    right: 20,
                    bottom: 18,
                    width: 60,
                    height: 60,
                    borderRadius: 20,
                    background: primaryColor,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 16px 32px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  Cart
                  <span
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "#fff",
                      color: "#111",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                    }}
                  >
                    2
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
