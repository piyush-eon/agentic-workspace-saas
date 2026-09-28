"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";

// Workspace and shared-link pages are full-screen with their own header, so they skip the site header.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenRoute = pathname?.startsWith("/workspace/") || pathname?.startsWith("/shared/");

  if (isFullScreenRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col pt-18">{children}</div>
    </>
  );
}
