"use client";

import { useAntiZoom } from "../tenant/use-anti-zoom";

export function OnboardingAntiZoom({ children }: { children: React.ReactNode }) {
	useAntiZoom();
	return <>{children}</>;
}
