import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings only; the optical-size axis gives large headings a tighter, more characterful cut.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Outpost: Agentic Workspace",
  description: "An AI agent that draws and writes alongside you and your team, live.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  // Link previews (Slack, X, iMessage...). On Vercel, Next fills in the site URL for these paths.
  openGraph: {
    title: "Outpost: Agentic Workspace",
    description: "An AI agent that draws and writes alongside you and your team, live.",
    images: [{ url: "/social/og-image.png", width: 1200, height: 630, alt: "Outpost" }],
  },
  twitter: { card: "summary_large_image", images: ["/social/og-image.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Outpost is dark-only, so Clerk's baseTheme is hardcoded to dark rather than synced to a toggle.
    <ClerkProvider appearance={{ theme: dark, variables: { colorPrimary: "oklch(0.74 0.16 55)" } }}>
      <html
        lang="en"
        className={`dark ${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
