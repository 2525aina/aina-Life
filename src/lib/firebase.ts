// src/lib/firebase.ts
// Firebaseの初期化および各サービスインスタンスの取得。
// 依存: 環境変数(NEXT_PUBLIC_FIREBASE_*)、firebase/app, firebase/auth, firebase/firestore

import { initializeApp, getApps, getApp } from 'firebase/app'; // Firebaseアプリ初期化
import { getAuth, connectAuthEmulator } from 'firebase/auth'; // 認証サービス
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'; // Firestoreデータベース

// Firebaseの設定は環境変数から読み込む
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // APIキー
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // 認証用ドメイン
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // プロジェクトID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // ストレージバケット
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // メッセージ送信者ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // アプリID
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // アナリティクス用ID
};

// Firebaseアプリの初期化
// 既に初期化済みの場合は既存のアプリを再利用して多重初期化を防ぐ
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Authenticationのインスタンスを取得
const auth = getAuth(app);

// Firestoreデータベースのインスタンスを取得
const db = getFirestore(app);

// ローカルエミュレータを使用する場合の接続設定
if (process.env.NODE_ENV === 'development') {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
}

// 他モジュールで利用できるようエクスポート
export { app, auth, db };
