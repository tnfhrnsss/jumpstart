const $ = (id) => document.getElementById(id);

function timeAgo(ms) {
  if (!ms) return "기록 없음";
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
// 실행 후 결과 확인: 실패하면 알림 + 항상 히스토리 갱신
async function doLaunch(payload) {
  const r = await window.api.launch(payload);
  if (r && r.ok === false) alert("터미널 실행 실패:\n" + (r.error || ""));
  refreshHistory();
}
async function doClaude(payload) {
  const r = await window.api.openClaude(payload);
  if (r && r.ok === false) alert("실행 실패:\n" + (r.error || ""));
  refreshHistory();
}

// ── 정보(About) — 이 값만 본인 정보로 수정하면 됩니다 ──
const ABOUT = {
  maker: "jj", // 만든이
  github: "https://github.com/tnfhrnsss/jumpstart", // ← 실제 GitHub 저장소 주소로 수정
  note: "버그·장애·개선 요청은 GitHub Issues로 남겨 주세요.", // 안내 문구 (없으면 "")
};
async function renderAbout() {
  let ver = "";
  try {
    ver = await window.api.appVersion();
  } catch {}
  const a = ABOUT;
  const lines = [`<b>Jumpstart</b>${ver ? " v" + esc(ver) : ""}`];
  if (a.maker) lines.push(`만든이 · <b>${esc(a.maker)}</b>`);
  if (a.github)
    lines.push(
      `GitHub · <a data-url="${esc(a.github)}">${esc(a.github.replace(/^https?:\/\//, ""))}</a>`,
    );
  if (a.note) lines.push(esc(a.note));
  const box = $("about");
  box.innerHTML = lines.join("<br>");
  const link = box.querySelector("a[data-url]");
  if (link) link.onclick = () => window.api.openExternal(link.dataset.url);
}

// ── 테마 (배경색이 확실히 구분되도록 다양화) ───────────
const THEMES = {
  charcoal: {
    name: "Charcoal · 다크 기본",
    "--bg": "#16181d",
    "--panel": "#1e2128",
    "--panel2": "#23262e",
    "--border": "#2e323c",
    "--text": "#e6e8ec",
    "--muted": "#8b909a",
    "--accent": "#d97757",
    "--accent-dim": "#3a2a23",
    "--green": "#6bbf8a",
  },
  ocean: {
    name: "Ocean · 딥블루",
    "--bg": "#0a1f30",
    "--panel": "#0f2c44",
    "--panel2": "#143753",
    "--border": "#1f4d72",
    "--text": "#dcebf7",
    "--muted": "#7ea3bf",
    "--accent": "#3fc4e6",
    "--accent-dim": "#103346",
    "--green": "#5fd0a8",
  },
  forest: {
    name: "Forest · 딥그린",
    "--bg": "#0b1f15",
    "--panel": "#102c1f",
    "--panel2": "#163827",
    "--border": "#225039",
    "--text": "#dcefdf",
    "--muted": "#83a994",
    "--accent": "#4fc97e",
    "--accent-dim": "#123524",
    "--green": "#7fe0a6",
  },
  plum: {
    name: "Plum · 딥퍼플",
    "--bg": "#1b1230",
    "--panel": "#271a42",
    "--panel2": "#322153",
    "--border": "#473073",
    "--text": "#ece2f7",
    "--muted": "#a394c0",
    "--accent": "#c08bff",
    "--accent-dim": "#2c2050",
    "--green": "#69c2a0",
  },
  nord: {
    name: "Nord · 슬레이트(밝은 다크)",
    "--bg": "#2e3440",
    "--panel": "#3b4252",
    "--panel2": "#434c5e",
    "--border": "#4c566a",
    "--text": "#eceff4",
    "--muted": "#a0aabe",
    "--accent": "#88c0d0",
    "--accent-dim": "#3b4a60",
    "--green": "#a3be8c",
  },
  sand: {
    name: "Sand · 웜 라이트",
    "--bg": "#f3ecdd",
    "--panel": "#fffdf6",
    "--panel2": "#ece2cd",
    "--border": "#d8cbac",
    "--text": "#3a2f1d",
    "--muted": "#8a7a5c",
    "--accent": "#bf6a2e",
    "--accent-dim": "#efe0c8",
    "--green": "#5f8a30",
  },
  light: {
    name: "Light · 화이트",
    "--bg": "#f4f5f7",
    "--panel": "#ffffff",
    "--panel2": "#eef0f3",
    "--border": "#d9dde3",
    "--text": "#1c2024",
    "--muted": "#6b7280",
    "--accent": "#c25a3a",
    "--accent-dim": "#f7e6df",
    "--green": "#2f9e5e",
  },
};
function applyTheme(id) {
  const t = THEMES[id] || THEMES.charcoal;
  const root = document.documentElement.style;
  for (const k in t) if (k.startsWith("--")) root.setProperty(k, t[k]);
}

// ── 설정 ───────────────────────────────────────────────
let settings = null;
let terminals = [];
let presets = [];

$("toggle-settings").onclick = () => $("settings").classList.toggle("open");

function syncTerminalFields() {
  const t = $("set-terminal").value;
  $("field-tabby").style.display = t === "tabby" ? "" : "none";
  $("field-custom").style.display = t === "custom" ? "" : "none";
  $("hint-custom").style.display = t === "custom" ? "" : "none";
}

async function renderSettings() {
  settings = await window.api.getSettings();
  terminals = await window.api.detectTerminals();
  presets = await window.api.detectPresets();

  // 테마
  const tsel = $("set-theme");
  tsel.innerHTML = "";
  for (const id in THEMES) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = THEMES[id].name;
    tsel.appendChild(o);
  }
  tsel.value = settings.theme || "charcoal";
  applyTheme(tsel.value);
  tsel.onchange = () => applyTheme(tsel.value); // 즉시 미리보기

  // 터미널 선택
  const sel = $("set-terminal");
  sel.innerHTML = "";
  for (const t of terminals) {
    const o = document.createElement("option");
    o.value = t.id;
    o.textContent = t.available ? t.name : `${t.name} (미설치)`;
    o.disabled = !t.available;
    sel.appendChild(o);
  }
  // 커스텀은 항상 선택 가능
  const co = document.createElement("option");
  co.value = "custom";
  co.textContent = "사용자 지정 (직접 명령)";
  sel.appendChild(co);
  sel.value = settings.terminal || "terminal-app";
  sel.onchange = syncTerminalFields;

  $("set-tabby").value = settings.tabbyPath || "";
  $("set-custom").value = settings.customCommand || "";
  syncTerminalFields();

  // 빠른 실행 프리셋 체크리스트
  const enabled = settings.enabledPresetIds; // null 이면 "설치된 것 자동"
  const box = $("set-presets");
  box.innerHTML = "";
  for (const p of presets) {
    const on = enabled == null ? p.available : enabled.includes(p.id);
    const lab = document.createElement("label");
    lab.style.opacity = p.available ? "" : "0.45";
    lab.innerHTML = `<input type="checkbox" data-preset="${p.id}" ${on ? "checked" : ""} ${p.available ? "" : "disabled"} />
      <span>${esc(p.name)} <span style="color:var(--muted);font-size:11px">· ${esc(p.cmd)}${p.available ? "" : "  (미설치)"}</span></span>`;
    box.appendChild(lab);
  }
}

