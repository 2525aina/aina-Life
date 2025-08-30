// src/app/page.tsx
// アプリのメインページ。
// 認証状態に応じてログイン画面またはダッシュボードを表示する。
// 依存: useAuth, useLogbook, 各種UIコンポーネント

"use client"; // このコンポーネントはクライアントサイドで実行される

// React関連
import { useState } from "react"; // コンポーネント内で状態管理に使用

// 認証・データ取得フック
import { useAuth } from "@/hooks/useAuth"; // 認証状態とユーザー情報を管理
import { useLogbook } from "@/hooks/useLogbook"; // ログデータを管理

// UIコンポーネント
import LoginButton from "@/components/LoginButton"; // ログイン開始ボタン
import UserProfile from "@/components/UserProfile"; // ユーザー情報を表示
import { TaskSelector } from "@/components/TaskSelector"; // タスク選択UI
import { LogTimeline } from "@/components/LogTimeline"; // ユーザーのログ履歴を表示
import { Header } from "@/components/Header"; // 画面上部の共通ヘッダー
import { FooterNav } from "@/components/FooterNav"; // 画面下部のナビゲーションバー
import { QuickAddButton } from "@/components/QuickAddButton"; // ログを即時追加するボタン
import { ManualAddLogModal } from "@/components/ManualAddLogModal"; // 手動でログを追加するモーダル

// メインページの定義
export default function Home() {
  // 認証フックからユーザー情報とローディング状態を取得
  const { user, loading } = useAuth();

  // モーダルの開閉状態を管理
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ログブックからユーザーのログデータを取得
  const { logs } = useLogbook();

  // 認証状態の判定が終わるまで「読み込み中」を表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header /> {/* 共通ヘッダー */}
      <main className="flex-grow w-full pb-16">
        {user ? (
          // 認証済みの場合：ダッシュボードを表示
          <>
            <div className="max-w-lg mx-auto p-4 space-y-4">
              <UserProfile /> {/* ユーザー情報 */}
              <TaskSelector /> {/* タスク選択 */}
              <LogTimeline logs={logs} /> {/* ログ履歴を表示 */}
            </div>
            <QuickAddButton onClick={() => setIsModalOpen(true)} />{" "}
            {/* 新規ログ追加ボタン */}
            <ManualAddLogModal
              isOpen={isModalOpen} // 開閉状態
              onClose={() => setIsModalOpen(false)} // 閉じる処理
            />
          </>
        ) : (
          // 未認証の場合：ログイン画面を表示
          <div className="min-h-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-8">aina Life アプリ</h1>
            <LoginButton /> {/* ログインボタン */}
          </div>
        )}
      </main>
      <FooterNav /> {/* 共通フッターナビ */}
    </div>
  );
}
