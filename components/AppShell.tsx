"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";

// Workspace routes go full-screen (own floating toolbar instead of the global header), so both
// the header and its reserved top padding need to disappear together on those routes.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenRoute = pathname?.startsWith("/workspace/");

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
