#!/usr/bin/env bash
# Bootstrap FreeLLMAPI as the local content-AI backend for Get Outside.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FREELLMAPI_DIR="$ROOT/freellmapi"
ENV_FILE="$FREELLMAPI_DIR/.env"
CONFIG_FILE="$FREELLMAPI_DIR/config.json"
APP_ENV="$ROOT/.env"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop / Engine, then re-run."
  exit 1
fi

mkdir -p "$FREELLMAPI_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$FREELLMAPI_DIR/.env.example" ]]; then
    cp "$FREELLMAPI_DIR/.env.example" "$ENV_FILE"
  else
    printf "ENCRYPTION_KEY=\nPORT=3001\n" >"$ENV_FILE"
  fi
fi

if ! grep -qE '^ENCRYPTION_KEY=[0-9a-fA-F]{64}$' "$ENV_FILE"; then
  KEY="$(openssl rand -hex 32)"
  if grep -qE '^ENCRYPTION_KEY=' "$ENV_FILE"; then
    # Portable in-place replace without requiring GNU sed.
    TMP="$(mktemp)"
    sed "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=${KEY}/" "$ENV_FILE" >"$TMP"
    mv "$TMP" "$ENV_FILE"
  else
    printf "ENCRYPTION_KEY=%s\n" "$KEY" >>"$ENV_FILE"
  fi
  echo "Wrote ENCRYPTION_KEY to freellmapi/.env"
else
  KEY="$(grep -E '^ENCRYPTION_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
fi

if [[ ! -f "$APP_ENV" && -f "$ROOT/.env.example" ]]; then
  cp "$ROOT/.env.example" "$APP_ENV"
  echo "Created .env from .env.example"
fi

# Also expose for Compose interpolation / other tools.
if [[ -f "$APP_ENV" ]]; then
  if grep -qE '^FREELLMAPI_ENCRYPTION_KEY=' "$APP_ENV"; then
    TMP="$(mktemp)"
    sed "s/^FREELLMAPI_ENCRYPTION_KEY=.*/FREELLMAPI_ENCRYPTION_KEY=${KEY}/" "$APP_ENV" >"$TMP"
    mv "$TMP" "$APP_ENV"
  else
    printf "\nFREELLMAPI_ENCRYPTION_KEY=%s\n" "$KEY" >>"$APP_ENV"
  fi
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
  printf '%s\n' '{
  "routing": {
    "strategy": "balanced"
  }
}' >"$CONFIG_FILE"
  echo "Created freellmapi/config.json (add provider keys via dashboard or config.example.json)."
fi

echo "Starting FreeLLMAPI (profile: llm)…"
docker compose --profile llm up -d freellmapi

echo
echo "FreeLLMAPI dashboard: http://127.0.0.1:3001"
echo "OpenAI-compatible base: http://127.0.0.1:3001/v1"
echo
echo "Next steps:"
echo "  1. Open the dashboard and complete setup (or edit freellmapi/config.json with real free-tier keys, then: docker compose --profile llm restart freellmapi)"
echo "  2. Copy the unified freellmapi-… key from the Keys page"
echo "  3. Put these in your app .env:"
echo
echo "CONTENT_AI_BASE_URL=http://127.0.0.1:3001/v1"
echo "CONTENT_AI_API_KEY=freellmapi-YOUR_UNIFIED_KEY"
echo "CONTENT_AI_MODEL=auto:cheap"
echo "CONTENT_AI_STRUCTURED_OUTPUTS=false"
echo

if [[ -f "$APP_ENV" ]]; then
  if ! grep -qE '^CONTENT_AI_BASE_URL=' "$APP_ENV"; then
    {
      echo ""
      echo "# FreeLLMAPI (local cheap content AI)"
      echo "CONTENT_AI_BASE_URL=http://127.0.0.1:3001/v1"
      echo "CONTENT_AI_API_KEY="
      echo "CONTENT_AI_MODEL=auto:cheap"
      echo "CONTENT_AI_STRUCTURED_OUTPUTS=false"
    } >>"$APP_ENV"
    echo "Appended CONTENT_AI_* stubs to .env — paste your unified key into CONTENT_AI_API_KEY."
  else
    echo "App .env already has CONTENT_AI_BASE_URL — update CONTENT_AI_API_KEY with the unified key."
  fi
else
  echo "No app .env yet. Run: cp .env.example .env  then paste the values above."
fi
