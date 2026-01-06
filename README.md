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

## 更新履歴

### 2026-01-06

**Phase 1: コード品質改善**

- ESLint エラー修正：`no-explicit-any` エラーを適切な型定義に置き換え
- 未使用 import の削除：`Toaster`, `Card`, `CardContent`, `Input`, `Camera`, `User`, `ja` など
- `<img>` → `next/image` への変換：`friends/page.tsx` の画像を最適化
- JSX 内のコメント構文エラーを修正

**対象ファイル:**

- `src/app/layout.tsx`
- `src/app/profile/page.tsx`
- `src/app/friends/page.tsx`
- `src/app/friends/new/page.tsx`
- `src/app/friends/edit/page.tsx`
- `src/app/pets/settings/page.tsx`
- `src/app/pets/new/page.tsx`

**Phase 2: エラーハンドリング共通化**

- 共通エラーハンドラー `lib/errorHandler.ts` を作成
- `handleError()` 関数で一貫したエラー処理を実現
  - 開発者向けコンソールログ
  - ユーザー向け具体的なエラーメッセージ
- 4 コンポーネントに適用（計 14 箇所）

**対象ファイル:**

- `src/lib/errorHandler.ts` (新規)
- `src/app/pets/settings/page.tsx`
- `src/components/features/EntryForm.tsx`
- `src/components/features/CustomTaskEditor.tsx`
- `src/components/features/PendingInvitations.tsx`

**Phase 3: 通信コスト削減（キャッシュ）**

- セッションキャッシュ `lib/cache.ts` を作成
- sessionStorage ベースでタブを閉じると自動クリア
- `useFriends` フックに適用（初期ロード高速化）
- onSnapshot によるリアルタイム更新は維持

**対象ファイル:**

- `src/lib/cache.ts` (新規)
- `src/hooks/useFriends.ts`

**Phase 4: UX/ナビゲーション改善**

- フッターから中央の `+` ボタンを削除（5 アイテム構成に）
- ダッシュボードに FAB を追加（記録作成用）
- 権限チェック付き（canEdit 時のみ表示）

**対象ファイル:**

- `src/components/features/BottomNav.tsx`
- `src/app/dashboard/page.tsx`



