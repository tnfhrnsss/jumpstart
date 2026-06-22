# 0001 · 터미널 실행을 osascript + Terminal.app으로

- 상태: 채택
- 맥락: macOS 전용 개인 런처

## 결정
새 터미널 창을 여는 기본 방식은 **`osascript`로 macOS 기본 Terminal.app에 `do script`**
하는 것이다. iTerm2도 `osascript`, Tabby는 `run` 서브커맨드, 그 외 터미널
(kitty·WezTerm·Alacritty 등)은 **사용자 지정 명령 템플릿**으로 처리한다.

명령은 항상 `cd <경로> && <명령>` 형태로 조립하며, 셸 명령은 `shellQuote`,
AppleScript 문자열은 `asQuote`로 이스케이프한다.

## 왜
- 앱 안에 **터미널(pty)을 내장하지 않는다.** 사용자가 평소 쓰는 진짜 터미널 앱을
  그대로 띄우는 게 목적이라, pty 에뮬레이션은 과한 복잡도다.
- `osascript` + Terminal.app은 macOS에 기본 내장이라 의존성이 0이다(런타임 의존성 0 원칙).
- 대신 첫 실행 시 macOS **"Terminal 제어 권한(자동화)"** 동의가 필요하다. 이게 막히면
  터미널 실행이 통째로 실패하므로, README/앱 안내에서 권한 허용을 강조한다.

## 결과 / 한계
- Windows·Linux에서는 동작하지 않는다. 이식하려면 `main.js`의 `launch()`를 교체해야 한다.
- 커스텀 터미널은 `cd+명령`을 담은 임시 `.command` 스크립트를 만들어 넘긴다
  (`writeRunScript`). 이 임시 파일은 1시간 후 자동 정리(`pruneRunScripts`).