$("set-save").onclick = async () => {
  const enabledPresetIds = Array.from(
    $("set-presets").querySelectorAll("input[data-preset]:checked"),
  ).map((c) => c.dataset.preset);
  await window.api.saveSettings({
    theme: $("set-theme").value,
    terminal: $("set-terminal").value,
    tabbyPath: $("set-tabby").value.trim(),
    customCommand: $("set-custom").value.trim(),
    enabledPresetIds,
  });
  $("settings").classList.remove("open");
  refreshAll();
};

// ── 빠른 실행 ──────────────────────────────────────────
function renderQuick() {
  const enabled = settings ? settings.enabledPresetIds : null;
  const list = presets.filter((p) => {
    if (!p.available) return false;
    return enabled == null ? true : enabled.includes(p.id);
  });
  $("quick-section").style.display = list.length ? "" : "none";
  $("quick-count").textContent = `${list.length}개`;
  const box = $("quick");
  box.innerHTML = "";
  for (const p of list) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path">${esc(p.name)}</div>
        <div class="meta">${esc(p.dir)}  ·  ${esc(p.cmd)}</div>
      </div>
      <div class="actions">
        <button class="primary" data-q="${p.id}">실행</button>
      </div>`;
    box.appendChild(el);
  }
  box.querySelectorAll("[data-q]").forEach((btn) => {
    btn.onclick = () => {
      const p = presets.find((x) => x.id === btn.dataset.q);
      doLaunch({ dir: p.dir, cmd: p.cmd, label: p.name });
    };
  });
}

// ── 워크플로우(북마크) ─────────────────────────────────
let bookmarks = [];
async function renderBookmarks() {
  bookmarks = await window.api.getBookmarks();
  $("bm-count").textContent = `${bookmarks.length}개`;
  const box = $("bookmarks");
  box.innerHTML = bookmarks.length
    ? ""
    : '<div class="empty">아래에서 워크플로우를 추가하세요.</div>';
  for (const b of bookmarks) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path">${esc(b.name)}</div>
        <div class="meta">${esc(b.dir)}${b.cmd ? "  ·  " + esc(b.cmd) : ""}</div>
      </div>
      <div class="actions">
        <button class="primary" data-run="${b.id}">실행</button>
        <button class="del" data-del="${b.id}">삭제</button>
      </div>`;
    box.appendChild(el);
  }
  box.querySelectorAll("[data-run]").forEach(
    (btn) =>
      (btn.onclick = () => {
        const b = bookmarks.find((x) => x.id == btn.dataset.run);
        doLaunch({ dir: b.dir, cmd: b.cmd, label: b.name });
      }),
  );
  box.querySelectorAll("[data-del]").forEach(
    (btn) =>
      (btn.onclick = async () => {
        bookmarks = bookmarks.filter((x) => x.id != btn.dataset.del);
        await window.api.saveBookmarks(bookmarks);
        renderBookmarks();
      }),
  );
}
$("bm-add").onclick = async () => {
  const name = $("bm-name").value.trim(),
    dir = $("bm-dir").value.trim(),
    cmd = $("bm-cmd").value.trim();
  if (!name || !dir) return;
  bookmarks.push({ id: Date.now(), name, dir, cmd });
  await window.api.saveBookmarks(bookmarks);
  $("bm-name").value = $("bm-dir").value = $("bm-cmd").value = "";
  renderBookmarks();
};

