# aina-life

大切なペットとの日々を記録する、モダンでおしゃれな生活日記アプリ

## 概要

aina-life は、ペットの日常を写真付きで記録できる日記アプリです。カレンダービューで過去の記録を振り返ったり、体重の推移をグラフで確認したりできます。

## 機能

### MVP機能（v1.0）

- 🔐 **認証**: Google アカウントでログイン
- 🐾 **ペット管理**: 複数ペットの登録・切り替え
- 📔 **日記機能**: 写真付きの日記と予定を記録
  - カテゴリタグ（ごはん、散歩、お薬、通院、体調不良など）
  - 日時指定（過去の記録・未来の予定）
- 📅 **カレンダービュー**: 月/週/日表示の切り替え
- ⚖️ **体重管理**: 記録とグラフ表示
- 🌙 **ダークモード**: システム連動 / 手動切り替え

### 将来機能（Phase 2以降）

- 🐕 お散歩友達機能
- 📷 画像アップロード（Firebase Storage）
- 🔔 通知リマインダー
- 👥 ペット共有（家族間）
- 📊 統計ダッシュボード

## 技術スタック

| 項目           | 技術                        |
| -------------- | --------------------------- |
| フレームワーク | Next.js 16 (Static Export)  |
| 言語           | TypeScript                  |
| ホスティング   | Firebase Hosting            |
| 認証           | Firebase Auth               |
| データベース   | Firestore                   |
| ストレージ     | Firebase Storage            |
| UI ライブラリ  | shadcn/ui + Tailwind CSS v4 |
| アニメーション | Framer Motion               |
| グラフ         | Recharts                    |

## セットアップ

### 前提条件

- Node.js 22.x
- npm 10.x
- Firebase CLI

### インストール

```bash
# リポジトリをクローン
git clone git@github.com:2525aina/aina-life.git
cd aina-life

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集して Firebase の設定を追加
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアプリにアクセスできます。

### ビルド

```bash
npm run build
```

`out/` ディレクトリに静的ファイルが生成されます。

### デプロイ

```bash
firebase deploy
```

## 環境変数

`.env.local` に以下の環境変数を設定してください：

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## ディレクトリ構成

```
aina-life/
├── src/
│   ├── app/                # Next.js App Router ページ
│   │   ├── dashboard/      # ダッシュボード
│   │   ├── calendar/       # カレンダー
│   │   ├── entry/          # 日記エントリー
│   │   ├── weight/         # 体重管理
│   │   ├── pets/           # ペット管理
│   │   └── profile/        # プロフィール
│   ├── components/
│   │   ├── features/       # 機能コンポーネント
│   │   └── ui/             # shadcn/ui コンポーネント
│   ├── contexts/           # React Context
│   ├── hooks/              # カスタムフック
│   └── lib/                # ユーティリティ
├── public/                 # 静的ファイル
├── firestore.rules         # Firestore セキュリティルール
├── storage.rules           # Storage セキュリティルール
└── firebase.json           # Firebase 設定
```

## Firebase コンソール設定

1. **Authentication**
   - Google プロバイダを有効化
   - 承認済みドメインに `aina-life.web.app` を追加

2. **Firestore**
   - データベースを作成（本番モード）
   - ルールをデプロイ: `firebase deploy --only firestore:rules`

3. **Storage**
   - バケットを作成
   - ルールをデプロイ: `firebase deploy --only storage`

## ライセンス

Private
