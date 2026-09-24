#!/usr/bin/env bash
set -euo pipefail

# Local Docker packaging for offline deploy:
#   1. docker build
#   2. docker save
# Server: docker load -i chat-agent-web-<version>-<timestamp>.tar

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

IMAGE_NAME="chat-agent-web"
IMAGE_TAG="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' package.json | head -n1)"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
LATEST_IMAGE="${IMAGE_NAME}:latest"
STAMP="$(date +%Y%m%d-%H%M%S)"
TAR_PATH="${ROOT}/dist/${IMAGE_NAME}-${IMAGE_TAG}-${STAMP}.tar"

mkdir -p "${ROOT}/dist"

echo "docker build --load -t ${FULL_IMAGE} -t ${LATEST_IMAGE} ."
docker build --load -t "$FULL_IMAGE" -t "$LATEST_IMAGE" .

echo "docker save -o ${TAR_PATH} ${FULL_IMAGE} ${LATEST_IMAGE}"
docker save -o "$TAR_PATH" "$FULL_IMAGE" "$LATEST_IMAGE"

echo "packed: ${TAR_PATH}"
echo "deploy: docker load -i $(basename "$TAR_PATH")"
