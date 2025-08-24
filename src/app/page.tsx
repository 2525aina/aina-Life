// src/app/page.tsx
// このファイルはアプリケーションのメインページであり、認証状態に基づいてUIを切り替えます。
// 認証ロジックはカスタムフックに、UIコンポーネントは個別のファイルに分割されています。

"use client"; // このコンポーネントはクライアントサイドで実行されます。

import { useAuth } from "@/hooks/useAuth"; // 作成した認証カスタムフックをインポート
import LoginButton from "@/components/LoginButton"; // ログインボタンコンポーネントをインポート
import UserProfile from "@/components/UserProfile"; // ユーザープロフィールコンポーネントをインポート
import { TaskSelector } from "@/components/TaskSelector"; // ★追加：タスク選択コンポーネント

// Homeコンポーネントの定義
export default function Home() {
  // useAuthフックから認証ユーザー情報とローディング状態を取得します。
  const { user, loading } = useAuth();

  // 認証状態の読み込み中の場合、ローディングメッセージを表示します。
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">aina Life アプリ</h1>

      {/* ユーザーがログインしているかどうかに基づいて表示を切り替えます。 */}
      {user ? (
        // ★変更：ログインしている場合、プロフィールとタスク選択の両方を表示
        <div className="w-full max-w-lg mx-auto">
          <UserProfile />
          <TaskSelector />
        </div>
      ) : (
        // ログインしていない場合、LoginButtonコンポーネントを表示します。
        <LoginButton />
      )}
    </div>
  );
}