// 디렉토리 행의 셸/claude/Finder 버튼을 공통으로 배선 (디렉토리·자주여는곳 공용)
function wireDirButtons(box) {
  box
    .querySelectorAll("[data-shell]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          doLaunch({ dir: b.dataset.shell, cmd: "", label: "shell" })),
    );
  box
    .querySelectorAll("[data-resume]")
    .forEach(
      (b) =>
        (b.onclick = () => doClaude({ dir: b.dataset.resume, mode: "resume" })),
    );
  box
    .querySelectorAll("[data-finder]")
    .forEach((b) => (b.onclick = () => window.api.reveal(b.dataset.finder)));
}

// ── Claude Code 디렉토리 ───────────────────────────────
async function renderProjects() {
  const { error, projects, hiddenCount } = await window.api.scanProjects();
  const box = $("projects");
  $("proj-count").textContent = error ? "" : `${projects.length}곳`;
  if (error) {
    box.innerHTML = `<div class="empty">${esc(error)}</div>`;
    return;
  }
  box.innerHTML = projects.length
    ? ""
    : '<div class="empty">아직 Claude Code 기록이 없습니다.</div>';
  for (const p of projects) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path ${p.exists ? "" : "missing"}">${esc(p.realPath)}
          ${p.approx ? '<span class="pill">추정경로</span>' : ""}
          ${p.exists ? "" : '<span class="pill missing">없음</span>'}
        </div>
        <div class="meta">세션 ${p.sessions}개 · 마지막 ${timeAgo(p.lastUsed)}</div>
        <div class="gitline" data-git="${esc(p.realPath)}"></div>
      </div>
      <div class="actions">
        <button data-shell="${esc(p.realPath)}">셸</button>
        <button class="primary" data-resume="${esc(p.realPath)}">claude -c</button>
        <button data-finder="${esc(p.realPath)}">Finder</button>
        <button class="del" data-hide="${esc(p.key)}" title="목록에서 숨기기">✕</button>
      </div>`;
    box.appendChild(el);
  }
  // 숨긴 항목이 있으면 복구 안내를 목록 끝에 표시
  if (hiddenCount > 0) {
    const el = document.createElement("div");
    el.className = "empty";
    el.innerHTML = `숨긴 항목 ${hiddenCount}개 · <a class="restore">모두 표시</a>`;
    box.appendChild(el);
    el.querySelector(".restore").onclick = async () => {
      await window.api.unhideAllProjects();
      renderProjects();
    };
  }
  wireDirButtons(box);
  box.querySelectorAll("[data-hide]").forEach(
    (b) =>
      (b.onclick = async () => {
        await window.api.hideProject(b.dataset.hide);
        renderProjects();
      }),
  );

  // git 정보는 행 렌더 후 비동기로 채운다 (느릴 수 있으므로)
  for (const p of projects) {
    if (!p.exists) continue;
    loadGit(p.realPath);
  }
}

// ── 자주 여는 곳 (실행 히스토리 집계) ──────────────────
async function renderFrequent() {
  const dirs = await window.api.frequentDirs();
  $("frequent-section").style.display = dirs.length ? "" : "none";
  $("freq-count").textContent = dirs.length ? `${dirs.length}곳` : "";
  const box = $("frequent");
  box.innerHTML = "";
  for (const d of dirs) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path ${d.exists ? "" : "missing"}">${esc(d.dir)}
          ${d.exists ? "" : '<span class="pill missing">없음</span>'}
        </div>
        <div class="meta">${d.count}회 접근${d.lastUsed ? " · 마지막 " + timeAgo(d.lastUsed) : ""}</div>
      </div>
      <div class="actions">
        <button data-shell="${esc(d.dir)}">셸</button>
        <button class="primary" data-resume="${esc(d.dir)}">claude -c</button>
        <button data-finder="${esc(d.dir)}">Finder</button>
      </div>`;
    box.appendChild(el);
  }
  wireDirButtons(box);
}

