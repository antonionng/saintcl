import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://saintagi.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/callback",
          "/dashboard",
          "/workspace",
          "/account",
          "/settings",
          "/agents",
          "/billing",
          "/invite/",
          "/share/",
          "/login",
          "/signup",
          "/reset-password",
          "/openclaw",
          "/openclaw-console",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
