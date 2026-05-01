import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function OnboardingPagoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
