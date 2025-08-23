# aina-Life 実装手順書

## 1. Googleログイン機能の実装

このセクションでは、Firebase Authentication を使用してGoogleログイン機能をアプリケーションに組み込む手順を説明します。

### 1.1. Firebaseクライアントユーティリティファイルの作成

Firebaseの初期化と認証インスタンスのエクスポートを行うファイルを作成します。これにより、Firebaseの設定がアプリケーション全体で再利用可能になります。

**ファイルパス:** `src/lib/firebase.ts`

<details>
<summary>クリックしてコードを表示</summary>

```typescript
// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebaseの設定は環境変数から読み込む
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebaseアプリの初期化
// 既に初期化されている場合は既存のアプリを使用
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Authenticationのインスタンスを取得
const auth = getAuth(app);

export { app, auth };
```

</details>

### 1.2. GoogleログインUIとロジックの実装

アプリケーションのメインページにGoogleログインボタンと認証状態表示ロジックを追加します。

**ファイルパス:** `src/app/page.tsx`

<details>
<summary>クリックしてコードを表示</summary>

```typescript
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
```

</details>

### 1.3. Firebaseコンソールでの設定

Googleログイン機能を有効にするために、Firebaseコンソールで以下の設定を行ってください。

1.  **Firebase Consoleにアクセス:** `https://console.firebase.google.com/` にアクセスし、あなたのプロジェクトを選択します。
2.  **Authenticationへ移動:** 左側のメニューから「Authentication」（認証）を選択します。
3.  **Sign-in methodタブへ移動:** 「Sign-in method」（ログイン方法）タブをクリックします。
4.  **Googleを有効にする:** 「Google」の項目を「有効」に切り替えてください。

### 1.4. 動作確認

開発サーバーを起動し、ブラウザでアプリケーションにアクセスして、Googleログイン機能が正しく動作するか確認してください。

```bash
cd aina-Life && npm run dev
```

## 2. コードのリファクタリング

Googleログイン機能の実装後、コードの可読性、再利用性、保守性を高めるためにリファクタリングを実施しました。これにより、`page.tsx` が認証状態の表示に集中できるようになり、認証ロジックやUIコンポーネントが分離されました。

### 2.1. 認証ロジックのカスタムフックへの抽出

認証状態の管理とログイン・ログアウト処理を `useAuth` カスタムフックにまとめました。

**ファイルパス:** `src/hooks/useAuth.ts`

<details>
<summary>クリックしてコードを表示</summary>

```typescript
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
    } catch (error: any) {
      // エラーが発生した場合、コンソールにエラーメッセージを出力し、アラートを表示します。
      console.error("Googleログインエラー:", error.message);
      alert(`Googleログインに失敗しました: ${error.message}`);
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
    } catch (error: any) {
      // エラーが発生した場合、コンソールにエラーメッセージを出力し、アラートを表示します。
      console.error("ログアウトエラー:", error.message);
      alert(`ログアウトに失敗しました: ${error.message}`);
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
}
```

</details>

### 2.2. UIコンポーネントの分離

ログインボタンとユーザープロフィール表示をそれぞれ独立したコンポーネントに分離しました。

#### 2.2.1. `LoginButton` コンポーネント

**ファイルパス:** `src/components/LoginButton.tsx`

<details>
<summary>クリックしてコードを表示</summary>

```typescript
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
```

</details>

#### 2.2.2. `UserProfile` コンポーネント

**ファイルパス:** `src/components/UserProfile.tsx`

<details>
<summary>クリックしてコードを表示</summary>

```typescript
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
```

</details>

### 2.3. `page.tsx` の最終的な構成

リファクタリング後、`src/app/page.tsx` は認証状態に基づいて、`LoginButton` または `UserProfile` コンポーネントをレンダリングするだけのシンプルな構成になりました。

**ファイルパス:** `src/app/page.tsx`

<details>
<summary>クリックしてコードを表示</summary>

```typescript
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
```

</details>
