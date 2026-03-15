"use client";

// Eliminar el CSS de scroll
import { useEffect } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { createSupabaseBrowserClient } from "../../../utils/supabase/client";

export default function LoginPage() {
    // Previene zoom con control + scroll
    useEffect(() => {
      const handler = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      };
      window.addEventListener("wheel", handler, { passive: false });
      return () => window.removeEventListener("wheel", handler);
    }, []);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showGodCode, setShowGodCode] = useState(false);
  const [godCodeLetters, setGodCodeLetters] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient("super-admin");

      await supabase.auth.signOut();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Animación: mostrar GodCode letra por letra
      setShowGodCode(true);
      let letters = "";
      const godCode = "GodCode";
      for (let i = 0; i < godCode.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        letters += godCode[i];
        setGodCodeLetters(letters);
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#ffffff_55%,_#eef2ff_100%)] px-6 py-10 dark:bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#09090b_55%,_#111827_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(99,102,241,0.12),_transparent_45%)] dark:bg-[radial-gradient(circle_at_80%_20%,_rgba(99,102,241,0.2),_transparent_45%)]" />

      <Card className="relative w-full max-w-md border-zinc-200/80 bg-white/90 p-7 shadow-[0_20px_50px_-22px_rgba(15,23,42,0.35)] dark:border-zinc-700/80 dark:bg-zinc-900/90 dark:shadow-[0_20px_50px_-22px_rgba(0,0,0,0.75)]">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex flex-col items-center justify-center">
            <span style={{fontFamily:'Nevis, sans-serif', fontSize:'2.2rem', color:'#6d28d9', fontWeight:'bold', letterSpacing:'-2px'}}>
              {showGodCode ? (
                <>
                  {godCodeLetters}
                  <span style={{color:'#888'}}>{godCodeLetters.length < 7 ? '|' : ''}</span>
                </>
              ) : 'Gcode'}
            </span>
            <div style={{fontFamily:'Aleo-Light, sans-serif', fontSize:'1rem', color:'#888', marginTop:'-8px'}}>Tu visión, nuestro código.</div>
          </div>

          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <ShieldCheck size={14} />
            Acceso seguro
          </p>

          {/* Eliminado texto SaaS GodCode por petición del usuario */}
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Panel Super Admin</p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Ingresa con tu cuenta autorizada.</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
              placeholder="admin@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">
              {error}
            </div>
          ) : null}

          <Button type="submit" loading={loading} className="mt-1">
            Entrar
          </Button>

          <p className="pt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Protegido por autenticación segura.
          </p>
        </form>
      </Card>
    </div>
  );
}
