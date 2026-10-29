import type { Metadata, Viewport } from "next";
import { Manrope, Source_Serif_4 } from "next/font/google";

import { siteUrl } from "@/config/env";
import { SITE } from "@/config/site";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GIWESA Solutions | Savings, loans and welfare protection in Kenya",
    template: "%s | GIWESA Solutions",
  },
  description: SITE.description,
  applicationName: SITE.name,
  category: "finance",
  keywords: [
    "GIWESA Solutions",
    "microfinance Kenya",
    "savings Homa Bay",
    "micro-loans Kenya",
    "welfare protection",
    "financial inclusion",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: {},
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: SITE.name,
    title: "GIWESA Solutions | Financial confidence, built with community",
    description: SITE.description,
    url: "/",
    images: [
      {
        url: "/og/giwesa-og.png",
        width: 1200,
        height: 630,
        alt: "GIWESA Solutions — financial confidence, built with community.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GIWESA Solutions | Financial confidence, built with community",
    description: SITE.description,
    images: ["/og/giwesa-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: true, email: true, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#013e77",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-KE" className={`${manrope.variable} ${sourceSerif.variable} h-full`}>
      <body className="min-h-full">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
