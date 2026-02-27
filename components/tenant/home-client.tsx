"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Instagram, MapPin, MessageCircle, Settings, Utensils, QrCode } from "lucide-react";

import { ContactBranchModal } from "./contact-branch-modal";

interface BranchInfo {
  id: string;
  name: string | null;
  whatsapp_url?: string | null;
  instagram_url?: string | null;
  map_url?: string | null;
}

interface HomeClientProps {
  name: string;
  logoUrl?: string | null;
  schedule?: string | null;
  branches: BranchInfo[];
}

export function HomeClient({ name, logoUrl, schedule, branches }: HomeClientProps) {
  const router = useRouter();
  
  // 1. ESTADO DE HIDRATACIÓN
  const [isMounted, setIsMounted] = useState(false);

  // Estados de UI
  const [showModal, setShowModal] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Tipado estricto: Eliminamos "menu" porque esa acción ya no abre este modal
  type ActionType = "whatsapp" | "instagram" | "location";
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  // Efecto de montaje
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generación de URL segura para el QR
  const menuUrl = useMemo(() => {
    if (!isMounted || typeof window === "undefined") return "";
    return `${window.location.origin}/menu`;
  }, [isMounted]);

  // Manejador centralizado para botones que SÍ abren el modal (Contacto/Ubicación)
  const handleActionClick = (action: ActionType) => {
    // Si solo hay una sucursal, podríamos ejecutar la acción directo (Opcional, pero buena UX)
    if (branches.length === 1) {
      executeAction(action, branches[0]);
      return;
    }
    
    setPendingAction(action);
    setShowModal(true);
  };

  // Función separada para ejecutar la acción y mantener el código limpio
  const executeAction = (action: ActionType, branch: BranchInfo) => {
    try {
      switch (action) {
        case "whatsapp":
          if (branch.whatsapp_url) {
            window.open(branch.whatsapp_url, "_blank", "noopener,noreferrer");
          } else {
            console.warn("Esta sucursal no tiene WhatsApp configurado.");
          }
          break;
        case "instagram":
          if (branch.instagram_url) {
            window.open(branch.instagram_url, "_blank", "noopener,noreferrer");
          }
          break;
        case "location":
          if (branch.map_url) {
            window.open(branch.map_url, "_blank", "noopener,noreferrer");
          }
          break;
      }
    } catch (error) {
      console.error("Error al ejecutar la acción de la sucursal:", error);
    }
  };

  // Manejador de selección cuando el usuario elige en el modal
  const handleBranchSelect = (branch: BranchInfo | null) => {
    setShowModal(false);
    
    if (branch && pendingAction) {
      executeAction(pendingAction, branch);
    }
    
    setPendingAction(null);
  };

  // Configuración de botones dinámica
  const buttons = useMemo(() => [
    {
      label: "Ver Menú Digital",
      icon: <Utensils size={20} />,
      // AL HACER CLIC, VA DIRECTO AL MENÚ SIN ABRIR MODAL AQUÍ
      onClick: () => router.push("/menu"), 
      primary: true,
    },
    {
      label: "WhatsApp",
      icon: <MessageCircle size={20} />,
      onClick: () => handleActionClick("whatsapp"),
    },
    {
      label: "Instagram",
      icon: <Instagram size={20} />,
      onClick: () => handleActionClick("instagram"),
    },
    {
      label: "Ubicación",
      icon: <MapPin size={20} />,
      onClick: () => handleActionClick("location"),
    },
  ], [router, branches.length]); // Dependencias actualizadas

  // Generador de iniciales robusto
  const initials = useMemo(() => {
    if (!name) return "GC";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "GC";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [name]);

  return (
    <div className="home-container animate-fade">
      <button
        onClick={() => router.push("/login")}
        className="settings-btn"
        title="Acceso Administrativo"
        aria-label="Acceso Administrativo"
      >
        <Settings size={20} />
      </button>

      <div className="home-overlay" aria-hidden="true" />

      <main className="home-content container">
        <div className="ticket-wrapper">
          <div className="ticket-main">
            
            <header className="home-header-centered">
              <div className="brand-container-centered">
                {logoUrl && !logoError ? (
                  <img
                    src={logoUrl}
                    alt={`Logo de ${name}`}
                    className="home-logo-centered"
                    onError={() => setLogoError(true)}
                    loading="eager"
                  />
                ) : (
                  <div
                    className="home-logo-centered"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--accent-primary, #333)",
                      color: "white",
                      fontSize: "2rem",
                      fontWeight: 800,
                      borderRadius: "20px",
                      letterSpacing: "1px"
                    }}
                    aria-label={`Iniciales de ${name}`}
                  >
                    {initials}
                  </div>
                )}
                <div className="brand-text-centered">
                  <h1 className="text-gradient">{name}</h1>
                </div>
              </div>
              <p className="home-tagline">
                {schedule ? schedule.split("\n")[0] : "Sabor auténtico en cada pieza"}
              </p>
            </header>

            <nav className="home-nav-grid" aria-label="Menú principal de opciones">
              {buttons.map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  className={`btn ${btn.primary ? "btn-primary" : "btn-secondary glass"}`}
                  aria-label={`Ir a ${btn.label}`}
                >
                  <span className="btn-icon" aria-hidden="true">{btn.icon}</span>
                  <span className="btn-label">{btn.label}</span>
                </button>
              ))}
            </nav>

            <div className="ticket-stub-line" aria-hidden="true" />
          </div>

          <aside className="ticket-stub">
            <div className="stub-content">
              <div className="stub-badge">ACCESO DIGITAL</div>
              
              <div className="qr-box" aria-label="Código QR del Menú Digital">
                {isMounted ? (
                  menuUrl ? (
                    <QRCodeSVG 
                      value={menuUrl} 
                      level="H" 
                      includeMargin={false} 
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', opacity: 0.5 }}>
                      <QrCode size={40} />
                    </div>
                  )
                ) : (
                  <div 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      background: "rgba(255,255,255,0.05)", 
                      borderRadius: "8px",
                      animation: "pulse 1.5s infinite"
                    }} 
                  />
                )}
              </div>
              
              <div className="stub-footer">
                <p className="stub-scan-text">ESCANÉAME</p>
                <span className="stub-info">PASAPORTE AL SABOR</span>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* MODAL DE SUCURSALES (Ahora solo se usa para WhatsApp, Instgram y Ubicación) */}
      {isMounted && (
        <ContactBranchModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setPendingAction(null);
          }}
          branches={branches}
          isLoading={false}
          onSelectBranch={handleBranchSelect}
        />
      )}
    </div>
  );
}