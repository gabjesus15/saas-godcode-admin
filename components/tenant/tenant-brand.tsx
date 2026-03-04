import { useState } from "react";
import Image from "next/image";

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

const sizeClassByValue: Record<number, string> = {
  40: "h-10 w-10",
  48: "h-12 w-12",
  56: "h-14 w-14",
  64: "h-16 w-16",
  72: "h-[72px] w-[72px]",
  80: "h-20 w-20",
};

export function TenantBrand({ name, logoUrl, size = 64 }: TenantBrandProps) {
  const initials = getInitials(name);
  const [logoError, setLogoError] = useState(false);
  const sizeClass = sizeClassByValue[size] ?? "h-16 w-16";

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-[var(--tenant-primary)] ${sizeClass}`}>
      {logoUrl && !logoError ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes="80px"
          className="object-contain"
          onError={() => setLogoError(true)}
          unoptimized
        />
      ) : (
        <span className="text-xl font-semibold text-white">{initials}</span>
      )}
    </div>
  );
}
