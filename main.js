const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  nativeImage,
  Menu,
  Tray,
} = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn, execFileSync } = require("child_process");

// ── 설정 ────────────────────────────────────────────────
const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");
const SHELL_PATH = process.env.SHELL || "/bin/zsh";
// ────────────────────────────────────────────────────────

function userFile(name) {
  return path.join(app.getPath("userData"), name);
}
function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
function shellQuote(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}
// AppleScript 문자열 리터럴용 이스케이프 (백슬래시 먼저, 그다음 따옴표)
function asQuote(s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

// ── 앱 설정(터미널 선택 등) ─────────────────────────────
function defaultSettings() {
  return {
    terminal: "terminal-app", // terminal-app | iterm | tabby | custom
    tabbyPath: "/Applications/Tabby.app/Contents/MacOS/Tabby",
    // 커스텀 터미널 명령 템플릿. 치환자: {{script}} {{dir}} {{cmd}} {{shell}}
    customCommand: "",
    theme: "charcoal",
    lang: "ko", // ko | en
    openIn: "window", // window | tab (탭은 Terminal·iTerm2만 지원)
  };
}
// 앱 메타정보(만든이/저작권/마지막 패치일/리비전)는 meta.json 한 곳에서 관리.
// 버전은 빌드 기준인 package.json이 정본이므로 app.getVersion()에서 읽는다.
function getAppInfo() {
  const meta = readJSON(path.join(__dirname, "meta.json"), {});
  return { version: app.getVersion(), ...meta };
}
// 커스텀 About 창(help/about.html). 네이티브 패널 대신 사용해 글꼴/라이선스까지 표시.
let aboutWin = null;
function openAbout() {
  const m = getAppInfo();
  if (aboutWin && !aboutWin.isDestroyed()) {
    aboutWin.focus();
    return;
  }
  aboutWin = new BrowserWindow({
    width: 360,
    height: 460,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: "About Jumpstart",
    icon: ICON_PATH,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  aboutWin.setMenuBarVisibility(false);
  aboutWin.loadFile(path.join(__dirname, "help", "about.html"), {
    query: {
      v: m.version || "",
      holder: m.copyright || "jj",
      gh: m.github || "",
    },
  });
  aboutWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  aboutWin.on("closed", () => (aboutWin = null));
}
// 도움말 창(help/<lang>.html). section 으로 #usage / #faq 앵커 이동.
let helpWin = null;
function openHelp(section) {
  const ko = getSettings().lang !== "en";
  const file = path.join(__dirname, "help", ko ? "ko.html" : "en.html");
  if (helpWin && !helpWin.isDestroyed()) {
    helpWin.focus();
    if (section)
      helpWin.webContents
        .executeJavaScript(`location.hash=${JSON.stringify("#" + section)}`)
        .catch(() => {});
    return;
  }
  helpWin = new BrowserWindow({
    width: 720,
    height: 820,
    title: ko ? "Jumpstart — 도움말" : "Jumpstart — Help",
    icon: ICON_PATH,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  helpWin.loadFile(file, section ? { hash: section } : {});
  // 도움말 안의 외부 링크는 기본 브라우저로
  helpWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  helpWin.on("closed", () => (helpWin = null));
}
// 상단 애플리케이션 메뉴 구성(기본 메뉴 + Help 채우기). 언어에 맞춰 라벨 갱신.
function buildAppMenu() {
  const m = getAppInfo();
  const repo = m.github || "https://github.com/tnfhrnsss/jumpstart";
  const releases = repo.replace(/\/$/, "") + "/releases/latest";
  const ko = getSettings().lang !== "en";
  const L = ko
    ? {
        usage: "사용 방법",
        faq: "자주 묻는 질문(FAQ)",
        repo: "GitHub 저장소",
        rel: "다운로드(릴리스)",
      }
    : {
        usage: "How to Use",
        faq: "FAQ",
        repo: "GitHub Repository",
        rel: "Download (Releases)",
      };
  // 앱 메뉴: 기본 appMenu 대신, About 항목이 커스텀 창을 열도록 직접 구성
  const appMenu = {
    label: app.name,
    submenu: [
      {
        label: ko ? "Jumpstart 정보" : "About Jumpstart",
        click: () => openAbout(),
      },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  };
  const template = [
    ...(process.platform === "darwin" ? [appMenu] : []),
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        { label: L.usage, click: () => openHelp("usage") },
        { label: L.faq, click: () => openHelp("faq") },
        { type: "separator" },
        { label: L.repo, click: () => shell.openExternal(repo) },
        { label: L.rel, click: () => shell.openExternal(releases) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
function getSettings() {
  return { ...defaultSettings(), ...readJSON(userFile("settings.json"), {}) };
}
const KNOWN_TERMINALS = [
  {
    id: "terminal-app",
    name: "Terminal (macOS 기본)",
    appPath: "/System/Applications/Utilities/Terminal.app",
    always: true,
  },
  { id: "iterm", name: "iTerm2", appPath: "/Applications/iTerm.app" },
  { id: "tabby", name: "Tabby", appPath: "/Applications/Tabby.app" },
];
function detectTerminals() {
  return KNOWN_TERMINALS.map((t) => ({
    id: t.id,
    name: t.name,
    available: !!t.always || fs.existsSync(t.appPath),
  }));
}

// ── 빠른 실행 (즐겨찾기) ────────────────────────────────
// 사용자가 다른 섹션(워크플로우·Claude 디렉토리·자주 여는 곳)에서 ⭐로 추가한
// 항목 목록. {id, name, dir, cmd} 형태로 quick-favorites.json 에 저장.
function getQuickFavorites() {
  return readJSON(userFile("quick-favorites.json"), []);
}
function setQuickFavorites(list) {
  writeJSON(userFile("quick-favorites.json"), Array.isArray(list) ? list : []);
}

// ── Claude Code 디렉토리 탐색 ───────────────────────────
function extractCwd(jsonlPath) {
  try {
    const lines = fs.readFileSync(jsonlPath, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj.cwd === "string") return obj.cwd;
      } catch {}
    }
  } catch {}
  return null;
}
function decodeDirName(name) {
  return name.replace(/^-/, "/").replace(/-/g, "/");
}
// 사용자가 목록에서 숨긴 프로젝트 키(=PROJECTS_DIR 내 폴더명) 목록
function getHiddenProjects() {
  return readJSON(userFile("hidden-projects.json"), []);
}
function setHiddenProjects(list) {
  writeJSON(userFile("hidden-projects.json"), list);
}
function scanClaudeProjects() {
  let dirs;
  try {
    dirs = fs
      .readdirSync(PROJECTS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory());
  } catch {
    return {
      error: "err.projectsUnreadable",
      errorPath: PROJECTS_DIR,
      projects: [],
      hiddenCount: 0,
    };
  }
  const hidden = getHiddenProjects();
  const projects = [];
  for (const d of dirs) {
    const dirPath = path.join(PROJECTS_DIR, d.name);
    let files = [];
    try {
      files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".jsonl"));
    } catch {}
    if (files.length === 0) continue;
    let newest = null,
      newestM = 0;
    for (const f of files) {
      try {
        const m = fs.statSync(path.join(dirPath, f)).mtimeMs;
        if (m > newestM) {
          newestM = m;
          newest = path.join(dirPath, f);
        }
      } catch {}
    }
    let realPath = newest ? extractCwd(newest) : null;
    let approx = false;
    if (!realPath) {
      realPath = decodeDirName(d.name);
      approx = true;
    }
    projects.push({
      key: d.name, // 폴더명은 경로가 바뀌어도 안 변하는 안정적 식별자(숨김 기준)
      realPath,
      approx,
      exists: fs.existsSync(realPath),
      sessions: files.length,
      lastUsed: newestM,
    });
  }
  const visible = projects.filter((p) => !hidden.includes(p.key));
  visible.sort((a, b) => b.lastUsed - a.lastUsed);
  return {
    error: null,
    projects: visible,
    hiddenCount: projects.length - visible.length,
  };
}

// "cd <target>" 한 건을 현재 디렉토리(cwd) 기준으로 절대경로로 해석
function resolveCd(cwd, rest) {
  let target = rest.trim();
  // 양끝 따옴표 제거
  if (
    target.length >= 2 &&
    ((target[0] === '"' && target.endsWith('"')) ||
      (target[0] === "'" && target.endsWith("'")))
  ) {
    target = target.slice(1, -1);
  }
  if (!target || target === "~" || target === "$HOME") return os.homedir();
  let p = expandTilde(target);
  if (!path.isAbsolute(p)) p = path.join(cwd, p);
  return path.normalize(p);
}
// ~/.zsh_history 를 순서대로 따라가며 cd 대상 폴더의 접근 빈도를 집계.
// 상대경로/`cd -`도 cwd를 재구성해 처리하고, 실제로 존재하는 폴더만 센다
// (세션이 섞여 잘못 합성된 경로는 디스크에 없어 자연히 걸러진다).
function parseShellHistoryDirs(map) {
  const home = os.homedir();
  let raw;
  try {
    raw = fs.readFileSync(path.join(home, ".zsh_history"), "utf8");
  } catch {
    return;
  }
  let cwd = home,
    prev = home;
  for (let line of raw.split("\n")) {
    if (!line) continue;
    let ts = 0;
    // 확장 히스토리 형식: ": <epoch>:<elapsed>;<command>"
    const m = line.match(/^: (\d+):\d+;(.*)$/);
    if (m) {
      ts = parseInt(m[1], 10) * 1000;
      line = m[2];
    }
    for (let seg of line.split(/[;&|\n]+/)) {
      seg = seg.trim();
      // 정확히 "cd" 이거나 "cd " 로 시작하는 세그먼트만 (cdk 등 제외)
      if (seg.slice(0, 2) !== "cd" || (seg[2] && !/\s/.test(seg[2]))) continue;
      const rest = seg.slice(2).trim();
      let target;
      if (rest === "-") {
        const t = cwd;
        cwd = prev;
        prev = t;
        target = cwd;
      } else {
        const r = resolveCd(cwd, rest);
        if (!r) continue;
        prev = cwd;
        cwd = r;
        target = r;
      }
      if (!target || target === home) continue; // 홈 이동은 빈도에서 제외
      try {
        if (!fs.statSync(target).isDirectory()) continue;
      } catch {
        continue;
      }
      const e = map.get(target) || { dir: target, count: 0, lastUsed: 0 };
      e.count++;
      if (ts > e.lastUsed) e.lastUsed = ts;
      map.set(target, e);
    }
  }
}
// "자주 여는 곳": 실제 터미널 cd 기록 + Jumpstart 자체 실행 기록을 합산
function frequentDirs() {
  const map = new Map();
  parseShellHistoryDirs(map);
  const hist = readJSON(userFile("launch-history.json"), []);
  for (const h of hist) {
    if (!h || !h.dir) continue;
    const dir = expandTilde(h.dir);
    const e = map.get(dir) || { dir, count: 0, lastUsed: 0 };
    e.count++;
    if (h.ts > e.lastUsed) e.lastUsed = h.ts;
    map.set(dir, e);
  }
  const home = os.homedir();
  const arr = [...map.values()]
    .filter((e) => e.dir !== home)
    .map((e) => ({ ...e, exists: fs.existsSync(e.dir) }));
  arr.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
  return arr.slice(0, 8);
}

// ── git 정보 ────────────────────────────────────────────
function runGit(dir, args) {
  return execFileSync("git", ["-C", dir, ...args], {
    encoding: "utf8",
    timeout: 4000,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}
// https://user:pass@host/... 또는 https://token@host/... → 자격증명 제거 (토큰 노출 방지)
function stripCreds(url) {
  return String(url).replace(/^(https?:\/\/)(?:[^@/]+@)/, "$1");
}
function toWebUrl(remote) {
  if (!remote) return null;
  const u = remote.trim();
  let m = u.match(/^git@([^:]+):(.+?)(?:\.git)?$/); // git@host:owner/repo.git
  if (m) return `https://${m[1]}/${m[2]}`;
  m = u.match(/^ssh:\/\/(?:[^@]+@)?([^/]+)\/(.+?)(?:\.git)?$/); // ssh://git@host/owner/repo
  if (m) return `https://${m[1]}/${m[2]}`;
  m = u.match(/^https?:\/\/(?:[^@/]+@)?(.+?)(?:\.git)?$/); // https://host/owner/repo.git
  if (m) return `https://${m[1]}`;
  return null;
}
function gitInfo(dirRaw) {
  const dir = expandTilde(dirRaw);
  try {
    if (runGit(dir, ["rev-parse", "--is-inside-work-tree"]) !== "true")
      return { isRepo: false };
  } catch {
    return { isRepo: false };
  }
  const info = {
    isRepo: true,
    branch: null,
    remoteUrl: null,
    webUrl: null,
    lastCommitTs: null,
    ahead: null,
    behind: null,
    hasUpstream: false,
  };
  try {
    info.branch = runGit(dir, ["rev-parse", "--abbrev-ref", "HEAD"]);
  } catch {}
  let url = null;
  try {
    url = runGit(dir, ["remote", "get-url", "origin"]);
  } catch {
    try {
      const first = runGit(dir, ["remote"]).split("\n").filter(Boolean)[0];
      if (first) url = runGit(dir, ["remote", "get-url", first]);
    } catch {}
  }
  if (url) {
    info.remoteUrl = stripCreds(url);
    info.webUrl = toWebUrl(url);
  }
  try {
    info.lastCommitTs =
      parseInt(runGit(dir, ["log", "-1", "--format=%ct"]), 10) * 1000;
  } catch {}
  try {
    const counts = runGit(dir, [
      "rev-list",
      "--left-right",
      "--count",
      "@{upstream}...HEAD",
    ]);
    const [behind, ahead] = counts.split(/\s+/).map((n) => parseInt(n, 10));
    info.behind = behind;
    info.ahead = ahead;
    info.hasUpstream = true;
  } catch {
    info.hasUpstream = false;
  }
  return info;
}

// ── 실행 (선택한 터미널) ─────────────────────────────────
function expandTilde(p) {
  if (p === "~") return os.homedir();
  if (p && p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}
function buildInner(dir, cmd) {
  return cmd ? `cd ${shellQuote(dir)} && ${cmd}` : `cd ${shellQuote(dir)}`;
}
// 커스텀 터미널용: cd + 명령 + 대화형 셸 유지를 담은 실행 스크립트 생성
function writeRunScript(dir, cmd) {
  pruneRunScripts();
  const lines = [`#!${SHELL_PATH}`, `cd ${shellQuote(dir)} || exit 1`];
  if (cmd) lines.push(cmd);
  lines.push(`exec ${shellQuote(SHELL_PATH)}`);
  const file = userFile(`run-${Date.now()}.command`);
  fs.writeFileSync(file, lines.join("\n") + "\n", { mode: 0o755 });
  return file;
}
function pruneRunScripts() {
  try {
    const dir = app.getPath("userData");
    const cutoff = Date.now() - 60 * 60 * 1000; // 1시간 지난 임시 스크립트 정리
    for (const f of fs.readdirSync(dir)) {
      if (/^run-\d+\.command$/.test(f)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full);
      }
    }
  } catch {}
}

function launchTerminalApp(inner, openIn) {
  let script;
  if (openIn === "tab") {
    // 창이 이미 있으면 Cmd+T로 새 탭을 열고 거기서 실행. (System Events =손쉬운 사용 권한 필요)
    // 창이 없으면 do script가 새 창을 만든다.
    script = [
      'tell application "Terminal"',
      "  activate",
      "  if (count of windows) is 0 then",
      `    do script ${asQuote(inner)}`,
      "  else",
      '    tell application "System Events" to keystroke "t" using command down',
      "    delay 0.2",
      `    do script ${asQuote(inner)} in front window`,
      "  end if",
      "end tell",
    ].join("\n");
  } else {
    script = [
      'tell application "Terminal"',
      `  do script ${asQuote(inner)}`,
      "  activate",
      "end tell",
    ].join("\n");
  }
  spawnDetached("osascript", ["-e", script]);
}
function launchITerm(inner, openIn) {
  let script;
  if (openIn === "tab") {
    script = [
      'tell application "iTerm"',
      "  activate",
      "  if (count of windows) = 0 then",
      "    set w to (create window with default profile)",
      "    tell current session of w to write text " + asQuote(inner),
      "  else",
      "    tell current window",
      "      create tab with default profile",
      "      tell current session to write text " + asQuote(inner),
      "    end tell",
      "  end if",
      "end tell",
    ].join("\n");
  } else {
    script = [
      'tell application "iTerm"',
      "  activate",
      "  set w to (create window with default profile)",
      "  tell current session of w",
      `    write text ${asQuote(inner)}`,
      "  end tell",
      "end tell",
    ].join("\n");
  }
  spawnDetached("osascript", ["-e", script]);
}
function launchTabby(settings, dir, cmd) {
  const bin = settings.tabbyPath || defaultSettings().tabbyPath;
  const inner = buildInner(dir, cmd) + `; exec ${shellQuote(SHELL_PATH)}`;
  spawnDetached(bin, ["run", SHELL_PATH, "-lc", inner]);
}
function launchCustom(settings, dir, cmd) {
  const tpl = (settings.customCommand || "").trim();
  if (!tpl)
    throw new Error("커스텀 터미널 명령이 비어 있습니다. 설정에서 입력하세요.");
  const script = writeRunScript(dir, cmd);
  const inner = buildInner(dir, cmd);
  const expanded = tpl
    .replaceAll("{{script}}", shellQuote(script))
    .replaceAll("{{dir}}", shellQuote(dir))
    .replaceAll("{{cmd}}", shellQuote(inner))
    .replaceAll("{{shell}}", shellQuote(SHELL_PATH));
  spawnDetached(SHELL_PATH, ["-lc", expanded]);
}
function spawnDetached(cmd, args) {
  const child = spawn(cmd, args, { detached: true, stdio: "ignore" });
  child.unref();
}

function launch(dirRaw, cmd, label) {
  const dir = expandTilde(dirRaw);
  const s = getSettings();
  const inner = buildInner(dir, cmd);
  // openIn: "window"(기본) | "tab". 탭은 Terminal·iTerm2만 지원, Tabby/커스텀은 무시.
  const openIn = s.openIn === "tab" ? "tab" : "window";
  try {
    switch (s.terminal) {
      case "iterm":
        launchITerm(inner, openIn);
        break;
      case "tabby":
        launchTabby(s, dir, cmd);
        break;
      case "custom":
        launchCustom(s, dir, cmd);
        break;
      default:
        launchTerminalApp(inner, openIn);
    }
  } catch (e) {
    console.error("터미널 실행 실패:", e);
    return { ok: false, error: String(e.message || e) };
  }
  recordHistory({
    ts: Date.now(),
    label: label || cmd || "셸",
    dir,
    cmd: cmd || "",
  });
  return { ok: true };
}
function recordHistory(entry) {
  const f = userFile("launch-history.json");
  const hist = readJSON(f, []);
  hist.unshift(entry);
  writeJSON(f, hist.slice(0, 100));
}

// ── 스크린샷용 데모 모드 (JUMPSTART_DEMO=1) ─────────────
// 실제 ~/.claude 데이터 대신 가공의 샘플을 반환 → 개인정보 없이 스크린샷.
const DEMO = process.env.JUMPSTART_DEMO === "1";
const DEMO_NOW = Date.now();
const dmin = (m) => DEMO_NOW - m * 60000;
function demoScan() {
  const mk = (p, sessions, agoMin) => ({
    key: p,
    realPath: p,
    approx: false,
    exists: true,
    sessions,
    lastUsed: dmin(agoMin),
  });
  return {
    error: null,
    hiddenCount: 2,
    projects: [
      mk("~/work/acme-web", 14, 6),
      mk("~/work/payments-api", 8, 52),
      mk("~/work/design-system", 5, 210),
      mk("~/dev/side/recipe-app", 3, 1440),
    ],
  };
}
function demoGit(dir) {
  const map = {
    "~/work/acme-web": {
      branch: "feature/checkout",
      webUrl: "https://github.com/acme/web",
      ahead: 2,
      behind: 0,
    },
    "~/work/payments-api": {
      branch: "main",
      webUrl: "https://github.com/acme/payments-api",
      ahead: 0,
      behind: 0,
    },
    "~/work/design-system": {
      branch: "main",
      webUrl: "https://github.com/acme/design-system",
      ahead: 0,
      behind: 3,
    },
    "~/dev/side/recipe-app": {
      branch: "main",
      webUrl: null,
      ahead: 0,
      behind: 0,
    },
  };
  const g = map[dir];
  if (!g) return { isRepo: false };
  return {
    isRepo: true,
    branch: g.branch,
    remoteUrl: g.webUrl,
    webUrl: g.webUrl,
    lastCommitTs: dmin(g.ahead > 0 ? 30 : 90),
    ahead: g.ahead,
    behind: g.behind,
    hasUpstream: !!g.webUrl,
  };
}
function demoFrequent() {
  const mk = (dir, count, agoMin) => ({
    dir,
    count,
    lastUsed: dmin(agoMin),
    exists: true,
  });
  return [
    mk("~/work/acme-web", 37, 6),
    mk("~/work/payments-api", 21, 52),
    mk("~/work/design-system", 9, 210),
    mk("/opt/homebrew/etc/nginx", 4, 600),
  ];
}
const DEMO_BOOKMARKS = [
  { id: 1, name: "웹 개발 서버", dir: "~/work/acme-web", cmd: "npm run dev" },
  { id: 2, name: "결제 API 빌드", dir: "~/work/payments-api", cmd: "make run" },
];
const DEMO_FAVORITES = [
  { id: 1, name: "웹 개발 서버", dir: "~/work/acme-web", cmd: "npm run dev" },
  { id: 2, name: "acme-web", dir: "~/work/acme-web", cmd: "" },
  { id: 3, name: "payments-api", dir: "~/work/payments-api", cmd: "" },
];
const DEMO_HISTORY = [
  {
    ts: dmin(4),
    label: "웹 개발 서버",
    dir: "~/work/acme-web",
    cmd: "npm run dev",
  },
  {
    ts: dmin(18),
    label: "claude (~/work/payments-api)",
    dir: "~/work/payments-api",
    cmd: "claude -c",
  },
  { ts: dmin(95), label: "shell", dir: "~/work/design-system", cmd: "" },
];

// ── IPC ─────────────────────────────────────────────────
ipcMain.handle("scan-projects", () =>
  DEMO ? demoScan() : scanClaudeProjects(),
);
ipcMain.handle("hide-project", (_e, key) => {
  const h = getHiddenProjects();
  if (key && !h.includes(key)) {
    h.push(key);
    setHiddenProjects(h);
  }
  return true;
});
ipcMain.handle("unhide-all-projects", () => {
  setHiddenProjects([]);
  return true;
});
ipcMain.handle("frequent-dirs", () => (DEMO ? demoFrequent() : frequentDirs()));
ipcMain.handle("git-info", (_e, dir) => (DEMO ? demoGit(dir) : gitInfo(dir)));
ipcMain.handle("get-bookmarks", () =>
  DEMO
    ? DEMO_BOOKMARKS
    : readJSON(userFile("bookmarks.json"), defaultBookmarks()),
);
ipcMain.handle("save-bookmarks", (_e, list) => {
  writeJSON(userFile("bookmarks.json"), list);
  return true;
});
ipcMain.handle("get-quick-favorites", () =>
  DEMO ? DEMO_FAVORITES : getQuickFavorites(),
);
ipcMain.handle("save-quick-favorites", (_e, list) => {
  setQuickFavorites(list);
  return true;
});
ipcMain.handle("get-launch-history", () =>
  DEMO ? DEMO_HISTORY : readJSON(userFile("launch-history.json"), []),
);
ipcMain.handle("launch", (_e, { dir, cmd, label }) => launch(dir, cmd, label));
ipcMain.handle("open-claude", (_e, { dir, mode }) => {
  // pick: 세션 목록에서 골라 재개 / resume: 최근 세션 이어가기(-c) / 그 외: 새 세션
  const cmd =
    mode === "pick"
      ? "claude --resume"
      : mode === "resume"
        ? "claude -c"
        : "claude";
  return launch(dir, cmd, `claude (${dir})`);
});
ipcMain.handle("reveal", (_e, p) => {
  shell.openPath(expandTilde(p));
  return true;
});
ipcMain.handle("open-external", (_e, url) => {
  if (url) shell.openExternal(url);
  return true;
});
ipcMain.handle("get-settings", () => getSettings());
ipcMain.handle("save-settings", (_e, s) => {
  writeJSON(userFile("settings.json"), { ...defaultSettings(), ...s });
  buildAppMenu(); // 언어가 바뀌면 메뉴 라벨도 갱신
  return true;
});
ipcMain.handle("detect-terminals", () => detectTerminals());
ipcMain.handle("app-version", () => app.getVersion());
ipcMain.handle("app-info", () => getAppInfo());

function defaultBookmarks() {
  // 도구별(도커/MySQL 등) 빠른 실행은 설정의 "프리셋"으로 분리.
  // 여기엔 경로가 들어가는 프로젝트성 작업 예시만 둔다.
  return [
    {
      id: 1,
      name: "서비스 올리기",
      dir: "~/Documents/myproject",
      cmd: "npm run start",
    },
  ];
}

// ── 윈도우 ──────────────────────────────────────────────
const ICON_PATH = path.join(__dirname, "assets", "icon.png");

let mainWindow = null;
let tray = null;

// 메인 창 표시(없으면 생성)
function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

// 메뉴바(트레이) 메뉴: Claude Code 디렉토리를 골라 바로 세션 시작
function buildTrayMenu() {
  const ko = getSettings().lang !== "en";
  const items = [];
  let projects = [];
  try {
    projects = scanClaudeProjects().projects.slice(0, 8);
  } catch {}
  items.push({
    label: ko ? "Claude Code 세션 시작" : "Start Claude Code session",
    enabled: false,
  });
  if (projects.length === 0) {
    items.push({ label: ko ? "  기록 없음" : "  no history", enabled: false });
  } else {
    for (const p of projects) {
      items.push({
        label: path.basename(p.realPath) || p.realPath,
        sublabel: p.realPath,
        click: () => launch(p.realPath, "claude -c", `claude (${p.realPath})`),
      });
    }
  }
  const favs = getQuickFavorites();
  if (favs.length) {
    items.push({ type: "separator" });
    items.push({ label: ko ? "빠른 실행" : "Quick Run", enabled: false });
    for (const f of favs) {
      items.push({
        label: f.name,
        click: () => launch(f.dir, f.cmd, f.name),
      });
    }
  }
  items.push({ type: "separator" });
  items.push({
    label: ko ? "Jumpstart 창 열기" : "Open Jumpstart",
    click: showMainWindow,
  });
  items.push({ role: "quit", label: ko ? "종료" : "Quit" });
  return Menu.buildFromTemplate(items);
}

function createTray() {
  if (tray) return;
  const img = nativeImage
    .createFromPath(ICON_PATH)
    .resize({ width: 18, height: 18, quality: "best" });
  tray = new Tray(img);
  tray.setToolTip("Jumpstart");
  // 클릭할 때마다 최신 디렉토리로 메뉴를 다시 구성해 띄움
  const popup = () => tray.popUpContextMenu(buildTrayMenu());
  tray.on("click", popup);
  tray.on("right-click", popup);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 760,
    title: "Jumpstart",
    icon: ICON_PATH,
    show: !process.env.JUMPSTART_SHOT, // 캡처 모드에선 ready-to-show까지 숨김
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false, // 백그라운드여도 렌더 유지(캡처 빈 프레임 방지)
    },
  });
  mainWindow = win;
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
  win.loadFile("index.html");
  win.webContents.on(
    "console-message",
    (_e, level, message, line, sourceId) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    },
  );
  // 자동 캡처: JUMPSTART_SHOT=<png경로> 설정 시 렌더 후 캡처하고 종료
  const shot = process.env.JUMPSTART_SHOT;
  if (shot) {
    win.once("ready-to-show", () => {
      win.show();
      win.focus();
    });
    win.webContents.once("did-finish-load", async () => {
      try {
        win.show();
        win.focusOnWebView();
        // 렌더러의 refreshAll 완료(data-ready) 신호를 최대 20초 대기
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline) {
          const ready = await win.webContents
            .executeJavaScript("document.documentElement.dataset.ready === '1'")
            .catch(() => false);
          if (ready) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        await new Promise((r) => setTimeout(r, 900)); // git 배지 등 마무리
        await win.webContents.capturePage(); // 1차: 페인트 유도
        await new Promise((r) => setTimeout(r, 350));
        const img = await win.webContents.capturePage(); // 2차: 실제 저장
        fs.writeFileSync(shot, img.toPNG());
        console.log("screenshot saved:", shot);
      } catch (e) {
        console.error("screenshot 실패:", e);
      }
      app.quit();
    });
  }
}

app.whenReady().then(() => {
  buildAppMenu(); // 상단 메뉴(About·Help 포함) 구성
  // 개발 실행(electron .)에서도 Dock 아이콘을 우리 아이콘으로 교체
  if (process.platform === "darwin" && app.dock) {
    try {
      app.dock.setIcon(nativeImage.createFromPath(ICON_PATH));
    } catch (e) {
      console.error("dock icon 설정 실패:", e);
    }
  }
  createWindow();
  if (!process.env.JUMPSTART_SHOT) createTray(); // 캡처 모드에선 트레이 생략
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
