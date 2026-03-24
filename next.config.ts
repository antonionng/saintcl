import path from "node:path";
import type { NextConfig } from "next";

function wsToHttp(url?: string) {
  if (!url) return null;
  if (url.startsWith("wss://")) return `https://${url.slice("wss://".length)}`;
  if (url.startsWith("ws://")) return `http://${url.slice("ws://".length)}`;
  return url;
}

const openClawConsoleOrigin = wsToHttp(process.env.OPENCLAW_GATEWAY_URL) ?? "http://127.0.0.1:18789";

const nextConfig: NextConfig = {
  typedRoutes: false,
  experimental: {
    webSockets: true,
  } as NextConfig["experimental"] & { webSockets: true },
  async rewrites() {
    return [
      {
        source: "/openclaw-console",
        destination: `${openClawConsoleOrigin}/`,
      },
      {
        source: "/openclaw-console/:path*",
        destination: `${openClawConsoleOrigin}/:path*`,
      },
    ];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
