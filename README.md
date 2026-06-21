# ⚡ Jumpstart

반복 업무(서비스 올리기·로그 보기·claude 실행 등)를 **클릭 한 번**으로 macOS 기본
터미널(Terminal.app)에서 실행하고, `~/.claude/projects/` 를 스캔해 Claude Code를
썼던 디렉토리를 한눈에 보여주는 개인용 Electron 데스크탑 앱.

## 실행 (개발 모드)
```bash
npm install
npm start
```
> 개발 모드는 터미널이 떠 있는 동안만 동작합니다. 평소엔 아래처럼 `.app`으로 설치해 쓰세요.

## 앱으로 설치하기 (.app — 더블클릭 실행)
한 번 빌드해 `/Applications`에 두면, 재부팅 후에도 Launchpad·Spotlight·Finder에서
**"Jumpstart"를 클릭해 기동**할 수 있습니다 (자동 시작 아님).
```bash
npm install      # 처음 한 번
npm run app      # 빌드 + /Applications/Jumpstart.app 설치 (코드 바꿀 때마다 다시 실행)
```
- 처음 실행하면 macOS가 **"Terminal 제어 권한"**을 물어봅니다 → **허용** (안 그러면 터미널 실행이 막힘).
- 코드/아이콘을 수정하면 `npm run app` 을 다시 돌려 재설치하세요.
- 제거: `/Applications/Jumpstart.app` 을 휴지통으로.
- 개별 빌드 명령: `npm run dist`( `dist/mac-*/Jumpstart.app` 만 생성 ) · `npm run dmg`( 배포용 dmg ).

> **다른 맥으로 .app 파일만 복사**해 옮기면 Gatekeeper가 "확인되지 않은 개발자"라며 막을 수
> 있습니다. 그 맥에서 한 번 우클릭 → **열기**를 누르거나
> `xattr -dr com.apple.quarantine /Applications/Jumpstart.app` 을 실행하면 됩니다.
> (이 맥에서 직접 빌드한 경우엔 경고 없이 열립니다.)

## 동작 방식
- **메인 프로세스(main.js)** 가 Node 권한으로 모든 작업을 처리:
  - `~/.claude/projects/` 의 각 폴더에서 최신 `.jsonl`을 읽어 실제 `cwd`,
    세션 수, 마지막 사용 시각을 추출 (파일 내용 기반이라 폴더명 디코딩보다 정확)
  - `osascript`로 macOS 기본 터미널에 새 창을 열어 `cd <경로> && <명령>` 실행
  - 실행할 때마다 자체 히스토리(`launch-history.json`)에 기록
- **렌더러**는 UI만 담당하고, `preload.js`를 통해서만 메인과 통신 (contextIsolation)

## 사용법
- **빠른 실행**: 자주 쓰는 도구(Docker·MySQL·Claude·Node 등)를 클릭 한 번으로 실행.
  설정에서 켠 것 중 **이 PC에 설치된 것만** 버튼으로 나타납니다.
- **내 워크플로우**: "이름 / 경로 / 명령어"를 등록하면 [실행] 버튼으로 새 터미널에서 자동 실행.
  명령어를 비우면 해당 경로에서 셸만 엽니다.
- **Claude Code 디렉토리**: 최근 작업 폴더별로 [셸] / [claude -c] / [Finder] 바로가기.
  각 폴더의 git 정보(리포 주소·브랜치·마지막 커밋·푸시 여부)도 함께 표시.
  리포 주소를 클릭하면 브라우저로 열립니다. (URL에 박힌 토큰/비밀번호는 자동 제거)

## ⚙ 설정 (우상단 톱니바퀴 버튼)
- **화면 테마**: 7종 — Charcoal(기본)·Ocean·Forest·Plum·Nord·Sand·Light. 고르면 즉시 미리보기, 저장 시 유지.
- **터미널 앱**: 명령을 실행할 터미널을 고릅니다.
  - **Terminal (macOS 기본)** — 기본값, `osascript`로 새 창 실행
  - **iTerm2** — 설치돼 있으면 선택 가능 (`osascript`)
  - **Tabby** — 설치돼 있으면 선택 가능. 경로가 다르면 직접 지정
  - **사용자 지정** — 그 외 터미널(kitty·WezTerm·Alacritty·Warp 등)을 명령 템플릿으로.
    치환자: `{{script}}`(cd+명령이 담긴 실행 스크립트 경로), `{{dir}}`, `{{cmd}}`, `{{shell}}`
    예) kitty: `kitty {{script}}` · WezTerm: `wezterm start -- {{script}}` ·
    Alacritty: `alacritty -e {{script}}`
