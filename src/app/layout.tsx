import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ClientToaster } from "@/components/features/ClientToaster";

export const metadata: Metadata = {
  metadataBase: new URL("https://aina-life.web.app"),
  title: "aina-life - 生活日記",
  description: "大切な日々を記録し共有する生活日記アプリ",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.webp",
    apple: "/favicon.webp",
  },
  openGraph: {
    title: "aina-life - 生活日記",
    description: "大切な日々を記録し共有する生活日記アプリ",
    url: "https://aina-life.web.app",
    siteName: "aina-life",
    images: [
      {
        url: "/ogp.webp",
        width: 1200,
        height: 630,
        alt: "aina-life - 生活日記",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "aina-life - 生活日記",
    description: "大切な日々を記録し共有する生活日記アプリ",
    images: ["/ogp.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <PetProvider>
              {children}
              <ClientToaster />
            </PetProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
