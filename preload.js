const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('grim', {
  // Window
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close:    () => ipcRenderer.send('close'),

  // Navigation
  go:      (url) => ipcRenderer.send('nav-go', url),
  back:    ()    => ipcRenderer.send('nav-back'),
  forward: ()    => ipcRenderer.send('nav-forward'),
  refresh: ()    => ipcRenderer.send('nav-refresh'),
  stop:    ()    => ipcRenderer.send('nav-stop'),
  hide:    ()    => ipcRenderer.send('nav-hide'),
  show:    ()    => ipcRenderer.send('nav-show'),

  // Tabs
  tabNew:    (id) => ipcRenderer.send('tab-new', id),
  tabSwitch: (id) => ipcRenderer.send('tab-switch', id),
  tabClose:  (id) => ipcRenderer.send('tab-close', id),

  // Events from main → renderer
  onLoading:  (cb) => ipcRenderer.on('page-loading', (e, v) => cb(v)),
  onUrl:      (cb) => ipcRenderer.on('page-url',     (e, v) => cb(v)),
  onNav:      (cb) => ipcRenderer.on('page-nav',     (e, v) => cb(v)),
  onTitle:    (cb) => ipcRenderer.on('page-title',   (e, v) => cb(v)),
  onTabTitle: (cb) => ipcRenderer.on('tab-title',    (e, v) => cb(v)),

  // Security / engine
  onBlockedCount:  (cb) => ipcRenderer.on('blocked-count', (e, v) => cb(v)),
  onBlockedLog:    (cb) => ipcRenderer.on('blocked-log-updated', (e, v) => cb(v)),
  onAdblockReady:  (cb) => ipcRenderer.on('adblock-ready', (e, v) => cb(v)),
  onEngineStatus:  (cb) => ipcRenderer.on('engine-status', (e, v) => cb(v)),

  // Privacy
  setClearOnExit: (v) => ipcRenderer.send('set-clear-on-exit', v),
  wipeNow:        ()  => ipcRenderer.send('wipe-now'),

  // Tor
  torToggle: (enabled) => ipcRenderer.invoke('tor-toggle', enabled),
  torStatus: ()         => ipcRenderer.invoke('tor-status'),

  // File-based persistence
  loadSettings: ()       => ipcRenderer.invoke('load-settings'),
  saveSettings: (data)   => ipcRenderer.invoke('save-settings', data),
  loadHistory:  ()       => ipcRenderer.invoke('load-history'),
  saveHistory:  (data)   => ipcRenderer.invoke('save-history', data),

  // Grim Search
  search:       (query) => ipcRenderer.invoke('grim-search', query),
  searchImages: (query) => ipcRenderer.invoke('grim-images', query),
  searchVideos: (query) => ipcRenderer.invoke('grim-videos', query),

  // Grim AI
  aiAsk: (messages) => ipcRenderer.invoke('ai-ask', messages),
  getPageText: () => ipcRenderer.invoke('get-page-text'),
  onOpenCmd: (cb) => ipcRenderer.on('open-cmd', () => cb()),

  // AI provider keys (DeepSeek/HF, OpenAI, Gemini) — settings → information
  aiKeyGet:      (provider)        => ipcRenderer.invoke('ai-key-get', provider),
  aiKeySet:      (provider, token) => ipcRenderer.invoke('ai-key-set', provider, token),
  aiKeyOpenPage: (provider)        => ipcRenderer.send('ai-key-open-page', provider),

  // AI provider + model selection
  aiConfigGet: ()                 => ipcRenderer.invoke('ai-config-get'),
  aiConfigSet: (provider, model)  => ipcRenderer.invoke('ai-config-set', provider, model),

  // Owner identity (device-bound)
  ownerStatus: () => ipcRenderer.invoke('owner-status'),

  // Tab cloak — disguise the OS window/taskbar title
  setWindowTitle: (title) => ipcRenderer.send('set-window-title', title),

  // Status
  adblockStatus: () => ipcRenderer.invoke('adblock-status'),
  blockedLog:    () => ipcRenderer.invoke('blocked-log'),

  // Shields
  setShield: (key, on) => ipcRenderer.invoke('set-shield', key, on),

  // Bookmarks
  loadBookmarks: ()     => ipcRenderer.invoke('load-bookmarks'),
  saveBookmarks: (data) => ipcRenderer.invoke('save-bookmarks', data),

  // Shortcuts (home page)
  loadShortcuts: ()     => ipcRenderer.invoke('load-shortcuts'),
  saveShortcuts: (data) => ipcRenderer.invoke('save-shortcuts', data),


  // Session restore
  loadSession: ()     => ipcRenderer.invoke('load-session'),
  saveSession: (data) => ipcRenderer.invoke('save-session', data),

  // Find in page
  findInPage: (text) => ipcRenderer.send('find-in-page', text),
  findStop:   ()     => ipcRenderer.send('find-stop'),
  onFindResult: (cb) => ipcRenderer.on('find-result', (e, v) => cb(v)),

  // Downloads
  openDownload:        (p)  => ipcRenderer.send('open-download', p),
  openDownloadsFolder: ()   => ipcRenderer.send('open-downloads-folder'),
  scanDownload: (filename, url) => ipcRenderer.invoke('download-scan', filename, url),
  onDownloadStarted: (cb) => ipcRenderer.on('download-started', (e, v) => cb(v)),
  onDownloadUpdated: (cb) => ipcRenderer.on('download-updated', (e, v) => cb(v)),
  onDownloadDone:    (cb) => ipcRenderer.on('download-done',    (e, v) => cb(v)),
  onDownloadScan:    (cb) => ipcRenderer.on('download-scan',    (e, v) => cb(v)),
});