- **빠른 실행 도구**: 어떤 프리셋을 런처에 노출할지 체크. 미설치 도구는 회색 처리됩니다.
- **정보**: 만든이 · 버전 · 장애/문의 연락처 (이메일 클릭 시 메일 작성).

## git "마지막 푸시" 표기에 대하여
git은 푸시 *시각*을 따로 저장하지 않습니다. 그래서:
- 업스트림 기준 **앞선(미푸시) 커밋이 0개**면 `푸시 완료`로 표시하고 "마지막 커밋 시각"을
  사실상 마지막 푸시 시점으로 봅니다.
- 미푸시 커밋이 있으면 `미푸시 N커밋`으로 표시합니다.
- 업스트림(추적 브랜치)이 없으면 `업스트림 미설정`으로 표시합니다.

## 설정/저장 위치
- 설정·북마크·히스토리는 Electron userData 폴더에 JSON으로 저장됨
  (`~/Library/Application Support/jumpstart/`): `settings.json`, `bookmarks.json`,
  `launch-history.json`
- 첫 실행 시 macOS가 "Terminal 제어 권한"을 물어보면 허용해야 터미널 실행이 동작합니다.
  (시스템 설정 → 개인정보 보호 및 보안 → 자동화)

## 다른 PC(맥)에 설치하기

> 이 앱은 macOS 전용입니다. 터미널 실행을 `osascript` + Terminal.app으로 하기 때문에
> Windows/Linux에서는 그대로 동작하지 않습니다 (이식하려면 `main.js`의 `launch()` 수정 필요).

### 1. Node.js 설치 (한 번만)
Node 18 이상이면 됩니다. 아래 중 하나:
```bash
# Homebrew가 있으면
brew install node

# 없으면 https://nodejs.org 에서 LTS 설치 파일 다운로드
```
설치 확인:
```bash
node -v   # v18 이상이면 OK
npm -v
```

### 2. 프로젝트 파일 옮기기
폴더째로 복사하거나 git/USB/클라우드로 옮깁니다.
**중요: `node_modules` 폴더는 옮기지 마세요.** OS·아키텍처(인텔/애플실리콘)에 묶인
바이너리라, 새 PC에서 `npm install`로 다시 받아야 합니다.

git을 쓴다면 `.gitignore`로 빌드/캐시 산출물이 커밋되지 않게 하세요 (이미 포함):
```
node_modules/
dist/
*.log
.DS_Store
.claude/settings.local.json
```

### 3. 의존성 설치 + 실행
옮긴 폴더 안에서:
```bash
npm install   # electron 등 새 PC에 맞게 자동 다운로드
npm start
```

### 4. 터미널 제어 권한 허용
처음 [실행] 버튼을 누르면 macOS가 "Electron이 Terminal을 제어하려 합니다" 라고 물어봅니다.
**허용**을 누르세요. 실수로 거부했다면:
시스템 설정 → 개인정보 보호 및 보안 → **자동화** → Electron(또는 Jumpstart) →
Terminal 체크.

### 5. (선택) 기존 워크플로우 가져오기
북마크/히스토리는 프로젝트가 아니라 사용자 폴더에 저장되므로 자동으로 따라오지 않습니다.
기존 PC에서 새 PC로 그대로 옮기려면 이 파일을 복사하세요:
```
~/Library/Application Support/jumpstart/bookmarks.json
~/Library/Application Support/jumpstart/launch-history.json   # 히스토리도 원하면
```
앱을 한 번 실행해 폴더가 생긴 뒤 덮어쓰면 됩니다.
(옮기지 않으면 기본 예시 북마크로 시작 → 직접 다시 등록)

> 참고: 등록한 워크플로우의 **경로/명령어는 PC마다 다를 수 있습니다.**
> (홈 경로, 프로젝트 위치, `claude` 설치 경로 등) 새 PC에 맞게 경로만 수정해 쓰세요.

## 소개 페이지 (GitHub Pages)
`docs/index.html` 가 소개·설치 안내용 랜딩 페이지입니다 (외부 의존성 없는 단독 HTML).
GitHub에 푸시한 뒤 **Settings → Pages → Source 를 `main` 브랜치 `/docs` 폴더**로 지정하면
**https://tnfhrnsss.github.io/jumpstart/** 에서 공개됩니다.
- 저장소: https://github.com/tnfhrnsss/jumpstart

## 다음 단계(원하면)
- 터미널을 앱 안에 임베드: `node-pty` + `xterm.js`
- 워크플로우 여러 개를 한 번에 순차/동시 실행
- 자주 쓰는 명령 템플릿(인자 입력형) 추가
