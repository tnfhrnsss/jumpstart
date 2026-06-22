#!/usr/bin/env bash
# 데모 데이터(가공의 샘플)로 앱을 띄워 스크린샷 PNG를 저장합니다 — 개인정보 노출 없음.
# 사용: bin/screenshot.sh [출력경로]   (기본: docs/screenshot.png)
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-docs/screenshot.png}"
case "$OUT" in
  /*) ABS="$OUT" ;;
  *) ABS="$(pwd)/$OUT" ;;
esac

[ -d node_modules ] || npm install

echo "▶ 데모 모드로 캡처 중..."
JUMPSTART_DEMO=1 JUMPSTART_SHOT="$ABS" npx electron . >/dev/null 2>&1 || true

if [ -f "$ABS" ]; then
  echo "✅ 저장됨: $OUT"
else
  echo "❌ 캡처 실패 (화면 세션이 있는 데스크톱에서 실행하세요)"
  exit 1
fi
