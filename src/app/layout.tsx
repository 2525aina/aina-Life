// src/app/layout.tsx
// アプリケーション全体のレイアウトを定義するファイル。
// フォント設定や共通スタイル、Toaster（通知）などを配置。
// 依存: next/font/google, react-hot-toast, globals.css

import type { Metadata } from "next"; // ページのメタデータ型定義
import { Geist, Geist_Mono } from "next/font/google"; // Google Fonts の読み込み
import "./globals.css"; // 全体スタイルを読み込む
import { Toaster } from "react-hot-toast"; // トースト通知用コンポーネント
import { PetSelectionProvider } from "@/contexts/PetSelectionContext";

// Geistフォント（サンセリフ）をCSS変数として定義
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"], // ラテン文字のみ
});

// Geistフォント（モノスペース）をCSS変数として定義
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"], // ラテン文字のみ
});

// ページ全体のメタデータを定義
export const metadata: Metadata = {
  title: "aina-Life", // タイトル
  description: "aina-Life - あなたの生活を彩るアプリ", // 説明文
};

// ルートレイアウトコンポーネント
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // レイアウト内に表示するコンテンツ
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`} // フォントとアンチエイリアス適用
      >
        <PetSelectionProvider>
          {children} {/* 各ページのコンテンツ */}
          <Toaster /> {/* グローバル通知コンポーネント */}
        </PetSelectionProvider>
      </body>
    </html>
  );
}
