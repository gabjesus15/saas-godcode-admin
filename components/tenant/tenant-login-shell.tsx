"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { TenantLoginForm } from "./tenant-login-form";

interface TenantLoginShellProps {
  subdomain: string;
  displayName: string;
  logoUrl: string | null;
}

export function TenantLoginShell({ subdomain, displayName, logoUrl }: TenantLoginShellProps) {
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);

  useEffect(() => {
    if (!isSuccessLoading) return;

    const fallbackTimeout = window.setTimeout(() => {
      setIsSuccessLoading(false);
    }, 5000);

    return () => window.clearTimeout(fallbackTimeout);
  }, [isSuccessLoading]);

  return (
    <main className="login-shell">
      <div className="login-card glass animate-fade">
        <aside className="login-aside">
          {isSuccessLoading ? (
            <div className="login-aside-loading" role="status" aria-live="polite">
              <div className="login-loading-icon-wrap">
                <Loader2 size={30} className="login-spin" />
              </div>
              <h1 className="login-brand-title">Acceso verificado</h1>
              <p className="login-brand-subtitle">Preparando panel administrativo...</p>
            </div>
          ) : (
            <>
              <div className="login-aside-brand">
                {logoUrl ? (
                  <div className="login-brand-logo-wrap">
                    <Image
                      src={logoUrl}
                      alt={`Logo de ${displayName}`}
                      width={84}
                      height={84}
                      className="login-brand-logo"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="login-icon-circle">
                    <Building2 size={30} />
                  </div>
                )}
                <h1 className="login-brand-title">{displayName}</h1>
                <p className="login-brand-subtitle">Gestión de pedidos, productos, caja y operación diaria.</p>
              </div>

              <ul className="login-benefits" aria-label="Beneficios del panel">
                <li>
                  <ShieldCheck size={16} />
                  <span>Acceso seguro por roles</span>
                </li>
                <li>
                  <Lock size={16} />
                  <span>Sesión protegida por Supabase Auth</span>
                </li>
              </ul>
            </>
          )}
        </aside>

        <section className="login-main">
          {isSuccessLoading ? (
            <div className="login-mobile-header" role="status" aria-live="polite">
              <div className="login-mobile-validation-icon">
                <Loader2 size={24} className="login-spin" />
              </div>
              <div>
                <h3 className="login-mobile-title">Validando datos de acceso</h3>
                <p className="login-mobile-subtitle">Verificando permisos y preparando tu panel.</p>
              </div>
            </div>
          ) : (
            <div className="login-mobile-header">
              {logoUrl ? (
                <div className="login-mobile-logo-wrap">
                  <Image
                    src={logoUrl}
                    alt={`Logo de ${displayName}`}
                    width={52}
                    height={52}
                    className="login-mobile-logo"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="login-mobile-icon-wrap">
                  <Building2 size={22} />
                </div>
              )}
              <div>
                <h3 className="login-mobile-title">{displayName}</h3>
                <p className="login-mobile-subtitle">Acceso rápido al panel.</p>
              </div>
            </div>
          )}

          <div className="login-content-stack">
            <header className="login-header">
              <h2 className="section-title login-title">Acceso Admin</h2>
              <p className="login-subtitle">Ingresa con tu cuenta autorizada para este local.</p>
            </header>

            <div className="login-actions-stack">
              <TenantLoginForm
                subdomain={subdomain}
                onAuthSuccessStart={async () => {
                  setIsSuccessLoading(true);
                  if (typeof window !== "undefined" && window.innerWidth <= 860) {
                    await new Promise((resolve) => setTimeout(resolve, 520));
                  }
                }}
                showInlineLoading={false}
              />

              <div className="login-footer">
                <Link href={`/${subdomain}`} className="btn btn-secondary">
                  Volver al home
                </Link>
              </div>
            </div>

            <p className="login-help-text">¿Problemas para ingresar? Contacta al administrador de la empresa.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
