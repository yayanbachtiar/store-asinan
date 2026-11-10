#!/usr/bin/env bash
# Deploy Kas Asinan ke Google Cloud Run — SATU perintah setelah persiapan
# di README selesai (project Firebase + Firestore + secret dibuat).
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

echo "==> Build image via Cloud Build (project: $PROJECT_ID, region: $REGION)"
gcloud builds submit \
  --project "$PROJECT_ID" \
  --config cloudbuild.yaml \
  --substitutions="_NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY:-},_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:-},_NEXT_PUBLIC_FIREBASE_PROJECT_ID=$PROJECT_ID,_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:-},_NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID:-}" \
  .

echo "==> Deploy ke Cloud Run"
# --allow-unauthenticated: akses publik diizinkan di tingkat Cloud Run;
# otorisasi sesungguhnya ditangani aplikasi (login Firebase + whitelist members).
# min-instances 0 = scale-to-zero (hemat, cocok untuk 5 pengguna).
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --image "gcr.io/$PROJECT_ID/kas-asinan:latest" \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "FIREBASE_PROJECT_ID=$PROJECT_ID" \
  --set-secrets "SESSION_SECRET=$SECRET_NAME:latest"

URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)')"
echo ""
echo "Selesai. URL layanan: $URL"
echo "Langkah terakhir (sekali saja):"
echo "1. Set NEXT_PUBLIC_APP_URL=$URL lalu deploy ulang, ATAU abaikan (hanya dipakai redirect logout)."
echo "2. Tambahkan domain ${URL#https://} ke Firebase Console → Authentication → Settings → Authorized domains."
echo "3. Seed produk:  FIREBASE_PROJECT_ID=$PROJECT_ID pnpm seed:products"
