#!/bin/bash
set -e

: <<'END_HELP'
データ移行スクリプトの使い方

このスクリプトは、FirebaseプロジェクトのFirestoreデータとAuthenticationユーザーデータを、
異なる環境（開発、ステージング、本番、ローカルエミュレータ）間で移行するために使用します。

---

事前準備:
1. Firebase CLIのインストール
   npm install -g firebase-tools
2. Google Cloud SDK (gcloud CLI) のインストールと認証
   gcloud auth application-default login
3. 環境変数の設定:
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   export GOOGLE_APPLICATION_CREDENTIALS="/Users/nakajimadaichi/.config/gcloud/aina-life-prod-ca954c2f6a31-service-account-key.json"
END_HELP

echo "--- データ移行スクリプト ---"
echo "利用可能な環境: dev stg prod local"
read -p "移行元環境を入力してください (dev/stg/prod/local): " SRC_ENV
read -p "移行先環境を入力してください (dev/stg/prod/local): " DST_ENV

SRC_PROJECT="aina-life-$SRC_ENV"
DST_PROJECT="aina-life-$DST_ENV"
BUCKET="gs://aina-life-migration-data"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEMP_DIR="/tmp/aina-life-migration"
mkdir -p "$TEMP_DIR"

EXPORT_PATH="$BUCKET/$SRC_ENV-to-$DST_ENV-$TIMESTAMP"
AUTH_EXPORT_JSON="$TEMP_DIR/auth-users-$SRC_ENV-to-$DST_ENV-$TIMESTAMP.json"
AUTH_BACKUP_JSON="$TEMP_DIR/auth-users-backup-$DST_ENV-$TIMESTAMP.json"

echo "--- データ移行開始: $SRC_ENV ($SRC_PROJECT) → $DST_ENV ($DST_PROJECT) ---"

# ========== 1. バックアップ確認 ==========
read -p "移行先の $DST_ENV ($DST_PROJECT) のデータをバックアップしますか？ (y/N): " BACKUP
if [[ "$BACKUP" == "y" || "$BACKUP" == "Y" ]]; then
  echo "--- 移行先データのバックアップ開始 ---"
  FIRESTORE_SA="service-$(gcloud projects describe $DST_PROJECT --format='value(projectNumber)')@gcp-sa-firestore.iam.gserviceaccount.com"
  HAS_BINDING=$(gcloud storage buckets get-iam-policy $BUCKET --format="flattened(bindings[].members)" 2>/dev/null | grep "$FIRESTORE_SA" || true)
  if [ -z "$HAS_BINDING" ]; then
    echo "権限が不足しています。roles/storage.admin を付与します..."
    gcloud storage buckets add-iam-policy-binding $BUCKET --member="serviceAccount:$FIRESTORE_SA" --role="roles/storage.admin"
  fi
  gcloud firestore export "$BUCKET/$DST_ENV-backup-$TIMESTAMP" --project="$DST_PROJECT"
  echo "バックアップ完了。"
fi

# ========== 2. 移行元データのエクスポート（リトライ付き） ==========
echo "--- 移行元データをエクスポート中 ($SRC_PROJECT) ---"
SRC_FIRESTORE_SA="service-$(gcloud projects describe $SRC_PROJECT --format='value(projectNumber)')@gcp-sa-firestore.iam.gserviceaccount.com"
HAS_BINDING_SRC=$(gcloud storage buckets get-iam-policy $BUCKET --format="flattened(bindings[].members)" 2>/dev/null | grep "$SRC_FIRESTORE_SA" || true)
if [ -z "$HAS_BINDING_SRC" ]; then
  echo "移行元のFirestoreサービスアカウントにも権限を付与します..."
  gcloud storage buckets add-iam-policy-binding $BUCKET --member="serviceAccount:$SRC_FIRESTORE_SA" --role="roles/storage.admin"
fi

MAX_RETRIES=5
RETRY_COUNT=0
while true; do
  set +e
  gcloud firestore export "$EXPORT_PATH" --project="$SRC_PROJECT"
  EXIT_CODE=$?
  set -e
  if [ $EXIT_CODE -eq 0 ]; then
    echo "移行元データエクスポート完了。"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "エラー: 移行元Firestoreエクスポートが最大リトライ回数に達しました。"
    exit 1
  fi
  echo "権限反映待ちの可能性があります。3秒後にリトライします… ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 3
