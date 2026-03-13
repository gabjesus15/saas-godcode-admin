import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SaasThemeScope } from "@/components/theme/saas-theme-scope";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SaaS Super Admin",
  description: "Super Admin Panel for a multi-tenant SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SaasThemeScope />
        <link rel="preconnect" href="https://saas-godcode-admin.vercel.app" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://YOUR_SUPABASE_PROJECT.supabase.co" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/outfit.css" as="style" />
        <link rel="preload" href="/fonts/Outfit-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Outfit-Bold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/nevis.ttf" />
        <link rel="stylesheet" href="/fonts/Aleo-Light.otf" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased transition-colors duration-200`}
      >
        {/* Logo y slogan eliminados del layout global por petición del usuario */}
        {children}
      </body>
    </html>
  );
}
