const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  scanProjects: () => ipcRenderer.invoke("scan-projects"),
  hideProject: (key) => ipcRenderer.invoke("hide-project", key),
  unhideAllProjects: () => ipcRenderer.invoke("unhide-all-projects"),
  frequentDirs: () => ipcRenderer.invoke("frequent-dirs"),
  gitInfo: (dir) => ipcRenderer.invoke("git-info", dir),
  getBookmarks: () => ipcRenderer.invoke("get-bookmarks"),
  saveBookmarks: (list) => ipcRenderer.invoke("save-bookmarks", list),
  getLaunchHistory: () => ipcRenderer.invoke("get-launch-history"),
  launch: (payload) => ipcRenderer.invoke("launch", payload),
  openClaude: (payload) => ipcRenderer.invoke("open-claude", payload),
  reveal: (p) => ipcRenderer.invoke("reveal", p),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (s) => ipcRenderer.invoke("save-settings", s),
  detectTerminals: () => ipcRenderer.invoke("detect-terminals"),
  detectPresets: () => ipcRenderer.invoke("detect-presets"),
  appVersion: () => ipcRenderer.invoke("app-version"),
});
