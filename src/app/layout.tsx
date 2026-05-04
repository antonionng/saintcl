import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const siteOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "https://saintagi.com";
const siteUrl = new URL(siteOrigin);
const siteName = "Saint AGI";
const defaultTitle = "Saint AGI | Governed AI Agents for Modern Teams";
const defaultDescription =
  "Saint AGI helps companies launch governed AI agents with workspace chat, channels, approvals, audit trails, spend control, and runtime operations.";
const ogImage = {
  url: "/saintagi-og-share.png",
  width: 900,
  height: 507,
  alt: "SaintAGI infinity mark with the text The agent layer for modern teams.",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "AI agents",
    "enterprise AI agents",
    "governed AI agents",
    "agent workspace",
    "agent control plane",
    "AI governance",
    "multi-model routing",
    "agent runtime operations",
    "business automation",
  ],
  authors: [{ name: siteName, url: siteUrl }],
  creator: siteName,
  publisher: siteName,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  other: {
    "ai-purpose":
      "Saint AGI is an agent layer for modern teams, built for governed company AI agents, business workflows, and operational control.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground antialiased`}>{children}</body>
    </html>
  );
}
