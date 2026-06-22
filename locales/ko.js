// 한국어 리소스. (영어는 en.js) — 키를 추가하면 두 파일 모두에 넣을 것.
window.I18N = window.I18N || {};
window.I18N.ko = {
  "app.sub": "반복 업무를 클릭 한 번으로 — 터미널 런처 + Claude Code 대시보드",

  "btn.refresh": "새로고침",
  "btn.save": "저장",
  "btn.add": "추가",
  "btn.run": "실행",
  "btn.delete": "삭제",
  "btn.shell": "셸",
  "btn.finder": "Finder",
  "btn.claudeC": "claude -c",
  "title.settings": "설정",

  "set.lang": "언어",
  "set.theme": "화면 테마",
  "set.terminal": "터미널 앱",
  "set.openIn": "열기 방식",
  "openIn.window": "새 창",
  "openIn.tab": "새 탭 (Terminal·iTerm2)",
  "set.openInHint":
    "새 탭은 Terminal·iTerm2에서만 동작합니다. (Terminal은 첫 사용 시 “손쉬운 사용” 권한 필요 · Tabby/커스텀은 무시)",
  "set.tabbyPath": "Tabby 경로",
  "set.customCmd": "커스텀 명령",
  "set.customHint": `새 터미널을 여는 명령을 입력하세요. 치환자: <code>{{script}}</code> (cd+명령이 담긴 실행 스크립트 경로), <code>{{dir}}</code>, <code>{{cmd}}</code>, <code>{{shell}}</code>.<br />예시 — kitty: <code>kitty {{script}}</code> · WezTerm: <code>wezterm start -- {{script}}</code> · Alacritty: <code>alacritty -e {{script}}</code>`,

  "ph.tabby": "/Applications/Tabby.app/Contents/MacOS/Tabby",
  "ph.custom": "예: kitty {{script}}",
  "ph.bmName": "이름",
  "ph.bmDir": "경로 (예: ~/Documents/proj)",
  "ph.bmCmd": "명령어 (비우면 셸만)",

  "sec.quick": "빠른 실행",
  "quick.empty": "아래 목록에서 ⭐ 버튼으로 자주 쓰는 항목을 추가하세요.",
  "quick.count": "{n}/{max}",
  "quick.full":
    "빠른 실행은 최대 {max}개까지예요. 기존 항목을 ✕로 지운 뒤 추가하세요.",
  "quick.remove": "빠른 실행에서 제거",
  "fav.add": "빠른 실행에 추가",
  "sec.workflow": "내 워크플로우",
  "sec.projects": "Claude Code 디렉토리",
  "sec.frequent": "자주 여는 곳",
  "sec.history": "최근 실행",

  "empty.workflow": "아래에서 워크플로우를 추가하세요.",
  "empty.projects": "아직 Claude Code 기록이 없습니다.",
  "empty.history": "아직 실행 기록이 없습니다.",

  "count.places": "{n}곳",
  "count.items": "{n}개",
  "proj.meta": "세션 {n}개 · 마지막 {ago}",
  "pill.approx": "추정경로",
  "pill.missing": "없음",
  "hide.title": "목록에서 숨기기",
  "hidden.restore": "숨긴 항목 {n}개 · ",
  "hidden.showAll": "모두 표시",
  "freq.access": "{n}회 접근",
  "time.lastSuffix": " · 마지막 {ago}",

  "err.projectsUnreadable": "{path} 를 읽을 수 없습니다.",
  "alert.launchFail": "터미널 실행 실패:",
  "alert.runFail": "실행 실패:",

  "git.localOnly": "로컬 전용",
  "git.lastCommit": "마지막 커밋 {ago}",
  "git.unpushed": "미푸시 {n}커밋",
  "git.pushed": "푸시 완료",
  "git.behind": "원격이 {n} 앞섬",
  "git.noUpstream": "업스트림 미설정",

  "term.notInstalled": "(미설치)",
  "term.custom": "사용자 지정 (직접 명령)",

  "time.noRecord": "기록 없음",
  "time.justNow": "방금",
  "time.minAgo": "{n}분 전",
  "time.hourAgo": "{n}시간 전",
  "time.dayAgo": "{n}일 전",

  "about.maker": "만든이",
  "about.note": "버그·장애·개선 요청은 GitHub Issues로 남겨 주세요.",

  "theme.charcoal": "Charcoal · 다크 기본",
  "theme.ocean": "Ocean · 딥블루",
  "theme.forest": "Forest · 딥그린",
  "theme.plum": "Plum · 딥퍼플",
  "theme.nord": "Nord · 슬레이트(밝은 다크)",
  "theme.sand": "Sand · 웜 라이트",
  "theme.light": "Light · 화이트",

  "term.terminal-app": "Terminal (macOS 기본)",
  "term.iterm": "iTerm2",
  "term.tabby": "Tabby",
};
