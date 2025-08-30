// src/components/LoginButton.tsx
// Googleログインボタンを表示し、クリック時に認証処理を実行するコンポーネント。
// 依存: useAuth (認証用カスタムフック)

import React from "react";
import { useAuth } from "@/hooks/useAuth"; // 認証用フックをインポート

const LoginButton: React.FC = () => {
  // useAuthフックからログイン関数とローディング状態を取得
  // ローディング中はボタンを無効化して二重送信を防ぎます
  const { signInWithGoogle, loading } = useAuth();

  // ボタンクリック時の処理
  const handleClick = () => {
    // ローディング中でなければログイン処理を実行
    if (!loading) {
      signInWithGoogle();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading} // ローディング中はクリック不可
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {/* ローディング中は表示テキストを変更し、ユーザーに処理中であることを通知 */}
      {loading ? "ログイン中..." : "Googleでログイン"}
    </button>
  );
};

export default LoginButton;
