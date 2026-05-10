// ===========================================================================
// DeskX: Wallpaper Engine – Preload Script
// Secure IPC bridge between main and renderer processes
// ===========================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wallpaperAPI', {
  // --- Wallpaper Renderer APIs ---
  onSetWallpaper: (callback) => ipcRenderer.on('set-wallpaper', (_, config) => callback(config)),
  onToggleSound: (callback) => ipcRenderer.on('toggle-sound', (_, enabled) => callback(enabled)),
  onPause: (callback) => ipcRenderer.on('pause', () => callback()),
  onResume: (callback) => ipcRenderer.on('resume', () => callback()),
  onSetFit: (callback) => ipcRenderer.on('set-fit', (_, fit) => callback(fit)),

  // --- Settings UI APIs ---
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setMode: (mode) => ipcRenderer.invoke('set-mode', mode),
  setGlobalConfig: (config) => ipcRenderer.invoke('set-global-config', config),
  setMonitorConfig: (monitorId, config) => ipcRenderer.invoke('set-monitor-config', monitorId, config),
  applyWallpapers: () => ipcRenderer.invoke('apply-wallpapers'),
  removeWallpapers: () => ipcRenderer.invoke('remove-wallpapers'),
  toggleSound: (monitorId, enabled) => ipcRenderer.invoke('toggle-sound-monitor', monitorId, enabled),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  setAutostart: (enabled) => ipcRenderer.invoke('set-autostart', enabled),

  // --- Events from main to settings ---
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (_, settings) => callback(settings)),
  onDisplaysChanged: (callback) => ipcRenderer.on('displays-changed', (_, displays) => callback(displays)),

  // --- Window Controls (for frameless titlebar) ---
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
});
