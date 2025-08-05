import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { generateMetadata } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  ...generateMetadata({
    title: "SoulBond AI - Your Perfect AI Companion",
    description: "Find deep emotional connection with an AI that truly understands you. Experience personalized conversations, emotional support, and a companion that grows with you.",
  }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://soulbondai.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SoulBond AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script src="/sw-register.js" defer />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
