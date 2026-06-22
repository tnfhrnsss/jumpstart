#!/usr/bin/env bash
# GitHub Release 생성 + dmg 업로드.
# 준비물: gh CLI (brew install gh && gh auth login)
# 동작: package.json 의 version 으로 태그(vX.Y.Z) 를 만들고, dist 의 dmg 를 자산으로 올립니다.
# 사용: bin/release.sh
set -euo pipefail
cd "$(dirname "$0")/.."

command -v gh >/dev/null || {
  echo "❌ gh CLI 가 필요합니다.  brew install gh && gh auth login"
  exit 1
}

VER="v$(node -p "require('./package.json').version")"
echo "▶ 릴리스 버전: $VER"

# 1) 배포본 빌드
bash bin/build.sh

# 2) 자산 모으기 (dmg 우선, 환경에 따라 zip 만 있을 수도 있음 — 둘 다 올림)
ASSETS=$(ls -1 dist/*.dmg dist/*.zip 2>/dev/null || true)
[ -n "$ASSETS" ] || { echo "❌ dist/ 에 dmg/zip 이 없습니다."; exit 1; }
echo "▶ 업로드할 자산:"; echo "$ASSETS" | sed 's/^/    /'

# 3) 릴리스 생성(이미 있으면 자산만 덮어씀)
if gh release view "$VER" >/dev/null 2>&1; then
  echo "▶ 기존 릴리스 $VER 에 자산 업로드(덮어쓰기)..."
  # shellcheck disable=SC2086
  gh release upload "$VER" $ASSETS --clobber
else
  echo "▶ 릴리스 $VER 생성 + 자산 업로드..."
  # shellcheck disable=SC2086
  gh release create "$VER" $ASSETS --title "Jumpstart $VER" --generate-notes
fi

echo "✅ 릴리스 완료: https://github.com/tnfhrnsss/jumpstart/releases/tag/$VER"
