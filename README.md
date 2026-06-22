# ⚡ Jumpstart

자주 쓰는 작업(서비스 올리기·로그 보기·`claude` 실행 등)을 **클릭 한 번**으로 터미널에서
실행하는 macOS용 데스크탑 앱.

## 왜 만들었나

매번 터미널을 열고 → 프로젝트 폴더로 `cd` 하고 → 명령을 입력하는 반복이 번거로워서
만들었습니다. 자주 가는 폴더와 명령을 버튼으로 등록해 두면, 앱에서 한 번 클릭으로
**원하는 위치에 터미널이 열리고 명령까지 실행**됩니다. 덤으로 `~/.claude/projects/`를
스캔해 **Claude Code를 썼던 폴더들과 git 상태**를 한눈에 보여줍니다.

## 설치

### 1. Node.js (한 번만)

Node 18 이상이 필요합니다.

```bash
brew install node     # 또는 https://nodejs.org 에서 LTS 설치
node -v                # v18 이상이면 OK
```

### 2. 앱으로 설치 (추천)

빌드해서 `/Applications`에 두면 Launchpad·Spotlight·Finder에서 **클릭으로 실행**됩니다.

```bash
npm install      # 처음 한 번
npm run app      # 빌드 + /Applications/Jumpstart.app 설치
```

- 첫 실행 시 macOS가 **"Terminal 제어 권한"**을 물어봅니다 → **허용** (거부하면 터미널 실행이 막힙니다).
- 코드를 수정하면 `npm run app`을 다시 돌려 재설치하세요.
- 제거: `/Applications/Jumpstart.app`을 휴지통으로.

## 실행 / 서비스 띄우는 방법

```bash
npm start        # 개발 모드 (터미널이 떠 있는 동안만 동작)
npm run app      # .app 빌드 + /Applications 설치  ← 평소 사용은 이걸로
npm run dist     # dist/mac-*/Jumpstart.app 만 생성
npm run dmg      # 배포용 dmg 생성
```

> 개발 모드(`npm start`)와 설치된 .app은 **별개**입니다. 코드 수정을 설치본에 반영하려면
> 반드시 `npm run app`을 다시 실행하세요.

## 사용법

- **빠른 실행** — 자주 쓰는 도구(Docker·MySQL·Claude·Node 등)를 클릭 한 번으로 실행.
  설정에서 켠 것 중 **이 PC에 설치된 것만** 버튼으로 나타납니다.
- **내 워크플로우** — "이름 / 경로 / 명령어"를 등록하면 [실행] 버튼으로 새 터미널에서 자동 실행.
  명령어를 비우면 해당 경로에서 셸만 엽니다.
- **Claude Code 디렉토리** — Claude Code를 썼던 폴더별로 [셸] / [claude -c] / [Finder] 바로가기.
  각 폴더의 git 정보(리포·브랜치·마지막 커밋·푸시 여부)도 함께 표시합니다.
  폴더 이름이 바뀌거나 삭제돼 "없음"으로 뜨는 항목은 **✕** 버튼으로 목록에서 숨길 수 있고,
  하단의 "모두 표시"로 되살릴 수 있습니다.
- **자주 여는 곳** — 실제 터미널에서 자주 `cd` 한 폴더(셸 히스토리 기반)와 이 앱으로 연 기록을
  합쳐, 접근이 잦은 곳을 모아 보여줍니다. 바로 [셸] / [claude -c] / [Finder]로 열 수 있습니다.
- **최근 실행** — 이 앱으로 실행한 기록.

## 설정 (우상단 ⚙ 버튼)

- **화면 테마** — 7종(Charcoal·Ocean·Forest·Plum·Nord·Sand·Light). 고르면 즉시 미리보기.
- **터미널 앱** — 명령을 실행할 터미널 선택:
  - **Terminal (macOS 기본)** · **iTerm2** · **Tabby** (설치돼 있으면 선택 가능)
  - **사용자 지정** — kitty·WezTerm·Alacritty·Warp 등을 명령 템플릿으로.
    치환자: `{{script}}` `{{dir}}` `{{cmd}}` `{{shell}}`
    (예: kitty `kitty {{script}}` · WezTerm `wezterm start -- {{script}}`)
- **빠른 실행 도구** — 런처에 노출할 프리셋 체크. 미설치 도구는 회색 처리됩니다.

## 데이터 저장 위치

설정·북마크·히스토리는 프로젝트가 아니라 사용자 폴더에 저장됩니다
(`~/Library/Application Support/jumpstart/`): `settings.json`, `bookmarks.json`,
`launch-history.json`, `hidden-projects.json`.
다른 맥으로 옮기려면 이 파일들을 복사하세요(앱을 한 번 실행해 폴더가 생긴 뒤 덮어쓰기).

## macOS 권한

처음 실행 버튼을 누르면 macOS가 "Electron이 Terminal을 제어하려 합니다"라고 물어봅니다.
**허용**하세요. 실수로 거부했다면:
시스템 설정 → 개인정보 보호 및 보안 → **자동화** → Jumpstart(또는 Electron) → Terminal 체크.

> 이 앱은 **macOS 전용**입니다. 터미널 실행을 `osascript` + Terminal.app으로 하기 때문에
> Windows/Linux에서는 그대로 동작하지 않습니다.

## 더 알아보기 (개발자용)

- 코드 구조 · 작업 시 주의사항 → [`.claude/CLAUDE.md`](.claude/CLAUDE.md)
- 설계 결정의 근거(왜 이렇게?) → [`.claude/adr/`](.claude/adr/)

## 링크

- 저장소: https://github.com/tnfhrnsss/jumpstart
- 소개 페이지: `docs/index.html` (Settings → Pages → `main` 브랜치 `/docs` 지정 시
  https://tnfhrnsss.github.io/jumpstart/ 에서 공개)
