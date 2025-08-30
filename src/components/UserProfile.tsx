// src/components/UserProfile.tsx
// ログイン中のユーザー情報を表示し、ログアウト機能を提供するコンポーネント。
// 依存: useAuth（認証フック）、next/image（プロフィール画像表示）

import React from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth"; // 認証状態と操作関数を提供するカスタムフック

const UserProfile: React.FC = () => {
  const { user, signOutUser, loading } = useAuth(); // 認証ユーザー、ログアウト関数、処理中状態

  // 未ログイン時はUIを表示しない（認証前ユーザーには不要なため）
  if (!user) return null;

  // ログアウト処理のハンドラ
  const handleLogoutClick = () => {
    if (!loading) signOutUser(); // 処理中は多重実行を防ぐ
  };

  return (
    <div className="text-center">
      {/* ユーザー名があれば表示、なければメールアドレスを代替表示 */}
      <p className="text-xl mb-4">
        ようこそ、{user.displayName || user.email}さん！
      </p>

      {/* プロフィール画像が設定されている場合のみ表示 */}
      {user.photoURL && (
        <Image
          src={user.photoURL}
          alt="User Photo"
          width={96} // w-24 (96px)
          height={96} // h-24 (96px)
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
      )}

      <button
        onClick={handleLogoutClick}
        disabled={loading} // ローディング中はクリック無効化
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        {loading ? "ログアウト中..." : "ログアウト"}
      </button>
    </div>
  );
};

export default UserProfile;
