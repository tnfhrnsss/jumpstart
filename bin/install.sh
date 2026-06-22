#!/usr/bin/env bash
# 로컬 설치: .app 만 빌드해 /Applications/Jumpstart.app 에 설치합니다.
# (개발한 코드를 내 맥의 설치본에 반영할 때 사용 — npm run app 과 동일)
# 사용: bin/install.sh
set -euo pipefail
cd "$(dirname "$0")/.."

[ -d node_modules ] || { echo "▶ 의존성 설치(npm install)..."; npm install; }

echo "▶ .app 빌드(electron-builder --dir)..."
npx electron-builder --dir

echo "▶ /Applications 에 설치..."
rm -rf /Applications/Jumpstart.app
cp -R dist/mac-*/Jumpstart.app /Applications/

echo "✅ /Applications/Jumpstart.app 설치 완료"