async function loadGit(dir) {
  let g;
  try {
    g = await window.api.gitInfo(dir);
  } catch {
    return;
  }
  const el = document.querySelector(`.gitline[data-git="${cssEsc(dir)}"]`);
  if (!el || !g || !g.isRepo) return;

  const parts = [];
  if (g.webUrl) {
    parts.push(
      `<a class="repo" data-url="${esc(g.webUrl)}">${esc(shortRepo(g.webUrl))}</a>`,
    );
  } else if (g.remoteUrl) {
    parts.push(`<span class="repo">${esc(g.remoteUrl)}</span>`);
  } else {
    parts.push('<span class="badge">로컬 전용</span>');
  }
  if (g.branch) parts.push(`<span class="badge">${esc(g.branch)}</span>`);
  if (g.lastCommitTs) parts.push(`마지막 커밋 ${timeAgo(g.lastCommitTs)}`);
  if (g.hasUpstream) {
    if (g.ahead > 0)
      parts.push(`<span class="badge warn">미푸시 ${g.ahead}커밋</span>`);
    else parts.push(`<span class="badge ok">푸시 완료</span>`);
    if (g.behind > 0)
      parts.push(`<span class="badge">원격이 ${g.behind} 앞섬</span>`);
  } else if (g.webUrl || g.remoteUrl) {
    parts.push('<span class="badge">업스트림 미설정</span>');
  }
  el.innerHTML = parts.join(" ");
  const link = el.querySelector(".repo[data-url]");
  if (link) link.onclick = () => window.api.openExternal(link.dataset.url);
}

function shortRepo(webUrl) {
  // https://github.com/owner/repo → github.com/owner/repo
  return webUrl.replace(/^https?:\/\//, "");
}
function cssEsc(s) {
  return String(s).replace(/["\\]/g, "\\$&");
}

// ── 실행 히스토리 ───────────────────────────────────────
async function refreshHistory() {
  const hist = await window.api.getLaunchHistory();
  const box = $("history");
  box.innerHTML = hist.length
    ? ""
    : '<div class="empty">아직 실행 기록이 없습니다.</div>';
  for (const h of hist.slice(0, 20)) {
    const el = document.createElement("div");
    el.className = "hist";
    const t = new Date(h.ts).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    el.innerHTML = `${t}  <b>${esc(h.label)}</b>  ${esc(h.dir)}${h.cmd ? "  $ " + esc(h.cmd) : ""}`;
    box.appendChild(el);
  }
}

// 한 섹션이 실패해도 나머지는 계속 렌더되도록 각각 격리해서 실행
async function safe(fn) {
  try {
    await fn();
  } catch (e) {
    console.error(`[refreshAll] ${fn.name} 실패:`, e);
  }
}
async function refreshAll() {
  // 독립 섹션들 먼저 (설정과 무관하게 항상 보이도록)
  await safe(renderProjects);
  await safe(renderFrequent);
  await safe(refreshHistory);
  await safe(renderBookmarks);
  // 설정 → 그에 의존하는 빠른 실행
  await safe(renderSettings);
  await safe(renderQuick);
  await safe(renderAbout);
}
$("refresh").onclick = refreshAll;

// 저장된 테마를 먼저 적용해 깜빡임 방지 → 이후 전체 렌더
(async () => {
  try {
    const s = await window.api.getSettings();
    applyTheme(s.theme);
  } catch {}
  refreshAll();
})();
