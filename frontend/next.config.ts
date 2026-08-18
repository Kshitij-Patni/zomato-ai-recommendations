import type { NextConfig } from "next";

function normalizeUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  let url = raw.trim();
  if (!url) return null;
  // Ensure the URL has a protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  // Remove trailing slash
  return url.replace(/\/+$/, "");
}

const apiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
