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

## 3. ビルド時のエラーと警告の修正

Googleログイン機能の実装後、`npm run build` 実行時に以下のエラーと警告が発生する場合があります。

### 3.1. ESLintエラー (`@typescript-eslint/no-explicit-any`) の修正

`src/hooks/useAuth.ts` で発生する `Unexpected any. Specify a different type.`というエラーは、TypeScriptの型安全性を高めるためのESLintルールによるものです。
`any`型の使用を避け、より具体的な型を指定するか、`unknown` 型を使用して型チェックを行うことで修正できます。

**修正内容:**

`catch (error: any)` の箇所を `catch (error: unknown)` に変更し、`error` が`Error`型のインスタンスであるかをチェックするロジックを追加します。

**修正前:**

```Typescript
} catch (error: any) {
  console.error("Googleログインエラー:", error.message);
  alert(Googleログインに失敗しました: ${error.message});
}
```

**修正後:**

```Typescript
 } catch (error: unknown) {
   // error が Error 型かどうかを判定してから message を参照します
   if (error instanceof Error) {
     console.error("Googleログインエラー:", error.message);
     alert(Googleログインに失敗しました: ${error.message});
   } else {
     console.error("Googleログインエラー:", error);
     alert("Googleログインに失敗しました: 詳細不明のエラー");
   }
 }
 ```

 
 ### 3.2. 画像最適化に関する警告 (`@next/next/no-img-element`)
 
 `src/components/UserProfile.tsx` で発生する `Using <img> could result in slower LCP and higher bandwidth. Considerusing <Image /> from next/image` という警告は、Next.jsの画像最適化機能に関するものです。
 この警告は、`<img>` タグの代わりにNext.jsが提供する `<Image />` コンポーネントを使用することで解消できます。`<Image/>`
 コンポーネントは、画像の遅延読み込み、サイズ最適化、フォーマット変換などを自動的に行い、パフォーマンスを向上させます。
 
 **修正内容:**
 
 `src/components/UserProfile.tsx` の `<img>` タグを `next/image` からインポトした `<Image />`コンポーネントに置き換えます。
 
 **修正前:**
 ```Typescript
       {user.photoURL && (
         <img
           src={user.photoURL}
           alt="User Photo"
           className="w-24 h-24 rounded-full mx-auto mb-4"
         />
       )}
 ```

  **修正後:**

  ```Typescript
  import Image from 'next/image'; // 先頭に追記
       {user.photoURL && (
         <Image
           src={user.photoURL}
           alt="User Photo"
           width={96} // <img>のw-24 (96px) に合わせる
           height={96} // <img>のh-24 (96px) に合わせる
           className="w-24 h-24 rounded-full mx-auto mb-4"
         />
       )}
  ```
  **注意:** `<Image />` コンポーネントを使用する場合、`width` と `height` プロパィの指定が必須となります。  
  CSSの `w-24`と `h-24` はTailwind CSSのクラスで、それぞれ `width: 6rem;` と `height: 6rem;` に相当し、デフォルトのrem設定では `96px`になります。  

### 3.2.1. 外部ドメインの画像最適化に関する警告

Next.jsのImageコンポーネントを使用する際に、Googleアカウントのプロフィール画像など、外部ドメインの画像を表示しようとすると、以下のような警告が表示されることがあります。

```
Image optimization host "lh3.googleusercontent.com" is not configured in `next.config.js`.
```

これは、Next.jsがセキュリティ上の理由から、最適化する画像のホストを明示的に許可する必要があるためです。この警告を解消するには、`next.config.ts`ファイルに以下の設定を追加します。

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
```

この設定により、`lh3.googleusercontent.com`からの画像がNext.jsによって最適化され、警告が表示されなくなります。  
