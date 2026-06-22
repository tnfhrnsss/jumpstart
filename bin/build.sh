#!/usr/bin/env bash
# 배포본 빌드: .app + .dmg 를 dist/ 에 생성합니다. (설치는 하지 않음)
# 사용: bin/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d node_modules ] || { echo "▶ 의존성 설치(npm install)..."; npm install; }

echo "▶ electron-builder 로 .app · .dmg 빌드..."
npx electron-builder --mac

echo ""
echo "✅ 빌드 완료. 배포 가능한 결과물:"
ls -1 dist/*.dmg dist/*.zip 2>/dev/null || echo "  (dist/ 에 dmg/zip 이 없습니다 — 로그를 확인하세요)"
echo ""
echo "ℹ️  코드 서명이 없어(개인용) 다른 맥에서 받으면 Gatekeeper가 막을 수 있습니다."
echo "    받은 사람: 우클릭 → 열기  또는  xattr -dr com.apple.quarantine <파일>"
