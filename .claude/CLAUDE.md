# CLAUDE.md

이 저장소에서 작업하는 Claude Code를 위한 안내. (Claude Code는 루트의 `CLAUDE.md`를 자동으로 읽습니다.)

## 프로젝트
**Jumpstart** — 반복 업무를 클릭 한 번으로 실행하는 macOS용 Electron 데스크탑 앱.
1. **빠른 실행**: 자주 쓰는 도구(Docker·MySQL·Claude·Node·Python) 프리셋을 버튼으로 실행
2. **내 워크플로우**: 사용자가 등록한 "이름/경로/명령" 북마크 실행
3. **Claude Code 디렉토리**: `~/.claude/projects/` 스캔 + 폴더별 git 정보(리포·브랜치·마지막 커밋·푸시 여부)
4. **최근 실행** 히스토리, **화면 테마**(7종), **터미널 선택**(Terminal/iTerm2/Tabby/커스텀)

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
- **개발 모드(`npm start`)와 설치된 .app은 별개.** 코드 수정 후 설치본에 반영하려면 반드시 `npm run app` 재실행.
- 코드 서명 없음(`build.mac.identity: null`, 개인용). 다른 맥으로 .app만 복사하면 Gatekeeper가 막을 수 있음 → `xattr -dr com.apple.quarantine`.

## 작업 시 주의사항 (실제로 겪은 함정들)
- **IPC를 추가하면 3곳 모두 손봐야 함**: `main.js`의 `ipcMain.handle(...)` + `preload.js`의 `window.api` 노출 + `renderer.js` 호출. preload 노출을 빠뜨리면 `window.api.X is not a function`으로 터짐.
- `renderer.js`의 `refreshAll()`은 섹션별 `safe()` try/catch로 격리되어 있음 — **한 기능이 실패해도 나머지 UI는 떠야 함**. 이 구조를 깨지 말 것 (한 await 실패가 전체를 막았던 회귀가 있었음).
- **터미널 기동은 항상 macOS 기본 Terminal.app(osascript) 기준**이 기본값. 셸 명령은 `shellQuote`, AppleScript 문자열은 `asQuote`로 이스케이프.
- **git remote URL을 표시할 때는 반드시 자격증명 제거** (`stripCreds`/`toWebUrl`). 토큰/비번이 박힌 URL이 UI·로그에 노출되면 안 됨.
- 외부 명령은 `execFileSync`(동기) 사용 — 메인 이벤트루프를 막으므로 timeout 필수, 호출 수 최소화. GUI 실행 시 PATH가 빈약하므로 설치 감지는 로그인 셸(`SHELL -lc 'command -v X'`)로.
- 설정/북마크/히스토리는 프로젝트가 아니라 `app.getPath('userData')`(`~/Library/Application Support/jumpstart/`)에 저장됨. **package.json의 `name`을 바꾸면 이 경로가 바뀌어 기존 데이터가 분리되니 주의.**

## 코드 스타일
- 의존성 최소(런타임 의존성 0, electron/electron-builder는 devDependencies). 새 패키지 추가는 신중히.
- 주석·UI 문자열은 한국어. 들여쓰기 2칸. 저장 시 Prettier 포맷이 적용됨(더블쿼트·세미콜론).

## 보안 / 푸시
- 비밀키·토큰을 코드에 넣지 말 것. `.gitignore`에 `node_modules/ dist/ *.log .DS_Store .claude/settings.local.json` 포함.
