import type { MetadataRoute } from "next";

import { announcementCards } from "@/components/landing/content";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://saintagi.com";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/capabilities", priority: 0.9, changeFrequency: "monthly" },
  { path: "/models", priority: 0.8, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/templates", priority: 0.75, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/gdpr", priority: 0.3, changeFrequency: "yearly" },
  { path: "/ai-usage-policy", priority: 0.3, changeFrequency: "yearly" },
] satisfies Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const news = announcementCards.map((article) => ({
    url: `${siteUrl}/news/${article.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...pages, ...news];
}
