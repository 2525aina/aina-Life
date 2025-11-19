# `aina-Life` 開発ガイド - コマンドチートシート

このドキュメントは、`aina-Life`プロジェクトの開発でよく使うコマンドをまとめたチートシートです。

---

## コマンドチートシート

### 初回セットアップ
```bash
# Node.jsのバージョンを合わせて依存関係をインストール
nvm install && nvm use
. ~/.nvm/nvm.sh && nvm use && npm install
# firebase-toolsのインストール
. ~/.nvm/nvm.sh && nvm use && npm install -g firebase-tools
```

### ローカル開発
```bash
# Emulatorを起動 (ターミナル1)
. ~/.nvm/nvm.sh && nvm use && firebase emulators:start
. ~/.nvm/nvm.sh && nvm use && ./script/sync_data.sh

# 開発サーバーを起動 (ターミナル2)
. ~/.nvm/nvm.sh && nvm use && npm run dev
```

### デプロイ
```bash
# ビルドしてデプロイ
. ~/.nvm/nvm.sh && nvm use && npm run build && firebase deploy
```

### トラブルシューティング
```bash
# 依存関係をクリーンアップして再インストール
rm -rf node_modules package-lock.json .firebase .next out && npm cache clean --force
. ~/.nvm/nvm.sh && nvm use && npm install
```

### エミュレーター起動
```bash
firebase experiments:enable webframeworks
npm run build
export GOOGLE_APPLICATION_CREDENTIALS="/Users/nakajimadaichi/.config/gcloud/00_migration-runner_aina-life.json"
./script/sync_data.sh
```