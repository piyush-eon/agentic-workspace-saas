"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton, OrganizationSwitcher, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { PlanButton } from "@/components/PlanButton";

// Shared across every route (root layout). The landing page gets its section links and a way into
// the app; inside the app, the logo leads home to the dashboard and the plan button takes its place.
export function SiteHeader() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const isLandingPage = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-18 items-center justify-between border-b border-white/6 bg-background/70 px-6 backdrop-blur-md md:px-10">
      <Link href={isSignedIn && !isLandingPage ? "/dashboard" : "/"} className="flex items-center">
        <Image src="/brand/logo-navbar-dark.png" alt="Outpost" width={314} height={160} className="h-9 w-auto" priority />
      </Link>
      {isLandingPage && (
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link href="#product" className="transition-colors hover:text-foreground">Product</Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground">How it works</Link>
          <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
        </nav>
      )}
      <div className="flex items-center gap-3">
        {/* <Show> swaps branches once Clerk resolves the session, so the header reflects real auth state */}
        {/* Modal mode opens Clerk's form over the page; /sign-in and /sign-up stay for redirects. */}
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm">Get started</Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          {/* Membership-optional: hidePersonal=false lets a solo user stay on their personal
              account instead of being forced to create/join an org. */}
          <OrganizationSwitcher afterCreateOrganizationUrl="/dashboard" afterSelectOrganizationUrl="/dashboard" />
          {isLandingPage ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <PlanButton />
          )}
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
