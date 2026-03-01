"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { AdminSidebar } from "./admin-sidebar";
import { useAdmin } from "./admin-provider";

interface AdminPageProps {
  companyName: string;
  logoUrl?: string | null;
}

export function AdminPage({ companyName, logoUrl }: AdminPageProps) {
  const {
    activeTab,
    setActiveTab,
    isMobile,
    branches,
    selectedBranch,
    loading,
    notification,
    userRole,
    userEmail,
  } = useAdmin();

  if (loading) {
    return (
      <div
        className="admin-layout flex-center"
        style={{ minHeight: "100vh", padding: "24px", background: "var(--bg-primary)" }}
      >
        <div
          className="glass animate-fade"
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 20,
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--card-border)",
            }}
          >
            <Loader2 className="animate-spin" size={30} color="var(--accent-primary)" />
          </div>

          <h3 style={{ margin: 0, color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: 700 }}>
            Cargando panel admin
          </h3>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Estamos preparando pedidos, productos y caja.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {notification ? (
        <div className={`admin-notification ${notification.type} animate-slide-up`}>
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.msg}</span>
        </div>
      ) : null}

      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobile={isMobile}
        pendingCount={0}
        userEmail={userEmail}
        branchName={selectedBranch?.name ?? null}
        onLogout={() => setActiveTab("store")}
        logoUrl={logoUrl}
        showCompanyTab={userRole === "admin" || userRole === "owner"}
        userRole={userRole}
      />

      <main className="admin-content">
        <header className="content-header">
          <div>
            <h1>{companyName}</h1>
            <p className="subtitle">Panel del local</p>
          </div>
          <div className="header-actions">
            <Link href="/menu" className="btn btn-secondary">
              Ver menú
            </Link>
          </div>
        </header>

        <section className="glass" style={{ padding: 24, borderRadius: 16 }}>
          <h2 style={{ marginTop: 0 }}>{activeTab}</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Seccion en migracion. Voy a ir portando cada modulo de OishiPrueba en este orden: pedidos,
            productos/categorias, clientes, caja, reportes, herramientas, empresa.
          </p>
          <div style={{ marginTop: 16, color: "var(--text-secondary)" }}>
            Sucursales cargadas: {branches.length}
          </div>
        </section>
      </main>
    </div>
  );
}
