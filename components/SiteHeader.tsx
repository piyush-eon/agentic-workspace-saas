"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// Shared across every route (root layout), but the Product/How it works/Pricing links
// are landing-page-specific anchors, so they only render on "/".
export function SiteHeader() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-18 items-center justify-between border-b border-white/6 bg-background/70 px-6 backdrop-blur-md md:px-10">
      <Link href="/" className="flex items-center">
        <Image src="/brand/logo-navbar-dark.png" alt="Outpost" width={314} height={160} className="h-9 w-auto" priority />
      </Link>
      {isLandingPage && (
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="#product" className="transition-colors hover:text-foreground">Product</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground">How it works</Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
        </nav>
      )}
      <div className="flex items-center gap-3">
        {/* <Show> swaps branches once Clerk resolves the session, so the header reflects real auth state */}
        <Show when="signed-out">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </Show>
        <Show when="signed-in">
          {/* Membership-optional: hidePersonal=false lets a solo user stay on their personal
              account instead of being forced to create/join an org. */}
          <OrganizationSwitcher afterCreateOrganizationUrl="/dashboard" afterSelectOrganizationUrl="/dashboard" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
