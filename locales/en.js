// English resources. (Korean is ko.js) — when adding a key, add it to both files.
window.I18N = window.I18N || {};
window.I18N.en = {
  "app.sub":
    "Repetitive tasks in one click — terminal launcher + Claude Code dashboard",

  "btn.refresh": "Refresh",
  "btn.save": "Save",
  "btn.add": "Add",
  "btn.run": "Run",
  "btn.delete": "Delete",
  "btn.shell": "Shell",
  "btn.finder": "Finder",
  "btn.claudeC": "claude -c",
  "title.settings": "Settings",

  "set.lang": "Language",
  "set.theme": "Theme",
  "set.terminal": "Terminal app",
  "set.tabbyPath": "Tabby path",
  "set.customCmd": "Custom command",
  "set.presets": "Quick-run tools",
  "set.presetsHint":
    'Only checked tools appear as buttons in "Quick Run". (grayed = not installed on this Mac)',
  "set.customHint": `Enter the command that opens a new terminal. Placeholders: <code>{{script}}</code> (path to a run script with cd+command), <code>{{dir}}</code>, <code>{{cmd}}</code>, <code>{{shell}}</code>.<br />Examples — kitty: <code>kitty {{script}}</code> · WezTerm: <code>wezterm start -- {{script}}</code> · Alacritty: <code>alacritty -e {{script}}</code>`,

  "ph.tabby": "/Applications/Tabby.app/Contents/MacOS/Tabby",
  "ph.custom": "e.g. kitty {{script}}",
  "ph.bmName": "Name",
  "ph.bmDir": "Path (e.g. ~/Documents/proj)",
  "ph.bmCmd": "Command (empty = shell only)",

  "sec.quick": "Quick Run",
  "sec.workflow": "My Workflows",
  "sec.projects": "Claude Code Directories",
  "sec.frequent": "Frequent Folders",
  "sec.history": "Recent Runs",

  "empty.workflow": "Add a workflow below.",
  "empty.projects": "No Claude Code history yet.",
  "empty.history": "No run history yet.",

  "count.places": "{n}",
  "count.items": "{n}",
  "proj.meta": "{n} sessions · last {ago}",
  "pill.approx": "approx path",
  "pill.missing": "missing",
  "hide.title": "Hide from list",
  "hidden.restore": "{n} hidden · ",
  "hidden.showAll": "Show all",
  "freq.access": "{n} visits",
  "time.lastSuffix": " · last {ago}",

  "err.projectsUnreadable": "Cannot read {path}.",
  "alert.launchFail": "Failed to open terminal:",
  "alert.runFail": "Failed to run:",

  "git.localOnly": "local only",
  "git.lastCommit": "last commit {ago}",
  "git.unpushed": "{n} unpushed",
  "git.pushed": "pushed",
  "git.behind": "remote ahead by {n}",
  "git.noUpstream": "no upstream",

  "term.notInstalled": "(not installed)",
  "term.custom": "Custom (your command)",

  "time.noRecord": "no record",
  "time.justNow": "just now",
  "time.minAgo": "{n}m ago",
  "time.hourAgo": "{n}h ago",
  "time.dayAgo": "{n}d ago",

  "about.maker": "Maker",
  "about.note": "Please report bugs and feature requests via GitHub Issues.",

  "theme.charcoal": "Charcoal · dark default",
  "theme.ocean": "Ocean · deep blue",
  "theme.forest": "Forest · deep green",
  "theme.plum": "Plum · deep purple",
  "theme.nord": "Nord · slate (light dark)",
  "theme.sand": "Sand · warm light",
  "theme.light": "Light · white",

  "preset.docker-up": "Docker Compose up",
  "preset.docker-ps": "Docker containers",
  "preset.mysql": "MySQL connect",
  "preset.claude": "Claude Code",
  "preset.node": "Node REPL",
  "preset.python": "Python REPL",

  "term.terminal-app": "Terminal (macOS default)",
  "term.iterm": "iTerm2",
  "term.tabby": "Tabby",
};
