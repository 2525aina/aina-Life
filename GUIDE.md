# プロジェクトガイド

このドキュメントは、`aina-Life`プロジェクトの利用方法と、開発中に発生する可能性のある一般的な問題の解決策をまとめたものです。

---

## アプリケーションの使い方

このセクションでは、`aina-Life`アプリケーションの基本的な使い方を説明します。

1.  **ログイン/アカウント作成**
    ログインページから新しいアカウントを作成するか、既存のGoogleアカウントでログインします。

2.  **ペットの登録**
    ログイン後、ヘッダーのナビゲーションから「ペット管理」ページへ移動し、新しいペットを登録します。

3.  **タスクの登録**
    「タスク管理」ページで、登録したペットに日々のタスク（例: ご飯、散歩）を登録します。

4.  **ログの記録**
    ホーム画面に戻ると、選択中のペットのタスクボタンが表示されます。タスクボタンをクリックすると、そのタスクの実行ログが記録されます。

5.  **ログの確認と編集**
    ホーム画面の日付ナビゲーションを使って、過去の記録を確認したり、手動でログを追加・編集・削除したりできます。

---

## Firebase Emulatorを使用した開発

ローカル環境でFirebaseサービス（Authentication, Firestore, Storageなど）をエミュレートして開発を行うための手順です。これにより、本番環境のデータに影響を与えることなく、安全に開発・テストができます。

1.  **Firebase Emulatorsを起動します:**
    プロジェクトのルートディレクトリで、以下のコマンドを実行します。
    ```bash
    firebase emulators:start
    ```
    これにより、`firebase.json`で設定されているエミュレーター（Auth: 9099, Firestore: 8080, Storage: 9199）が起動します。

2.  **アプリケーションをエミュレーターに接続します:**
    `.env.local`ファイルに以下の環境変数を設定します。
    ```ini
    NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
    ```
    この設定により、アプリケーションは起動しているエミュレーターに自動的に接続されます。

3.  **開発サーバーを起動します:**
    ```bash
    npm run dev
    ```
    ブラウザで `http://localhost:3000` にアクセスすると、エミュレーターに接続されたアプリケーションが表示されます。

---

## トラブルシューティング

開発中に発生した問題とその解決策を記録します。

### Firebaseデプロイ関連のエラー

`npm ci`の失敗や、Firebase Functionsのデプロイ時に`EUSAGE`エラーなどが発生した場合の対処法です。
以下のコマンドはプロジェクトのルートディレクトリで実行してください。

1.  **古い依存・キャッシュ・構成を削除**
    ```bash
    rm -rf node_modules package-lock.json .firebase  .next out
    npm cache clean --force
    ```

2.  **不足している可能性のある依存を再インストール**
    ```bash
    npm install markdown-it @types/markdown-it
    ```

3.  **依存関係を再構築**
    ```bash
    npm install
    ```

4.  **ビルド確認**
    ```bash
    npm run build
    ```

5.  **Firebaseへ再デプロイ**
    ```bash
    firebase deploy
    ```

### `npm ci` エラーが再発した場合

上記手順でも`npm ci`関連のエラーが解消しない場合、以下のコマンドを試してください。

```bash
rm -rf .firebase
firebase deploy --only functions
```

これらの手順により、以下の問題が解消される可能性があります。
- `package-lock.json` の整合性不一致
- SSR自動生成Functionsの`npm ci`失敗
- Cloud Buildの`EUSAGE`エラー

### Node.jsバージョンに関する警告 (`npm warn EBADENGINE`)

`npm install -g firebase-tools` などのコマンド実行時に、`npm warn EBADENGINE Unsupported engine` の警告が表示される場合があります。これは、インストールしようとしているパッケージ（例: `superstatic`）が、現在使用しているNode.jsのバージョンをサポートしていないために発生します。

**原因:**
`firebase-tools` の一部の依存関係は、特定のNode.js LTSバージョン（例: v20, v22, v24）での動作を想定しています。しかし、システムにインストールされているNode.jsのバージョンがそれよりも新しい場合（例: v25.x.x）、この警告が表示されます。

**解決策: `nvm` (Node Version Manager) を使用したバージョン管理**
HomebrewでNode.jsのバージョンをダウングレードするよりも、`nvm` を使用してNode.jsのバージョンを管理する方が、柔軟性があり推奨されます。`nvm` を使うことで、プロジェクトやツールごとに異なるNode.jsバージョンを簡単に切り替えることができます。

1.  **`nvm` のインストール:**
    以下の公式スクリプトを使用して `nvm` をインストールします。
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```
    インストール後、ターミナルを再起動するか、以下のコマンドを実行して `nvm` を現在のセッションに読み込みます。
    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    ```

2.  **互換性のあるNode.jsバージョンのインストールと使用:**
    `firebase-tools` がサポートするNode.js LTSバージョン（例: v20）をインストールし、使用します。
    ```bash
    . ~/.nvm/nvm.sh && nvm install 20
    . ~/.nvm/nvm.sh && nvm use 20
    ```
    `nvm install 20` は、最新のNode.js v20系をインストールします。すでにインストールされている場合は、そのバージョンを使用します。

3.  **`firebase-tools` コマンドの実行:**
    `firebase-tools` や関連する `npm` コマンドを実行する際は、必ず `nvm` で適切なNode.jsバージョンを指定してから実行してください。
    ```bash
    . ~/.nvm/nvm.sh && nvm use 20 && npm install -g firebase-tools
    . ~/.nvm/nvm.sh && nvm use 20 && firebase deploy
    ```
    これにより、`EBADENGINE` 警告を回避し、`firebase-tools` を安定して利用できます。
