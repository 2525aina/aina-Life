// src/hooks/useAuth.ts
// Firebase Authenticationを利用した認証ロジックをカプセル化するカスタムフック。
// 依存: firebase/auth（GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut）、lib/firebase(auth)

import { useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User, // FirebaseのUser型
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Firebase認証インスタンス

// 認証状態と操作関数を提供するカスタムフック
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null); // 現在のユーザー情報（未ログイン時はnull）
  const [loading, setLoading] = useState(true); // 初期ロードや処理中の状態管理

  useEffect(() => {
    // 認証状態が変化するたびにuserを更新
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // 初期チェック完了
    });

    // アンマウント時に監視を解除（メモリリーク防止）
    return () => unsubscribe();
  }, []);

  // Googleアカウントでログイン
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider); // 成功時は自動的にonAuthStateChangedが発火
      console.log("Googleログイン成功");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Googleログインエラー:", error.message);
        alert(`Googleログインに失敗しました: ${error.message}`);
      } else {
        console.error("Googleログインエラー:", error);
        alert("Googleログインに失敗しました: 詳細不明のエラー");
      }
    } finally {
      setLoading(false);
    }
  };

  // ログアウト処理
  const signOutUser = async () => {
    try {
      setLoading(true);
      await signOut(auth); // 成功時はuserがnullに更新される
      console.log("ログアウト成功");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("ログアウトエラー:", error.message);
        alert(`ログアウトに失敗しました: ${error.message}`);
      } else {
        console.error("ログアウトエラー:", error);
        alert("ログアウトに失敗しました: 詳細不明のエラー");
      }
    } finally {
      setLoading(false);
    }
  };

  // 提供する値
  return { user, loading, signInWithGoogle, signOutUser };
};