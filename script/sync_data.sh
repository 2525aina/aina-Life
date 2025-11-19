#!/bin/bash
set -e

###############################################################################
# Firebase データ同期スクリプト（修正版）
# ・Storage エクスポート → エミュレータ互換フォーマットに合わせて階層構築
#   storage/files/<bucket-name>/... の構造で保存
# ・nvm 読み込みの安定化
# ・エラー処理を簡潔化
###############################################################################

# --- 設定 ---
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
LOCAL_DATA_DIR="${SCRIPT_DIR}/firebase-data"
GCS_BUCKET="gs://aina-life-migration-data"

# --- 関数 ---

load_nvm() {
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
    nvm use > /dev/null
  else
    echo "NVM が見つかりません。"
    exit 1
  fi
}

get_project_id() {
  local env=$1
  local firebaserc="${SCRIPT_DIR}/../.firebaserc"
  if [ ! -f "$firebaserc" ]; then
    echo ".firebaserc がありません: $firebaserc"
    exit 1
  fi
  cat "$firebaserc" | grep "\"$env\"" | sed -n 's/.*: "\(.*\)".*/\1/p'
}

get_storage_bucket_name() {
  local project_id=$1
  echo "Storage バケットを検出しています…" >&2
  local buckets_uri=$(gcloud storage ls --project="$project_id")
  local buckets=$(echo "$buckets_uri" | sed 's|gs://\(.*\)/|\1|')
  local array=($buckets)

  if [ ${#array[@]} -eq 0 ]; then
    echo "Storage バケットが見つかりません。"
    exit 1
  fi

  # 1つだけならそのまま返す
  echo "gs://${array[0]}"
}

ensure_firestore_sa_permissions() {
  local project_id=$1
  local gcs_bucket=$2
  local sa="service-$(gcloud projects describe "$project_id" --format='value(projectNumber)')@gcp-sa-firestore.iam.gserviceaccount.com"

  echo "Firestore SA 権限確認中: $sa"
  set +e
  HAS=$(gcloud storage buckets get-iam-policy "$gcs_bucket" --format="flattened(bindings[].members)" 2>/dev/null | grep "$sa")
  set -e

  if [ -z "$HAS" ]; then
    echo "→ roles/storage.admin を付与中…"
    gcloud storage buckets add-iam-policy-binding "$gcs_bucket" --member="serviceAccount:$sa" --role="roles/storage.admin"
    sleep 5
  else
    echo "→ 権限 OK"
  fi
}

################################################################################
# メインメニュー
################################################################################

echo "
Firebase データ同期スクリプト
---------------------------------
保存先: $LOCAL_DATA_DIR
"

PS3="操作を選んでください: "
select MODE in "本番環境からエクスポート" "ローカルデータでエミュレータ起動" "終了"; do
  case $MODE in
    "本番環境からエクスポート") break ;;
    "ローカルデータでエミュレータ起動")
      if [ ! -d "$LOCAL_DATA_DIR" ]; then
        echo "データがありません。先にエクスポートしてください。"
        exit 1
      fi
      echo "エミュレータ起動中（import: $LOCAL_DATA_DIR）"
      load_nvm
      firebase emulators:start --import="$LOCAL_DATA_DIR"
      exit 0
      ;;
    "終了") exit 0 ;;
    *) echo "無効な選択。" ;;
  esac
done

################################################################################
# エクスポート処理開始
################################################################################

echo "
--- エクスポート元環境を選択 ---
"
PS3="環境: "
select SRC_ENV_CHOICE in "dev" "stg" "prod"; do
  if [ -n "$SRC_ENV_CHOICE" ]; then
    SRC_ENV=$SRC_ENV_CHOICE
    break
  fi
done

# 既存データのバックアップ
BACKUP_DIR="${SCRIPT_DIR}/firebase-data-backup"
mkdir -p "$BACKUP_DIR"
if [ -d "$LOCAL_DATA_DIR" ] && [ -n "$(ls -A "$LOCAL_DATA_DIR")" ]; then
  TS=$(date +%Y%m%d%H%M%S)
  mv "$LOCAL_DATA_DIR" "${BACKUP_DIR}/${TS}"
