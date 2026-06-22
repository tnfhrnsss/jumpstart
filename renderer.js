const $ = (id) => document.getElementById(id);

// ── i18n (리소스는 locales/ko.js · locales/en.js) ──────
let lang = "ko";
function t(key, vars) {
  const dict = (window.I18N && window.I18N[lang]) || {};
  const fb = (window.I18N && window.I18N.ko) || {};
  let s = dict[key] != null ? dict[key] : fb[key] != null ? fb[key] : key;
  if (vars)
    s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}
// index.html의 정적 문자열 치환 (data-i18n / -html / -ph / -title)
function applyStaticI18n(root = document) {
  root
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root
    .querySelectorAll("[data-i18n-html]")
    .forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  root
    .querySelectorAll("[data-i18n-ph]")
    .forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  root
    .querySelectorAll("[data-i18n-title]")
    .forEach((el) => (el.title = t(el.dataset.i18nTitle)));
}
function applyLang(l) {
  lang = l === "en" ? "en" : "ko";
  document.documentElement.lang = lang;
  applyStaticI18n();
}

function timeAgo(ms) {
  if (!ms) return t("time.noRecord");
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return t("time.justNow");
  if (s < 3600) return t("time.minAgo", { n: Math.floor(s / 60) });
  if (s < 86400) return t("time.hourAgo", { n: Math.floor(s / 3600) });
  return t("time.dayAgo", { n: Math.floor(s / 86400) });
}
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
// 실행 후 결과 확인: 실패하면 알림 + 항상 히스토리 갱신
async function doLaunch(payload) {
  const r = await window.api.launch(payload);
  if (r && r.ok === false)
    alert(t("alert.launchFail") + "\n" + (r.error || ""));
  refreshHistory();
}
async function doClaude(payload) {
  const r = await window.api.openClaude(payload);
  if (r && r.ok === false) alert(t("alert.runFail") + "\n" + (r.error || ""));
  refreshHistory();
}

// ── 정보(About) — 값은 meta.json + package.json(버전)에서 읽음 ──
async function renderAbout() {
  let a = {};
  try {
    a = await window.api.appInfo();
  } catch {}
  const lines = [`<b>Jumpstart</b>${a.version ? " v" + esc(a.version) : ""}`];
  if (a.maker) lines.push(`${esc(t("about.maker"))} · <b>${esc(a.maker)}</b>`);
  if (a.github)
    lines.push(
      `GitHub · <a data-url="${esc(a.github)}">${esc(a.github.replace(/^https?:\/\//, ""))}</a>`,
    );
  lines.push(esc(t("about.note")));
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
  const th = THEMES[id] || THEMES.charcoal;
  const root = document.documentElement.style;
  for (const k in th) if (k.startsWith("--")) root.setProperty(k, th[k]);
}

// ── 설정 ───────────────────────────────────────────────
let settings = null;
let terminals = [];

$("toggle-settings").onclick = () => $("settings").classList.toggle("open");

function syncTerminalFields() {
  const v = $("set-terminal").value;
  $("field-tabby").style.display = v === "tabby" ? "" : "none";
  $("field-custom").style.display = v === "custom" ? "" : "none";
  $("hint-custom").style.display = v === "custom" ? "" : "none";
}

