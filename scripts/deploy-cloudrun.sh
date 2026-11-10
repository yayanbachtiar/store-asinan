#!/usr/bin/env bash
# Deploy Kas Asinan — SATU perintah setelah persiapan di README selesai.
# Seluruh pipeline (test → build → push Artifact Registry → deploy Cloud Run)
# berjalan di Google Cloud Build lewat cloudbuild.yaml; script ini hanya
# mengirimnya. Tidak ada langkah deploy terpisah di komputer lokal.
#
# Wajib (env):
#   GCP_PROJECT_ID                 Project ID Firebase/GCP, mis. kas-asinan-xxxx
# Opsional (env):
#   GCP_REGION                     default asia-southeast2 (Jakarta)
#   SESSION_SECRET_NAME            nama secret di Secret Manager, default kas-asinan-session-secret
#   NEXT_PUBLIC_FIREBASE_API_KEY / _AUTH_DOMAIN / _MESSAGING_SENDER_ID / _APP_ID
#                                  konfigurasi Web SDK — ditanam saat build.
#                                  Boleh kosong (login nonaktif). Project ID
#                                  client otomatis memakai GCP_PROJECT_ID.
#
# Contoh:
#   GCP_PROJECT_ID=kas-asinan-xxxx \
#   NEXT_PUBLIC_FIREBASE_API_KEY=... NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kas-asinan-xxxx.firebaseapp.com \
#   NEXT_PUBLIC_FIREBASE_APP_ID=... bash scripts/deploy-cloudrun.sh
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Isi GCP_PROJECT_ID dulu (lihat README)}"
REGION="${GCP_REGION:-asia-southeast2}"
SERVICE="kas-asinan"
SECRET_NAME="${SESSION_SECRET_NAME:-kas-asinan-session-secret}"

cd "$(dirname "$0")/.."

echo "==> Kirim pipeline ke Cloud Build (project: $PROJECT_ID, region: $REGION)"
gcloud builds submit \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --config cloudbuild.yaml \
  --substitutions="_REGION=$REGION,_SESSION_SECRET_NAME=$SECRET_NAME,_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-},_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-},_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID:-}" \
  .

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
echo ""
echo "Selesai. URL layanan: $URL"
echo "Langkah terakhir (sekali saja):"
echo "1. Tambahkan domain ${URL#https://} ke Firebase Console → Authentication → Settings → Authorized domains."
echo "2. Seed produk:  FIREBASE_PROJECT_ID=$PROJECT_ID pnpm seed:products"
