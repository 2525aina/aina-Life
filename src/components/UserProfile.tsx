// src/components/UserProfile.tsx
// このコンポーネントは、ログインしているユーザーの情報を表示し、ログアウトボタンを提供します。

import React from 'react';
import { useAuth } from '@/hooks/useAuth'; // 作成したカスタムフックをインポート

// UserProfileコンポーネントの定義
const UserProfile: React.FC = () => {
  // useAuthフックからユーザー情報とログアウト関数、ローディング状態を取得します。
  const { user, signOutUser, loading } = useAuth();

  // ユーザーがログインしていない、またはローディング中の場合は何も表示しません。
  // ただし、useAuthフック内でloading状態が管理されているため、
  // ここではuserがnullでないことを確認するだけで十分です。
  if (!user) {
    return null;
  }

  // ログアウトボタンがクリックされたときのハンドラ
  const handleLogoutClick = () => {
    // ローディング中でなければ、ログアウト処理を開始します。
    if (!loading) {
      signOutUser();
    }
  };

  return (
    <div className="text-center">
      {/* ユーザーの表示名またはメールアドレスを表示します。 */}
      <p className="text-xl mb-4">
        ようこそ、{user.displayName || user.email}さん！
      </p>
      {/* ユーザーのプロフィール画像があれば表示します。 */}
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt="User Photo"
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
      )}
      <button
        onClick={handleLogoutClick}
        // ローディング中はボタンを無効化します。
        disabled={loading}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        {/* ローディング中はテキストを変更します。 */}
        {loading ? 'ログアウト中...' : 'ログアウト'}
      </button>
    </div>
  );
};

export default UserProfile;
