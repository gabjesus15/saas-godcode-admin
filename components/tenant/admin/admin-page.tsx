"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
    return null;
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

        <section className="glass admin-migration-card">
          <h2 className="admin-migration-title">{activeTab}</h2>
          <p className="admin-migration-text">
            Seccion en migracion. Voy a ir portando cada modulo de OishiPrueba en este orden: pedidos,
            productos/categorias, clientes, caja, reportes, herramientas, empresa.
          </p>
          <div className="admin-migration-meta">
            Sucursales cargadas: {branches.length}
          </div>
        </section>
      </main>
    </div>
  );
}
