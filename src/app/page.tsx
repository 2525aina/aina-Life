// src/app/page.tsx
// このファイルはアプリケーションのメインページであり、認証状態に基づいてUIを切り替えます。
// 認証ロジックはカスタムフックに、UIコンポーネントは個別のファイルに分割されています。

'use client'; // このコンポーネントはクライアントサイドで実行されます。

import { useAuth } from '@/hooks/useAuth'; // 作成した認証カスタムフックをインポート
import LoginButton from '@/components/LoginButton'; // ログインボタンコンポーネントをインポート
import UserProfile from '@/components/UserProfile'; // ユーザープロフィールコンポーネントをインポート

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
      <h1 className="text-3xl font-bold mb-8">Aina Life アプリ</h1>

      {/* ユーザーがログインしているかどうかに基づいて表示を切り替えます。 */}
      {user ? (
        // ログインしている場合、UserProfileコンポーネントを表示します。
        <UserProfile />
      ) : (
        // ログインしていない場合、LoginButtonコンポーネントを表示します。
        <LoginButton />
      )}
    </div>
  );
}