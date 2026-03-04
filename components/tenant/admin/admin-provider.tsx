"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "../../../utils/supabase/client";

interface BranchInfo {
  id: string;
  name: string | null;
  address?: string | null;
  company_id?: string | null;
}

interface AdminNotification {
  msg: string;
  type: "success" | "error";
}

interface AdminContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  branches: BranchInfo[];
  selectedBranch: BranchInfo | null;
  setSelectedBranch: (branch: BranchInfo | null) => void;
  loading: boolean;
  notification: AdminNotification | null;
  showNotify: (msg: string, type?: "success" | "error") => void;
  userRole: string | null;
  userEmail: string | null;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used within AdminProvider");
  return context;
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("orders");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<AdminNotification | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showNotify = useCallback((msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    const timer = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient("tenant");
        const { data: userData } = await supabase.auth.getUser();
        const email = userData.user?.email ?? null;
        setUserEmail(email);

        if (email) {
          const normalizedEmail = email.trim().toLowerCase();
          const { data: adminUser } = await supabase
            .from("admin_users")
            .select("role")
            .ilike("email", normalizedEmail)
            .maybeSingle();
          setUserRole(adminUser?.role ?? null);
        }

        const { data: branchRows } = await supabase
          .from("branches")
          .select("id,name,address,company_id")
          .order("name");

        const branchList = (branchRows ?? []) as BranchInfo[];
        setBranches(branchList);
        setSelectedBranch((prev) => prev ?? branchList[0] ?? null);
      } catch {
        showNotify("Error de conexión", "error");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [showNotify]);

  const value = useMemo<AdminContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      isMobile,
      branches,
      selectedBranch,
      setSelectedBranch,
      loading,
      notification,
      showNotify,
      userRole,
      userEmail,
    }),
    [
      activeTab,
      isMobile,
      branches,
      selectedBranch,
      loading,
      notification,
      showNotify,
      userRole,
      userEmail,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
