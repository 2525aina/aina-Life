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
import { auth, app } from '@/lib/firebase'; // Firebase認証インスタンスとFirebaseアプリ
import { getFirestore, doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'; // Firestore関連

// Firestoreのユーザーデータ型を定義
interface FirestoreUser {
  authName: string;
  authEmail: string;
  nickname?: string;
  birthday?: string;
  gender?: string;
  profileImageUrl?: string;
  introduction?: string;
  primaryPetId?: string;
  settings?: {
    theme?: "light" | "dark" | "system";
    notifications?: {
      dailySummary?: boolean;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 認証状態と操作関数を提供するカスタムフック
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null); // 現在のユーザー情報（未ログイン時はnull）
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null); // Firestoreのユーザー情報
  const [loading, setLoading] = useState(true); // 初期ロードや処理中の状態管理

  const db = getFirestore(app); // Firestoreインスタンスを取得

  useEffect(() => {
    // 認証状態が変化するたびにuserを更新
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // ユーザーがログインしている場合、Firestoreからユーザーデータを取得または作成
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setFirestoreUser(userDocSnap.data() as FirestoreUser);
        } else {
          // ドキュメントが存在しない場合、新しく作成
          const newUserData: FirestoreUser = {
            authName: currentUser.displayName || "名無し",
            authEmail: currentUser.email || "unknown@example.com",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            settings: {
              theme: "system",
              notifications: {
                dailySummary: false,
              },
            },
          };
          await setDoc(userDocRef, newUserData);
          setFirestoreUser(newUserData);
        }
      } else {
        setFirestoreUser(null); // ログアウト時はFirestoreユーザー情報もクリア
      }
      setLoading(false); // 初期チェック完了
    });

    // アンマウント時に監視を解除（メモリリーク防止）
    return () => unsubscribe();
  }, [db]); // dbを依存配列に追加

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

  // Firestoreのユーザーデータを更新する関数
  const updateFirestoreUser = async (data: Partial<FirestoreUser>) => {
    if (!user) {
      throw new Error("ユーザーがログインしていません。");
    }
    const userDocRef = doc(db, "users", user.uid);
    const updatedData = { ...data, updatedAt: Timestamp.now() };
    await updateDoc(userDocRef, updatedData);
    // ローカルの状態も更新
    setFirestoreUser((prev) => (prev ? { ...prev, ...updatedData } as FirestoreUser : null));
  };

  // 提供する値
  return { user, firestoreUser, loading, signInWithGoogle, signOutUser, updateFirestoreUser };
};