async function renderSettings() {
  settings = await window.api.getSettings();
  terminals = await window.api.detectTerminals();

  // 언어
  const lsel = $("set-lang");
  lsel.innerHTML = "";
  for (const [id, label] of [
    ["ko", "한국어"],
    ["en", "English"],
  ]) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = label; // 언어명은 각 언어로 고정 표기
    lsel.appendChild(o);
  }
  lsel.value = lang;
  lsel.onchange = () => {
    applyLang(lsel.value); // 즉시 미리보기 + 동적 영역 다시 렌더
    refreshAll();
  };

  // 테마
  const tsel = $("set-theme");
  tsel.innerHTML = "";
  for (const id in THEMES) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = t("theme." + id);
    tsel.appendChild(o);
  }
  tsel.value = settings.theme || "charcoal";
  applyTheme(tsel.value);
  tsel.onchange = () => applyTheme(tsel.value); // 즉시 미리보기

  // 터미널 선택
  const sel = $("set-terminal");
  sel.innerHTML = "";
  for (const term of terminals) {
    const o = document.createElement("option");
    o.value = term.id;
    const name = t("term." + term.id);
    o.textContent = term.available ? name : `${name} ${t("term.notInstalled")}`;
    o.disabled = !term.available;
    sel.appendChild(o);
  }
  // 커스텀은 항상 선택 가능
  const co = document.createElement("option");
  co.value = "custom";
  co.textContent = t("term.custom");
  sel.appendChild(co);
  sel.value = settings.terminal || "terminal-app";
  sel.onchange = syncTerminalFields;

  // 열기 방식 (새 창 / 새 탭)
  const osel = $("set-openin");
  osel.innerHTML = "";
  for (const id of ["window", "tab"]) {
    const o = document.createElement("option");
    o.value = id;
    o.textContent = t("openIn." + id);
    osel.appendChild(o);
  }
  osel.value = settings.openIn === "tab" ? "tab" : "window";

  $("set-tabby").value = settings.tabbyPath || "";
  $("set-custom").value = settings.customCommand || "";
  syncTerminalFields();
}

$("set-save").onclick = async () => {
  await window.api.saveSettings({
    lang: $("set-lang").value,
    theme: $("set-theme").value,
    terminal: $("set-terminal").value,
    openIn: $("set-openin").value,
    tabbyPath: $("set-tabby").value.trim(),
    customCommand: $("set-custom").value.trim(),
  });
  $("settings").classList.remove("open");
  refreshAll();
};

