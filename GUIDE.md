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
    rm -rf node_modules package-lock.json .firebase
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
