const { app, BrowserWindow, ipcMain, shell, nativeImage } = require("electron");
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
  };
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

// ── 빠른 실행 프리셋(자주 쓰는 도구) ───────────────────
// bin: 설치 여부를 확인할 실행파일. dir/cmd: 클릭 시 실행할 작업.
const PRESETS = [
  {
    id: "docker-up",
    name: "Docker Compose 올리기",
    bin: "docker",
    dir: "~",
    cmd: "docker compose up -d",
  },
  {
    id: "docker-ps",
    name: "Docker 컨테이너 목록",
    bin: "docker",
    dir: "~",
    cmd: "docker ps",
  },
  {
    id: "mysql",
    name: "MySQL 접속",
    bin: "mysql",
    dir: "~",
    cmd: "mysql -u root -p",
  },
  { id: "claude", name: "Claude Code", bin: "claude", dir: "~", cmd: "claude" },
  { id: "node", name: "Node REPL", bin: "node", dir: "~", cmd: "node" },
  {
    id: "python",
    name: "Python REPL",
    bin: "python3",
    dir: "~",
    cmd: "python3",
  },
];
// GUI에서 켠 Electron은 PATH가 제한적이라, 로그인 셸로 설치 여부를 확인한다.
function hasBin(bin) {
  try {
    return !!execFileSync(SHELL_PATH, ["-lc", `command -v ${bin}`], {
      encoding: "utf8",
      timeout: 4000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return false;
  }
}
function detectPresets() {
  return PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    dir: p.dir,
    cmd: p.cmd,
    available: hasBin(p.bin),
  }));
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
    return { error: `${PROJECTS_DIR} 를 읽을 수 없습니다.`, projects: [] };
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

function launchTerminalApp(inner) {
  const script = [
    'tell application "Terminal"',
    `  do script ${asQuote(inner)}`,
    "  activate",
    "end tell",
  ].join("\n");
  spawnDetached("osascript", ["-e", script]);
}
function launchITerm(inner) {
  const script = [
    'tell application "iTerm"',
    "  activate",
    "  set w to (create window with default profile)",
    "  tell current session of w",
    `    write text ${asQuote(inner)}`,
    "  end tell",
    "end tell",
  ].join("\n");
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
  try {
    switch (s.terminal) {
      case "iterm":
        launchITerm(inner);
        break;
      case "tabby":
        launchTabby(s, dir, cmd);
        break;
      case "custom":
        launchCustom(s, dir, cmd);
        break;
      default:
        launchTerminalApp(inner);
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

// ── IPC ─────────────────────────────────────────────────
ipcMain.handle("scan-projects", () => scanClaudeProjects());
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
ipcMain.handle("frequent-dirs", () => frequentDirs());
ipcMain.handle("git-info", (_e, dir) => gitInfo(dir));
ipcMain.handle("get-bookmarks", () =>
  readJSON(userFile("bookmarks.json"), defaultBookmarks()),
);
ipcMain.handle("save-bookmarks", (_e, list) => {
  writeJSON(userFile("bookmarks.json"), list);
  return true;
});
ipcMain.handle("get-launch-history", () =>
  readJSON(userFile("launch-history.json"), []),
);
ipcMain.handle("launch", (_e, { dir, cmd, label }) => launch(dir, cmd, label));
ipcMain.handle("open-claude", (_e, { dir, mode }) => {
  const cmd = mode === "resume" ? "claude -c" : "claude";
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
  return true;
});
ipcMain.handle("detect-terminals", () => detectTerminals());
ipcMain.handle("detect-presets", () => detectPresets());
ipcMain.handle("app-version", () => app.getVersion());

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 760,
    title: "Jumpstart",
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile("index.html");
  win.webContents.on(
    "console-message",
    (_e, level, message, line, sourceId) => {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    },
  );
}

app.whenReady().then(() => {
  // 개발 실행(electron .)에서도 Dock 아이콘을 우리 아이콘으로 교체
  if (process.platform === "darwin" && app.dock) {
    try {
      app.dock.setIcon(nativeImage.createFromPath(ICON_PATH));
    } catch (e) {
      console.error("dock icon 설정 실패:", e);
    }
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