// ── 빠른 실행 (즐겨찾기) ───────────────────────────────
// 다른 섹션의 ⭐ 버튼으로 추가한 항목 목록. {id,name,dir,cmd}
const QUICK_MAX = 8; // 즐겨찾기 최대 개수 (너무 많으면 부담스러우므로 제한)
let quickFavs = [];
const favKey = (dir, cmd) => `${dir} ${cmd || ""}`;
function isFav(dir, cmd) {
  return quickFavs.some((f) => favKey(f.dir, f.cmd) === favKey(dir, cmd));
}
// 다른 섹션에서 ⭐ 클릭 → 빠른 실행에 추가(중복은 무시). 전체 재렌더 없이 빠른 실행만 갱신.
async function addQuickFav(item) {
  if (!item || !item.dir) return;
  if (isFav(item.dir, item.cmd)) return; // 이미 있음
  if (quickFavs.length >= QUICK_MAX) {
    alert(t("quick.full", { max: QUICK_MAX }));
    return;
  }
  quickFavs.push({
    id: Date.now(),
    name: item.name || item.dir,
    dir: item.dir,
    cmd: item.cmd || "",
  });
  await window.api.saveQuickFavorites(quickFavs);
  renderQuick();
}
async function removeQuickFav(id) {
  quickFavs = quickFavs.filter((f) => f.id != id);
  await window.api.saveQuickFavorites(quickFavs);
  renderQuick();
}
async function renderQuick() {
  quickFavs = await window.api.getQuickFavorites();
  $("quick-section").style.display = ""; // 비어 있어도 헤더는 항상 표시
  $("quick-count").textContent = t("quick.count", {
    n: quickFavs.length,
    max: QUICK_MAX,
  });
  const box = $("quick");
  box.innerHTML = ""; // 비었을 때 추가 안내는 헤더의 ⓘ 툴팁으로 제공
  for (const f of quickFavs) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path">${esc(f.name)}</div>
        <div class="meta">${esc(f.dir)}${f.cmd ? "  ·  " + esc(f.cmd) : ""}</div>
      </div>
      <div class="actions">
        <button class="primary" data-qrun="${f.id}">${esc(t("btn.run"))}</button>
        <button class="del" data-qdel="${f.id}" title="${esc(t("quick.remove"))}">✕</button>
      </div>`;
    box.appendChild(el);
  }
  box.querySelectorAll("[data-qrun]").forEach((btn) => {
    btn.onclick = () => {
      const f = quickFavs.find((x) => x.id == btn.dataset.qrun);
      if (f) doLaunch({ dir: f.dir, cmd: f.cmd, label: f.name });
    };
  });
  box
    .querySelectorAll("[data-qdel]")
    .forEach((btn) => (btn.onclick = () => removeQuickFav(btn.dataset.qdel)));
}

// ── 워크플로우(북마크) ─────────────────────────────────
let bookmarks = [];
async function renderBookmarks() {
  bookmarks = await window.api.getBookmarks();
  $("bm-count").textContent = t("count.items", { n: bookmarks.length });
  const box = $("bookmarks");
  box.innerHTML = bookmarks.length
    ? ""
    : `<div class="empty">${esc(t("empty.workflow"))}</div>`;
  for (const b of bookmarks) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path">${esc(b.name)}</div>
        <div class="meta">${esc(b.dir)}${b.cmd ? "  ·  " + esc(b.cmd) : ""}</div>
      </div>
      <div class="actions">
        <button class="primary" data-run="${b.id}">${esc(t("btn.run"))}</button>
        <button class="del" data-del="${b.id}">${esc(t("btn.delete"))}</button>
      </div>`;
    el.querySelector(".actions").insertBefore(
      makeFavButton({ name: b.name, dir: b.dir, cmd: b.cmd }),
      el.querySelector("[data-del]"),
    );
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

// 경로의 마지막 폴더명 (즐겨찾기 이름 기본값)
function baseName(p) {
  const s = String(p).replace(/\/+$/, "");
  const i = s.lastIndexOf("/");
  return (i >= 0 ? s.slice(i + 1) : s) || s;
}
// "빠른 실행에 추가(⭐)" 버튼 생성. 데이터를 클로저로 담아 속성 이스케이프 문제를 피함.
function makeFavButton(item) {
  const b = document.createElement("button");
  b.className = "fav";
  b.textContent = "★";
  b.title = t("fav.add");
  b.onclick = () => addQuickFav(item);
  return b;
}

// ── Claude Code 디렉토리 ───────────────────────────────
// 현재 숨김 개수 (✕로 행을 지울 때 전체 재렌더 없이 갱신하기 위해 보관)
let projHiddenCount = 0;
// 카운트 배지와 "숨긴 항목 N개 · 모두 표시" 안내를 재렌더 없이 갱신
function refreshProjMeta() {
  const box = $("projects");
  const visible = box.querySelectorAll(".row").length;
  $("proj-count").textContent = t("count.places", { n: visible });
  let footer = $("proj-hidden");
  if (projHiddenCount > 0) {
    if (!footer) {
      footer = document.createElement("div");
      footer.id = "proj-hidden";
      footer.className = "empty";
      box.appendChild(footer);
    }
    footer.innerHTML = `${esc(t("hidden.restore", { n: projHiddenCount }))}<a class="restore">${esc(t("hidden.showAll"))}</a>`;
    footer.querySelector(".restore").onclick = async () => {
      await window.api.unhideAllProjects();
      renderProjects();
    };
  } else if (footer) {
    footer.remove();
  }
}

async function renderProjects() {
  const { error, errorPath, projects, hiddenCount } =
    await window.api.scanProjects();
  const box = $("projects");
  $("proj-count").textContent = error
    ? ""
    : t("count.places", { n: projects.length });
  if (error) {
    box.innerHTML = `<div class="empty">${esc(t(error, { path: errorPath }))}</div>`;
    return;
  }
  box.innerHTML = projects.length
    ? ""
    : `<div class="empty">${esc(t("empty.projects"))}</div>`;
  for (const p of projects) {
    const el = document.createElement("div");
    el.className = "row";
    el.innerHTML = `
      <div class="main">
        <div class="path ${p.exists ? "" : "missing"}">${esc(p.realPath)}
          ${p.approx ? `<span class="pill">${esc(t("pill.approx"))}</span>` : ""}
          ${p.exists ? "" : `<span class="pill missing">${esc(t("pill.missing"))}</span>`}
        </div>
        <div class="meta">${esc(t("proj.meta", { n: p.sessions, ago: timeAgo(p.lastUsed) }))}</div>
        <div class="gitline" data-git="${esc(p.realPath)}"></div>
      </div>
      <div class="actions">
        <button data-shell="${esc(p.realPath)}">${esc(t("btn.shell"))}</button>
        <button class="primary" data-resume="${esc(p.realPath)}">${esc(t("btn.claudeC"))}</button>
        <button data-finder="${esc(p.realPath)}">${esc(t("btn.finder"))}</button>
        <button class="del" data-hide="${esc(p.key)}" title="${esc(t("hide.title"))}">✕</button>
      </div>`;
    // 빠른 실행 추가(⭐): 그 폴더에서 셸 열기로 등록
    el.querySelector(".actions").insertBefore(
      makeFavButton({ name: baseName(p.realPath), dir: p.realPath, cmd: "" }),
      el.querySelector("[data-hide]"),
    );
    box.appendChild(el);
  }
  // 숨긴 항목 개수 표시(+복구 안내). 재렌더 없이 갱신할 수 있게 분리.
  projHiddenCount = hiddenCount;
  refreshProjMeta();
  wireDirButtons(box);
  box.querySelectorAll("[data-hide]").forEach(
    (b) =>
      (b.onclick = async () => {
        await window.api.hideProject(b.dataset.hide);
        // 전체 재렌더 대신 그 행만 제거 → 스크롤 위치 유지
        const row = b.closest(".row");
        if (row) row.remove();
        projHiddenCount++;
        refreshProjMeta();
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
  $("freq-count").textContent = dirs.length
    ? t("count.places", { n: dirs.length })
    : "";
  const box = $("frequent");
  box.innerHTML = "";
  for (const d of dirs) {
    const el = document.createElement("div");
    el.className = "row";
    const meta =
      t("freq.access", { n: d.count }) +
      (d.lastUsed ? t("time.lastSuffix", { ago: timeAgo(d.lastUsed) }) : "");
    el.innerHTML = `
      <div class="main">
        <div class="path ${d.exists ? "" : "missing"}">${esc(d.dir)}
          ${d.exists ? "" : `<span class="pill missing">${esc(t("pill.missing"))}</span>`}
        </div>
        <div class="meta">${esc(meta)}</div>
      </div>
      <div class="actions">
        <button data-shell="${esc(d.dir)}">${esc(t("btn.shell"))}</button>
        <button class="primary" data-resume="${esc(d.dir)}">${esc(t("btn.claudeC"))}</button>
        <button data-finder="${esc(d.dir)}">${esc(t("btn.finder"))}</button>
      </div>`;
    el.querySelector(".actions").appendChild(
      makeFavButton({ name: baseName(d.dir), dir: d.dir, cmd: "" }),
    );
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
    parts.push(`<span class="badge">${esc(t("git.localOnly"))}</span>`);
  }
  if (g.branch) parts.push(`<span class="badge">${esc(g.branch)}</span>`);
  if (g.lastCommitTs)
    parts.push(esc(t("git.lastCommit", { ago: timeAgo(g.lastCommitTs) })));
  if (g.hasUpstream) {
    if (g.ahead > 0)
      parts.push(
        `<span class="badge warn">${esc(t("git.unpushed", { n: g.ahead }))}</span>`,
      );
    else parts.push(`<span class="badge ok">${esc(t("git.pushed"))}</span>`);
    if (g.behind > 0)
      parts.push(
        `<span class="badge">${esc(t("git.behind", { n: g.behind }))}</span>`,
      );
  } else if (g.webUrl || g.remoteUrl) {
    parts.push(`<span class="badge">${esc(t("git.noUpstream"))}</span>`);
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
    : `<div class="empty">${esc(t("empty.history"))}</div>`;
  const locale = lang === "en" ? "en-US" : "ko-KR";
  for (const h of hist.slice(0, 20)) {
    const el = document.createElement("div");
    el.className = "hist";
    const hhmm = new Date(h.ts).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
    el.innerHTML = `${hhmm}  <b>${esc(h.label)}</b>  ${esc(h.dir)}${h.cmd ? "  $ " + esc(h.cmd) : ""}`;
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

// 저장된 테마·언어를 먼저 적용해 깜빡임 방지 → 이후 전체 렌더
(async () => {
  try {
    const s = await window.api.getSettings();
    applyTheme(s.theme);
    applyLang(s.lang);
  } catch {
    applyLang("ko");
  }
  refreshAll();
})();
