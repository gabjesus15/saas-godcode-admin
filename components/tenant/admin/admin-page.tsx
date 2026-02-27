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
        style={{ height: "100vh", background: "#0a0a0a", flexDirection: "column", gap: 20 }}
      >
        <Loader2 className="animate-spin" size={60} color="#e63946" />
        <h3 style={{ color: "white" }}>Cargando Sistema...</h3>
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
