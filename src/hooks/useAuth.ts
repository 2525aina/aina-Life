// src/hooks/useAuth.ts
// このファイルは、Firebase Authenticationのロジックをカプセル化するカスタムフックを提供します。
// アプリケーション全体で認証状態を簡単に管理・利用できるようにします。

import { useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User, // FirebaseのUser型をインポート
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Firebaseのauthインスタンスをインポート

// useAuthカスタムフックの定義
// このフックは、現在の認証ユーザー情報、ローディング状態、ログイン・ログアウト関数を返します。
export const useAuth = () => {
  // 認証ユーザー情報を保持するstate。初期値はnull（未ログイン状態）。
  // User型またはnullを許容します。
  const [user, setUser] = useState<User | null>(null);
  // 認証処理中のローディング状態を保持するstate。初期値はtrue（初回読み込み中）。
  const [loading, setLoading] = useState(true);

  // コンポーネントのマウント時に認証状態の監視を開始し、アンマウント時に解除します。
  useEffect(() => {
    // onAuthStateChangedは、認証状態が変化するたびに呼び出されるリスナーを設定します。
    // ユーザーがログイン、ログアウト、または認証状態が初期化されるたびに発火します。
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // 認証状態が変化したら、userステートを更新します。
      setUser(currentUser);
      // ローディング状態をfalseに設定し、認証状態の初期読み込みが完了したことを示します。
      setLoading(false);
    });

    // クリーンアップ関数: コンポーネントがアンマウントされる際にリスナーを解除します。
    // これにより、メモリリークを防ぎ、不要な処理が実行されるのを防ぎます。
    return () => unsubscribe();
  }, []); // 依存配列が空なので、このエフェクトはコンポーネントのマウント時に一度だけ実行されます。

  // Googleアカウントでログインする非同期関数
  const signInWithGoogle = async () => {
    // Google認証プロバイダーのインスタンスを作成します。
    const provider = new GoogleAuthProvider();
    try {
      // ログイン処理が開始される前にローディング状態をtrueに設定します。
      setLoading(true);
      // ポップアップウィンドウを開いてGoogle認証フローを開始します。
      // 認証が成功すると、onAuthStateChangedリスナーが発火し、userステートが更新されます。
      await signInWithPopup(auth, provider);
      console.log("Googleログイン成功！");
    } catch (error: unknown) {
      // error が Error 型かどうかを判定してから message を参照します
      if (error instanceof Error) {
      // エラーが発生した場合、コンソールにエラーメッセージを出力し、アラートを表示します。
      console.error("Googleログインエラー:", error.message);
      alert(`Googleログインに失敗しました: ${error.message}`);
            } else {
        console.error("Googleログインエラー:", error);
        alert("Googleログインに失敗しました: 詳細不明のエラー");
      }
    } finally {
      // ログイン処理が完了したら、ローディング状態をfalseに設定します。
      // 成功・失敗に関わらず実行されます。
      setLoading(false);
    }
  };

  // ログアウトする非同期関数
  const signOutUser = async () => {
    try {
      // ログアウト処理が開始される前にローディング状態をtrueに設定します。
      setLoading(true);
      // 現在のユーザーをログアウトさせます。
      // ログアウトが成功すると、onAuthStateChangedリスナーが発火し、userステートがnullに更新されます。
      await signOut(auth);
      console.log("ログアウト成功！");
    } catch (error: unknown) {
      if (error instanceof Error) {
        // エラーが発生した場合、コンソールにエラーメッセージを出力し、アラートを表示します。
        console.error("ログアウトエラー:", error.message);
        alert(`ログアウトに失敗しました: ${error.message}`);
      } else {
        console.error("ログアウトエラー:", error);
        alert("ログアウトに失敗しました: 詳細不明のエラー");
      }
    } finally {
      // ログアウト処理が完了したら、ローディング状態をfalseに設定します。
      setLoading(false);
    }
  };

  // カスタムフックが返す値:
  // - user: 現在の認証ユーザー情報 (Userオブジェクトまたはnull)
  // - loading: 認証状態の読み込み中かどうか (boolean)
  // - signInWithGoogle: Googleログインを実行する関数
  // - signOutUser: ログアウトを実行する関数
  return { user, loading, signInWithGoogle, signOutUser };
};