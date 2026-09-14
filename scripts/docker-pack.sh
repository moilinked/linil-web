#!/usr/bin/env bash
set -euo pipefail

# Local Docker packaging for offline deploy:
#   1. docker build
#   2. docker save
#   3. zip image + compose files
# Server: unzip, then bash load-and-up.sh (docker load && compose up)

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE_NAME="chat-agent-web"
IMAGE_TAG="$(node -p "require('./package.json').version")"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_IMAGE="${IMAGE_NAME}:latest"
STAMP="$(date +%Y%m%d-%H%M%S)"
STAGE_DIR="${ROOT}/dist/docker-pack"
ZIP_PATH="${ROOT}/dist/${IMAGE_NAME}-${IMAGE_TAG}-${STAMP}.zip"
TAR_NAME="${IMAGE_NAME}.tar"
TAR_PATH="${STAGE_DIR}/${TAR_NAME}"

mkdir -p "${ROOT}/dist"
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

echo "docker build -t ${FULL_IMAGE} -t ${LATEST_IMAGE} ."
docker build -t "$FULL_IMAGE" -t "$LATEST_IMAGE" .

echo "docker save -o ${TAR_PATH} ${FULL_IMAGE} ${LATEST_IMAGE}"
docker save -o "$TAR_PATH" "$FULL_IMAGE" "$LATEST_IMAGE"

cp "${ROOT}/docker-compose.yml" "${STAGE_DIR}/docker-compose.yml"
cp "${ROOT}/.env.docker.example" "${STAGE_DIR}/env.example"
cp "${ROOT}/scripts/docker-load-and-up.sh" "${STAGE_DIR}/load-and-up.sh"

rm -f "$ZIP_PATH"

if command -v zip >/dev/null 2>&1; then
  (
    cd "$STAGE_DIR"
    zip -q "$ZIP_PATH" "$TAR_NAME" docker-compose.yml env.example load-and-up.sh
  )
else
  tar -a -c -f "$ZIP_PATH" -C "$STAGE_DIR" "$TAR_NAME" docker-compose.yml env.example load-and-up.sh
fi

echo "packed: ${ZIP_PATH}"
echo "upload the zip, unzip on the server, then: bash load-and-up.sh"
