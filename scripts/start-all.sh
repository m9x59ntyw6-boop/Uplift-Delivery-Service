#!/usr/bin/env bash
set -e

API_PID=""

# Only start the API server if it's not already listening on port 8080
if curl -s --max-time 1 http://localhost:8080 -o /dev/null 2>&1; then
  echo "✅  API server already running on port 8080"
else
  echo "▶  Starting Uplift API server..."
  pnpm --filter @workspace/api-server run dev &
  API_PID=$!

  echo "⏳  Waiting for API server on port 8080..."
  WAITED=0
  until curl -s --max-time 1 http://localhost:8080 -o /dev/null 2>&1; do
    sleep 1
    WAITED=$((WAITED + 1))
    if [ $WAITED -ge 30 ]; then
      echo "⚠️  API server did not respond within 30s — starting Expo anyway"
      break
    fi
  done
  echo "✅  API server is up"
fi

echo "▶  Starting Expo Go..."
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN \
EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN \
EXPO_PUBLIC_REPL_ID=$REPL_ID \
REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN \
pnpm --filter @workspace/uplift exec expo start --localhost --port $PORT

# Keep the API server alive if we started it
[ -n "$API_PID" ] && wait $API_PID
