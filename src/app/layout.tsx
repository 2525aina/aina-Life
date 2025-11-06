import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "aina-Life | 大切な家族との毎日を、もっと豊かに🐾",
  description: "ペットやお子様の食事や体調など、日々の記録を簡単管理。家族やパートナーと情報を共有し、健康管理をもっとスマートに。aina-Lifeで、大切な家族の成長を見守りましょう。",
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/icon-512x512.png",
    apple: "/icon-512x512.png",
  },
  openGraph: {
    title: "aina-Life | 大切な家族との毎日を、もっと豊かに🐾",
    description: "ペットやお子様の食事や体調など、日々の記録を簡単管理。家族やパートナーと情報を共有し、健康管理をもっとスマートに。aina-Lifeで、大切な家族の成長を見守りましょう。",
    url: "https://aina-life-dev.web.app",
    siteName: "aina-Life",
    images: [
      {
        url: "https://aina-life-dev.web.app/huku.png",
        width: 1070,
        height: 1070,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "aina-Life | 大切な家族との毎日を、もっと豊かに🐾",
    description: "ペットやお子様の食事や体調など、日々の記録を簡単管理。家族やパートナーと情報を共有し、健康管理をもっとスマートに。aina-Lifeで、大切な家族の成長を見守りましょう。",
    images: ["https://aina-life-dev.web.app/huku.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}