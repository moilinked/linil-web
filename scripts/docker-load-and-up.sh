#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

IMAGE_TAR="chat-agent-web.tar"

if [[ ! -f "$IMAGE_TAR" ]]; then
  echo "missing $IMAGE_TAR" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  if [[ -f env.example ]]; then
    cp env.example .env
  elif [[ -f .env.example ]]; then
    cp .env.example .env
  else
    echo "missing env.example" >&2
    exit 1
  fi
  echo "created .env from env.example"
fi

echo "docker load -i $IMAGE_TAR"
docker load -i "$IMAGE_TAR"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "docker compose not found" >&2
    exit 1
  fi
}

echo "docker compose up -d --force-recreate"
compose up -d --force-recreate
compose ps
