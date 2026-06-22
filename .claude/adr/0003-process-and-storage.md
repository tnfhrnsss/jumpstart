# 0003 · 3-프로세스 분리 · 데이터는 userData에 저장

- 상태: 채택
- 맥락: Electron 데스크탑 앱

## 결정
Electron 표준대로 책임을 셋으로 나눈다.

- **`main.js` (메인 프로세스)** — 모든 Node/OS 작업(파일 읽기, git 실행, 터미널 기동,
  설정 저장)은 **여기서만** 한다.
- **`preload.js`** — `contextBridge`로 `window.api.*`만 노출. 렌더러↔메인의 **유일한 통로**
  (`contextIsolation: true`, `nodeIntegration: false`).
- **`renderer.js` + `index.html`** — UI만. Node 권한 없음.

설정·북마크·히스토리는 프로젝트 폴더가 아니라
**`app.getPath('userData')`**(`~/Library/Application Support/jumpstart/`)에 JSON으로 저장한다
(`settings.json`, `bookmarks.json`, `launch-history.json`, `hidden-projects.json`).

## 왜
- `contextIsolation`으로 렌더러에 Node 권한을 주지 않아야 외부 콘텐츠/실수로 인한
  임의 코드 실행 위험을 줄인다.
- 데이터를 프로젝트가 아니라 userData에 두면, 코드 저장소를 다시 받거나 .app을 재설치해도
  사용자 데이터가 유지된다.

## 결과 / 함정
- **IPC를 하나 추가하면 3곳을 모두 손봐야 한다**: `main.js`의 `ipcMain.handle` +
  `preload.js`의 노출 + `renderer.js` 호출. preload 노출을 빠뜨리면
  `window.api.X is not a function`으로 터진다.
- `package.json`의 `name`을 바꾸면 userData 경로가 바뀌어 **기존 데이터가 분리**된다.
- 렌더러의 `refreshAll()`은 섹션별 `safe()` try/catch로 격리한다 — 한 기능이 실패해도
  나머지 UI는 떠야 한다.
