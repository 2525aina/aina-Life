// src/components/LoginButton.tsx
// このコンポーネントは、Googleログインボタンを表示し、クリック時に認証処理をトリガーします。

import React from 'react';
import { useAuth } from '@/hooks/useAuth'; // 作成したカスタムフックをインポート

// LoginButtonコンポーネントの定義
const LoginButton: React.FC = () => {
  // useAuthフックからログイン関数を取得します。
  // loading状態も取得し、ボタンの無効化に使用します。
  const { signInWithGoogle, loading } = useAuth();

  // ボタンがクリックされたときのハンドラ
  const handleClick = () => {
    // ローディング中でなければ、Googleログイン処理を開始します。
    if (!loading) {
      signInWithGoogle();
    }
  };

  return (
    <button
      onClick={handleClick}
      // ローディング中はボタンを無効化し、ユーザーが複数回クリックするのを防ぎます。
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {/* ローディング中はテキストを変更して、ユーザーに処理中であることを伝えます。 */}
      {loading ? 'ログイン中...' : 'Googleでログイン'}
    </button>
  );
};

export default LoginButton;
