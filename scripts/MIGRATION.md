# データ移行ガイド

aina-life-dev (旧プロジェクト) から aina-life (新プロジェクト) へのデータ移行手順です。

## 移行対象データ

| 旧データ               | 新データ               | 移行内容                              |
| ---------------------- | ---------------------- | ------------------------------------- |
| `users`                | `users`                | プロフィール、設定                    |
| `pets`                 | `pets`                 | ペット情報                            |
| `pets/{petId}/members` | `pets/{petId}/members` | メンバー情報                          |
| `pets/{petId}/logs`    | `pets/{petId}/entries` | 日記エントリー（タスク名→タグに変換） |
| `pets/{petId}/weights` | `pets/{petId}/weights` | 体重記録                              |

## 移行しないデータ

- `tasks` コレクション（新システムでは固定タグを使用）
- `messages` コレクション（グループチャット機能は廃止）
- 削除済みデータ（`deleted: true`）

## 事前準備

### 1. Firebase Admin SDK のセットアップ

```bash
npm install firebase-admin ts-node
```

### 2. サービスアカウントキーの取得

1. Firebase コンソール → プロジェクト設定 → サービス アカウント
2. 「新しい秘密鍵を生成」をクリック
3. ダウンロードした JSON ファイルを安全な場所に保存

### 3. 環境変数の設定

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

## 移行の実行

### ドライラン（データは変更されません）

```bash
npx ts-node scripts/migrate-data.ts --dry-run
```

### 本番実行

```bash
npx ts-node scripts/migrate-data.ts
```

## 移行後の確認

1. Firebase コンソールで新プロジェクトのデータを確認
2. アプリにログインして動作確認
3. 問題がなければ旧プロジェクトのデータをアーカイブ

## タスク名→タグのマッピング

| 旧タスク名             | 新タグ       |
| ---------------------- | ------------ |
| ごはん, 食事, フード   | 🍚 ごはん     |
| おさんぽ, 散歩         | 🚶 散歩       |
| お薬, 服薬             | 💊 お薬       |
| 通院, 病院             | 🏥 通院       |
| 体調不良, 具合悪い     | 😷 体調不良   |
| 睡眠, 寝た             | 💤 睡眠       |
| うんち, おしっこ       | 💩 排泄       |
| トリミング, シャンプー | ✂️ トリミング |
| 予防接種, ワクチン     | 💉 予防接種   |
| その他                 | 📝 その他     |

## トラブルシューティング

### 認証エラー

```
Error: Could not load the default credentials
```

サービスアカウントキーのパスが正しいか確認してください。

### 権限エラー

```
PERMISSION_DENIED
```

サービスアカウントに必要な権限（Firestore データ閲覧者/編集者）があるか確認してください。

### メモリ不足

大量のデータを移行する場合はバッチ処理を使用してください：

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx ts-node scripts/migrate-data.ts
```