done

# ========== 3. 移行先へのインポート ==========
echo "--- データを移行先 ($DST_PROJECT) にインポート中 ---"
gcloud firestore import "$EXPORT_PATH" --project="$DST_PROJECT"

echo "✅ Firestore データ移行完了"
echo "エクスポート元: $SRC_PROJECT"
echo "インポート先:   $DST_PROJECT"
echo "バックアップ:   $BUCKET/$DST_ENV-backup-$TIMESTAMP"
echo "一時データ:     $EXPORT_PATH"

# ========== 4. Authenticationユーザーデータの移行 ==========
echo ""
echo "--- Authenticationユーザーデータの移行 ---"

# 4-1. 移行先Authenticationユーザーデータのバックアップ
read -p "移行先の $DST_ENV ($DST_PROJECT) のAuthenticationユーザーデータをバックアップしますか？ (y/N): " AUTH_BACKUP
if [[ "$AUTH_BACKUP" == "y" || "$AUTH_BACKUP" == "Y" ]]; then
  echo "--- 移行先Authenticationユーザーデータのバックアップ開始 ---"
  if [[ "$DST_ENV" == "local" ]]; then
    firebase auth:export "$AUTH_BACKUP_JSON" --project "$DST_PROJECT" --format=json --debug
  else
    firebase auth:export "$AUTH_BACKUP_JSON" --project "$DST_PROJECT" --format=json
    gsutil cp "$AUTH_BACKUP_JSON" "$BUCKET/$(basename $AUTH_BACKUP_JSON)"
  fi
  echo "Authenticationユーザーデータのバックアップ完了: $AUTH_BACKUP_JSON"
fi

# 4-2. 移行元Authenticationユーザーデータのエクスポート
echo "--- 移行元Authenticationユーザーデータをエクスポート ---"
if [[ "$SRC_ENV" == "local" ]]; then
  firebase auth:export "$AUTH_EXPORT_JSON" --project "$SRC_PROJECT" --format=json --debug
else
  firebase auth:export "$AUTH_EXPORT_JSON" --project "$SRC_PROJECT" --format=json
  gsutil cp "$AUTH_EXPORT_JSON" "$BUCKET/$(basename $AUTH_EXPORT_JSON)"
fi
echo "Authenticationユーザーデータのエクスポート完了: $AUTH_EXPORT_JSON"

# 4-3. 移行先へのインポート
echo "--- Authenticationユーザーデータを移行先 ($DST_PROJECT) にインポート中 ---"

HASH_ALGO=$(jq -r '.hashAlgorithm' "$AUTH_EXPORT_JSON")
if [[ "$HASH_ALGO" == "null" || -z "$HASH_ALGO" ]]; then
  # hashAlgorithmがnullの場合はオプションなしでimport
  firebase auth:import "$AUTH_EXPORT_JSON" --project "$DST_PROJECT"
else
  HASH_KEY=$(jq -r '.signerKey' "$AUTH_EXPORT_JSON")
  SALT_SEPARATOR=$(jq -r '.saltSeparator' "$AUTH_EXPORT_JSON")
  ROUNDS=$(jq -r '.rounds' "$AUTH_EXPORT_JSON")
  MEM_COST=$(jq -r '.memCost' "$AUTH_EXPORT_JSON")

  firebase auth:import "$AUTH_EXPORT_JSON" \
    --project "$DST_PROJECT" \
    --hash-algo="$HASH_ALGO" \
    --hash-key="$HASH_KEY" \
    --salt-separator="$SALT_SEPARATOR" \
    --rounds="$ROUNDS" \
    --mem-cost="$MEM_COST"
fi

echo "✅ Authenticationユーザーデータ移行完了"
echo "エクスポート元: $SRC_PROJECT"
echo "インポート先:   $DST_PROJECT"
echo "バックアップ:   $AUTH_BACKUP_JSON"
echo "一時データ:     $AUTH_EXPORT_JSON"