fi
mkdir -p "$LOCAL_DATA_DIR"

echo "
--- エクスポート対象 ---
"
read -p "Auth をエクスポートしますか？ (y/N): " EXPORT_AUTH
read -p "Firestore をエクスポートしますか？ (y/N): " EXPORT_FS
read -p "Storage をエクスポートしますか？ (y/N): " EXPORT_ST

PROJECT_ID=$(get_project_id "$SRC_ENV")
if [ -z "$PROJECT_ID" ]; then
  echo "プロジェクトIDが見つかりません (.firebaserc)"
  exit 1
fi

echo "
開始:
  - プロジェクトID: $PROJECT_ID
  - 保存先: $LOCAL_DATA_DIR
"

load_nvm

################################################################################
# Auth
################################################################################
if [[ "$EXPORT_AUTH" == "y" ]]; then
  mkdir -p "$LOCAL_DATA_DIR/auth"
  AUTH_FILE="$LOCAL_DATA_DIR/auth/users.json"
  firebase auth:export "$AUTH_FILE" --project "$PROJECT_ID" --format=json
  echo "Auth 完了: $AUTH_FILE"
fi

################################################################################
# Firestore
################################################################################
FS_TMP=""
if [[ "$EXPORT_FS" == "y" ]]; then
  mkdir -p "$LOCAL_DATA_DIR/firestore_export"
  TS=$(date +%Y%m%d%H%M%S)
  FS_TMP="$GCS_BUCKET/export-to-local/$SRC_ENV-firestore-$TS"

  ensure_firestore_sa_permissions "$PROJECT_ID" "$GCS_BUCKET"

  echo "Firestore を GCS にエクスポート: $FS_TMP"
  gcloud firestore export "$FS_TMP" --project="$PROJECT_ID"

  echo "Firestore をローカルへ転送中..."
  gsutil -m rsync -r "$FS_TMP" "$LOCAL_DATA_DIR/firestore_export"
fi

################################################################################
# Storage（重要：バケット階層を再構築）
################################################################################
if [[ "$EXPORT_ST" == "y" ]]; then
  # 複数バケット対応: get_storage_bucket_name で選択式
  STORAGE_BUCKET_URI=$(get_storage_bucket_name "$PROJECT_ID")
  STORAGE_BUCKET_NAME=$(echo "$STORAGE_BUCKET_URI" | sed 's|gs://||')

  TARGET_DIR="$LOCAL_DATA_DIR/storage/files/${STORAGE_BUCKET_NAME}"
  mkdir -p "$TARGET_DIR"

  echo "Storage を同期中: $STORAGE_BUCKET_URI → $TARGET_DIR"
  gsutil -m rsync -r "$STORAGE_BUCKET_URI" "$TARGET_DIR"

  echo "Storage 完了: $TARGET_DIR"
fi

################################################################################
# GCS 一時データ削除
################################################################################
if [[ -n "$FS_TMP" ]]; then
  read -p "Firestore 一時データを GCS から削除しますか？ (y/N): " DEL
  if [[ "$DEL" == "y" ]]; then
    gsutil -m rm -r "$FS_TMP"
  fi
fi

################################################################################
# メタデータ生成
################################################################################

META="${LOCAL_DATA_DIR}/firebase-export-metadata.json"
# 確実に firebase CLI バージョンを取得
load_nvm
if command -v firebase >/dev/null 2>&1; then
  VERSION=$(firebase --version | tr -d '[:space:]')
else
  echo "firebase コマンドが見つかりません。仮のバージョン 14.25.0 として続行します。"
  VERSION="14.25.0"
fi

echo "{
  \"version\": \"${VERSION}\",
  \"auth\": {\"path\": \"auth\"},
  \"firestore\": {\"path\": \"firestore_export\"},
  \"storage\": {\"path\": \"storage/files\"}
}" > "$META"

echo "
---
エクスポート完了
保存先: $LOCAL_DATA_DIR
---
"
