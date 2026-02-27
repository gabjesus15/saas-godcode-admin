import { useState } from "react";

interface TenantBrandProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
}

const getInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("") || "GC";
};

export function TenantBrand({ name, logoUrl, size = 64 }: TenantBrandProps) {
  const initials = getInitials(name);
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--tenant-primary)",
      }}
    >
      {logoUrl && !logoError ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          onError={() => setLogoError(true)}
        />
      ) : (
        <span className="text-xl font-semibold text-white">{initials}</span>
      )}
    </div>
  );
}
