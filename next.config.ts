import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clerk serves user avatars from here (shown on the workspace board cards).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com" }],
  },
};

export default nextConfig;
