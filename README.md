# aina-life

大切なペットとの日々を記録する、モダンでおしゃれな生活日記アプリ

## 概要

aina-life は、ペットの日常を写真付きで記録できる日記アプリです。カレンダービューで過去の記録を振り返ったり、体重の推移をグラフで確認したりできます。

## 機能

- 🔐 **認証**: Google アカウントでログイン
- 🐾 **ペット管理**: 複数ペットの登録・切り替え
- 📔 **日記機能**: 写真付きの日記と予定を記録
  - カテゴリタグ（ごはん、散歩、お薬、通院、体調不良など）
  - 日時指定（過去の記録・未来の予定）
- 📅 **カレンダービュー**: 月/週/日表示の切り替え
- ⚖️ **体重管理**: 記録とグラフ表示
- 🌙 **ダークモード**: システム連動 / 手動切り替え
- 🐕 **お散歩友達機能**
- 📷 **画像アップロード（Firebase Storage）**
- 👥 **ペット共有（家族間）**
- 📊 **統計ダッシュボード**

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

Next.js の開発サーバーと Firebase Emulators を同時に起動する場合（推奨）：

```bash
# 開発サーバーとエミュレータを同時起動（データ永続化あり）
npm run dev:full
```

- Next.js: http://localhost:3000
- Emulator UI: http://localhost:4000

上記コマンドを実行すると、`firebase-data` ディレクトリにデータが保存され、次回起動時にもデータが引き継がれます（`Ctrl+C` で終了時に自動保存されます）。

エミュレータなしで Next.js のみ起動する場合：

```bash
npm run dev
```

### Node.js バージョン管理 (.nvmrc)

プロジェクトルートにある `.nvmrc` ファイルは、このプロジェクトで推奨される Node.js のバージョン（v22）を指定しています。
`nvm` (Node Version Manager) を導入している環境では、以下のコマンドを実行するだけで適切なバージョンに切り替わります。

```bash
nvm use
```

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
