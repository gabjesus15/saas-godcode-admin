import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseAuthScope } from "./auth-scope";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const SUPER_ADMIN_PATHS = ["/dashboard", "/companies", "/plans", "/login"];

const resolveScope = (scope?: SupabaseAuthScope): SupabaseAuthScope => {
  if (scope) return scope;

  if (typeof window === "undefined") {
    return "super-admin";
  }

  const pathname = window.location.pathname.toLowerCase();
  const isSuperAdminPath =
    pathname === "/login" || SUPER_ADMIN_PATHS.some((path) => pathname.startsWith(path));

  return isSuperAdminPath ? "super-admin" : "tenant";
};

const getCookieName = (scope: SupabaseAuthScope) =>
  scope === "super-admin" ? "sb-super-admin-auth-token" : "sb-tenant-auth-token";

const getStorageKey = (scope: SupabaseAuthScope) =>
  scope === "super-admin" ? "sb-super-admin-auth-storage" : "sb-tenant-auth-storage";

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;
type ScopedClientStore = Partial<Record<SupabaseAuthScope, SupabaseBrowserClient>>;

const inMemoryClientStore: ScopedClientStore = {};

const getScopedClientStore = (): ScopedClientStore => {
  if (typeof window === "undefined") {
    return inMemoryClientStore;
  }

  const w = window as Window & {
    __saasGodcodeSupabaseClients?: ScopedClientStore;
  };

  if (!w.__saasGodcodeSupabaseClients) {
    w.__saasGodcodeSupabaseClients = {};
  }

  return w.__saasGodcodeSupabaseClients;
};

export function createSupabaseBrowserClient(scope?: SupabaseAuthScope) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const resolvedScope = resolveScope(scope);

  const scopedClientStore = getScopedClientStore();
  const existingClient = scopedClientStore[resolvedScope];

  if (existingClient) {
    return existingClient;
  }

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: getStorageKey(resolvedScope),
    },
    cookieOptions: {
      name: getCookieName(resolvedScope),
    },
    isSingleton: true,
  });

  scopedClientStore[resolvedScope] = client;

  return client;
}
