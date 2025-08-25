// src/app/page.tsx
// このファイルはアプリケーションのメインページであり、認証状態に基づいてUIを切り替えます。
// 認証ロジックはカスタムフックに、UIコンポーネントは個別のファイルに分割されています。

"use client"; // このコンポーネントはクライアントサイドで実行されます。

import { useState } from 'react'; // useStateを追加
import { useAuth } from "@/hooks/useAuth"; // 作成した認証カスタムフックをインポート
import LoginButton from "@/components/LoginButton"; // ログインボタンコンポーネントをインポート
import UserProfile from "@/components/UserProfile"; // ユーザープロフィールコンポーネントをインポート
import { TaskSelector } from "@/components/TaskSelector"; // タスク選択コンポーネント
import { LogTimeline } from "@/components/LogTimeline"; // ★追加：ログタイムラインコンポーネント
import { Header } from "@/components/Header";
import { FooterNav } from "@/components/FooterNav";
import { QuickAddButton } from "@/components/QuickAddButton"; // QuickAddButtonを追加
import { ManualAddLogModal } from "@/components/ManualAddLogModal"; // ManualAddLogModalを追加
import { useLogbook } from "@/hooks/useLogbook"; // useLogbookを追加

// Homeコンポーネントの定義
export default function Home() {
  // useAuthフックから認証ユーザー情報とローディング状態を取得します。
  const { user, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダルの開閉状態を管理
  const { logs } = useLogbook(); // useLogbookからlogsを取得

  // 認証状態の読み込み中の場合、ローディングメッセージを表示します。
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header />
      <main className="flex-grow w-full pb-16">
        {user ? (
          <>
            <div className="max-w-lg mx-auto p-4 space-y-4">
              <UserProfile />
              <TaskSelector />
              <LogTimeline logs={logs} /> {/* logsプロパティを渡す */}
            </div>
            <QuickAddButton onClick={() => setIsModalOpen(true)} />
            <ManualAddLogModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </>
        ) : (
          <div className="min-h-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-8">aina Life アプリ</h1>
            <LoginButton />
          </div>
        )}
      </main>
      <FooterNav />
    </div>
  );
}
