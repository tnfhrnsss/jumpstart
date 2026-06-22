# CLAUDE.md

이 저장소에서 작업하는 Claude Code를 위한 안내. (Claude Code는 루트의 `CLAUDE.md`를 자동으로 읽습니다.)

## 프로젝트
**Jumpstart** — 반복 업무를 클릭 한 번으로 실행하는 macOS용 Electron 데스크탑 앱.
1. **빠른 실행**: 즐겨찾기. 다른 섹션의 ⭐ 버튼으로 추가한 항목({name,dir,cmd})을 모아 실행 (`quick-favorites.json`, 최대 8개). 기본 도구 프리셋은 없음(제거됨)
2. **내 워크플로우**: 사용자가 등록한 "이름/경로/명령" 북마크 실행
3. **Claude Code 디렉토리**: `~/.claude/projects/` 스캔 + 폴더별 git 정보(리포·브랜치·마지막 커밋·푸시 여부). 경로·리포 주소 **검색**, ✕로 **숨김**(`hidden-projects.json`), **이어가기**(claude -c)/**세션 선택**(claude --resume)
4. **자주 여는 곳**: `~/.zsh_history`의 `cd` 기록(존재하는 폴더만) + 앱 실행 기록 합산
5. **최근 실행** 히스토리, **화면 테마**(7종), **터미널 선택**(Terminal/iTerm2/Tabby/커스텀), **열기 방식**(새 창/새 탭), **언어**(한/영), 섹션 **접기/펼치기**(localStorage)

## 구조 (Electron 3-프로세스 분리)
- `main.js` — 메인 프로세스. **모든 Node/OS 작업은 여기서만** (파일 읽기, git 실행, 터미널 기동, 설정 저장)
- `preload.js` — `contextBridge`로 `window.api.*` 노출. **렌더러↔메인의 유일한 통로** (contextIsolation)
- `renderer.js` + `index.html` — UI. Node 권한 없음. `window.api`로만 메인 호출
- `assets/icon.svg`(원본) → `icon.png`(Dock 런타임) / `icon.icns`(패키징)

## 실행 / 빌드
```bash
npm install        # 처음 한 번
npm start          # 개발 모드 (터미널 떠 있는 동안만)
npm run app        # .app 빌드 + /Applications/Jumpstart.app 설치  ← 배포는 이걸로
npm run dist       # dist/mac-*/Jumpstart.app 만 생성
npm run dmg        # 배포용 dmg
```
- 빌드 스크립트는 `bin/` 에도 있음(npm 스크립트와 동일): `bin/install.sh`(=app), `bin/build.sh`(=dmg+zip), `bin/release.sh`(빌드+gh로 GitHub Release), `bin/screenshot.sh`(데모 데이터로 PNG 캡처). README "빌드 / 배포" 참고.
- **스크린샷/데모용 환경변수**(`main.js`): `JUMPSTART_DEMO=1` → 실제 `~/.claude` 대신 가공 샘플 데이터(IPC 핸들러에서 분기). `JUMPSTART_SHOT=<png>` → 렌더 완료(`data-ready`) 대기 후 `capturePage`로 저장하고 종료. 둘은 독립적이며 보통 함께 씀.
- **개발 모드(`npm start`)와 설치된 .app은 별개.** 코드 수정 후 설치본에 반영하려면 반드시 `npm run app`(또는 `bin/install.sh`) 재실행.
- 코드 서명 없음(`build.mac.identity: null`, 개인용). 다른 맥으로 .app/dmg/zip을 받으면 Gatekeeper가 막을 수 있음 → `xattr -dr com.apple.quarantine`.
- DMG 생성은 `hdiutil` 사용 → 제한된 셸(샌드박스/CI)에선 실패할 수 있고, 그땐 `.zip` 산출물이 대안.
- 배포 자산 링크는 버전에 따라 파일명이 바뀌므로 `releases/latest` 페이지로 링크(README·docs).

## 작업 시 주의사항 (실제로 겪은 함정들)
- **IPC를 추가하면 3곳 모두 손봐야 함**: `main.js`의 `ipcMain.handle(...)` + `preload.js`의 `window.api` 노출 + `renderer.js` 호출. preload 노출을 빠뜨리면 `window.api.X is not a function`으로 터짐.
- `renderer.js`의 `refreshAll()`은 섹션별 `safe()` try/catch로 격리되어 있음 — **한 기능이 실패해도 나머지 UI는 떠야 함**. 이 구조를 깨지 말 것 (한 await 실패가 전체를 막았던 회귀가 있었음).
- **터미널 기동은 항상 macOS 기본 Terminal.app(osascript) 기준**이 기본값. 셸 명령은 `shellQuote`, AppleScript 문자열은 `asQuote`로 이스케이프.
- **git remote URL을 표시할 때는 반드시 자격증명 제거** (`stripCreds`/`toWebUrl`). 토큰/비번이 박힌 URL이 UI·로그에 노출되면 안 됨.
- 외부 명령은 `execFileSync`(동기) 사용 — 메인 이벤트루프를 막으므로 timeout 필수, 호출 수 최소화. GUI 실행 시 PATH가 빈약하므로 설치 감지는 로그인 셸(`SHELL -lc 'command -v X'`)로.
- 설정/북마크/히스토리/즐겨찾기/숨김목록은 프로젝트가 아니라 `app.getPath('userData')`(`~/Library/Application Support/jumpstart/`)에 저장됨: `settings.json`, `bookmarks.json`, `launch-history.json`, `quick-favorites.json`, `hidden-projects.json`. **package.json의 `name`을 바꾸면 이 경로가 바뀌어 기존 데이터가 분리되니 주의.** (단, 섹션 접기 상태는 렌더러 localStorage)

## 코드 스타일
- 의존성 최소(런타임 의존성 0, electron/electron-builder는 devDependencies). 새 패키지 추가는 신중히.
- 주석·UI 문자열은 한국어. 들여쓰기 2칸. 저장 시 Prettier 포맷이 적용됨(더블쿼트·세미콜론).

## 보안 / 푸시
- 비밀키·토큰을 코드에 넣지 말 것. `.gitignore`에 `node_modules/ dist/ *.log .DS_Store .claude/settings.local.json` 포함.
