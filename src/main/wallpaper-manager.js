// ===========================================================================
// DeskX: Wallpaper Engine – Wallpaper Manager
// Manages wallpaper BrowserWindows for each monitor
// ===========================================================================

const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const settingsStore = require('./settings-store');
const win32Wallpaper = require('./win32-wallpaper');

// Map of monitor ID => BrowserWindow
const wallpaperWindows = new Map();

// Map of monitor ID => Overlay BrowserWindow
const overlayWindows = new Map();

// Overlay z-order maintenance timers
const overlayZOrderTimers = new Map();

// Spanning window (when in spanning mode)
let spanningWindow = null;

// Whether wallpapers are currently active
let isActive = false;

// Debounce timer for display changes
let displayChangeTimer = null;

// Guard against re-entrancy during apply
let isApplying = false;

/**
 * Create a wallpaper BrowserWindow for a specific display.
 * @param {Electron.Display} display
 * @param {object} config - wallpaper configuration
 * @returns {BrowserWindow}
 */
function createWallpaperWindow(display, config) {
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: false,
    skipTaskbar: true,       // Hide from taskbar
    resizable: false,
    movable: false,
    focusable: false,        // Don't steal focus from other apps
    fullscreenable: false,
    show: false,
    backgroundColor: '#000000',
    // These prevent the window from appearing in alt-tab
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      backgroundThrottling: false, // Keep animations running when not focused
    },
  });

  // Remove menu bar
  win.setMenu(null);

  // Make it non-focusable and non-activatable
  win.setAlwaysOnTop(false);
  win.setSkipTaskbar(true);

  // Load the wallpaper renderer
  win.loadFile(path.join(__dirname, '..', 'renderer', 'wallpaper', 'index.html'));

  // Once loaded, send the wallpaper config
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('set-wallpaper', config);
  });

  // Show window and attach once ready
  win.once('ready-to-show', () => {
    win.showInactive(); // Show without stealing focus
    // Attach to desktop (WorkerW or fallback)
    try {
      win32Wallpaper.attachWindow(win, {
        forwardMouseInput: config.interactive || false,
        forwardKeyboardInput: config.interactive || false,
      });
    } catch (err) {
      console.error('[WallpaperManager] Attach failed:', err.message);
    }
  });

  // Prevent the window from being focused by clicking
  win.on('focus', () => {
    win.blur();
  });

  return win;
}

/**
 * Create a spanning wallpaper window across all displays.
 * @param {object} config
 * @returns {BrowserWindow}
 */
function createSpanningWindow(config) {
  const displays = screen.getAllDisplays();

  // Calculate the bounding rectangle of all displays
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const display of displays) {
    const { x, y, width, height } = display.bounds;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  const totalWidth = maxX - minX;
  const totalHeight = maxY - minY;

  const win = new BrowserWindow({
    x: minX,
    y: minY,
    width: totalWidth,
    height: totalHeight,
    frame: false,
    transparent: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#000000',
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      backgroundThrottling: false,
    },
  });

  win.setMenu(null);
  win.setSkipTaskbar(true);
  win.loadFile(path.join(__dirname, '..', 'renderer', 'wallpaper', 'index.html'));

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('set-wallpaper', config);
  });

  win.once('ready-to-show', () => {
    win.showInactive();
    try {
      // Pass the spanning bounds so attachWindow can reposition after SetParent
      win32Wallpaper.attachWindow(win, {
        forwardMouseInput: config.interactive || false,
        forwardKeyboardInput: config.interactive || false,
        targetBounds: { x: minX, y: minY, width: totalWidth, height: totalHeight },
      });
    } catch (err) {
      console.error('[WallpaperManager] Spanning attach failed:', err.message);
    }
  });

  win.on('focus', () => {
    win.blur();
  });

  return win;
}

/**
 * Create a transparent overlay BrowserWindow for a specific display.
 * This window sits above the desktop but below all normal windows.
 * It renders interactive widgets.
 * @param {Electron.Display} display
 * @returns {BrowserWindow}
 */
function createOverlayWindow(display) {
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: true,
    fullscreenable: false,
    show: false,
    hasShadow: false,
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  win.setMenu(null);
  win.setAlwaysOnTop(false);
  win.setSkipTaskbar(true);
  win.setIgnoreMouseEvents(true, { forward: true });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'overlay', 'index.html'));

  win.once('ready-to-show', () => {
    win.showInactive();

    // Configure as overlay via Win32 API
    try {
      const hwnd = win32Wallpaper.bufferToHwnd(win.getNativeWindowHandle());
      win32Wallpaper.setupOverlayWindow(hwnd);

      // Periodic z-order maintenance to keep overlay below app windows
      const timerId = setInterval(() => {
        try {
          if (!win.isDestroyed()) {
            win32Wallpaper.pinOverlayToBottom(hwnd);
          } else {
            clearInterval(timerId);
          }
        } catch { clearInterval(timerId); }
      }, 5000);
      overlayZOrderTimers.set(display.id.toString(), timerId);
    } catch (err) {
      console.error('[WallpaperManager] Overlay setup failed:', err.message);
    }
  });

  // Note: We allow focus so keyboard events reach contenteditable widgets.
  // Z-order is maintained by the periodic pinOverlayToBottom timer.

  return win;
}

/**
 * Destroy all wallpaper windows and overlay windows.
 */
function destroyAllWindows() {
  for (const [id, win] of wallpaperWindows) {
    if (!win.isDestroyed()) {
      try { win32Wallpaper.detachWindow(win); } catch { /* ignore */ }
      win.close();
    }
  }
  wallpaperWindows.clear();

  for (const [id, win] of overlayWindows) {
    if (!win.isDestroyed()) {
      win.close();
    }
  }
  overlayWindows.clear();

  // Clear z-order timers
  for (const [, timerId] of overlayZOrderTimers) {
    clearInterval(timerId);
  }
  overlayZOrderTimers.clear();

  if (spanningWindow && !spanningWindow.isDestroyed()) {
    try { win32Wallpaper.detachWindow(spanningWindow); } catch { /* ignore */ }
    spanningWindow.close();
    spanningWindow = null;
  }
}

/**
 * Apply wallpapers based on current settings.
 */
function applyWallpapers() {
  if (isApplying) return; // Prevent re-entrancy
  isApplying = true;

  destroyAllWindows();

  const mode = settingsStore.getMode();
  const displays = screen.getAllDisplays();

  console.log(`[WallpaperManager] Applying mode="${mode}" with ${displays.length} display(s)`);
  displays.forEach((d, i) => {
    console.log(`[WallpaperManager]   Display ${i}: id=${d.id} bounds=${JSON.stringify(d.bounds)}`);
  });

  if (mode === 'spanning') {
    const config = settingsStore.getGlobalConfig();
    console.log(`[WallpaperManager] Spanning config: path="${config.wallpaperPath}"`);
    if (config.wallpaperPath) {
      // Don't pass widgets to wallpaper window — overlay handles them
      const wallpaperConfig = { ...config, widgets: [] };
      spanningWindow = createSpanningWindow(wallpaperConfig);
    }
    // Create overlay per monitor even in spanning mode
    for (const display of displays) {
      const monitorId = display.id.toString();
      const overlay = createOverlayWindow(display);
      overlayWindows.set(monitorId, overlay);
    }
  } else if (mode === 'same') {
    const globalConfig = settingsStore.getGlobalConfig();
    console.log(`[WallpaperManager] Same config: path="${globalConfig.wallpaperPath}"`);
    if (globalConfig.wallpaperPath) {
      for (const display of displays) {
        const monitorId = display.id.toString();
        // Wallpaper window gets media only, no widgets
        const wallpaperConfig = { ...globalConfig, widgets: [] };
        const win = createWallpaperWindow(display, wallpaperConfig);
        wallpaperWindows.set(monitorId, win);
      }
    }
    // Create overlay per monitor for widgets
    for (const display of displays) {
      const monitorId = display.id.toString();
      const overlay = createOverlayWindow(display);
      overlayWindows.set(monitorId, overlay);
    }
  } else {
    // 'different' mode
    for (const display of displays) {
      const monitorId = display.id.toString();
      const config = settingsStore.getMonitorConfig(monitorId);
      console.log(`[WallpaperManager] Different config for ${monitorId}: path="${config.wallpaperPath}"`);
      if (config.wallpaperPath) {
        // Wallpaper window — media only
        const wallpaperConfig = { ...config, widgets: [] };
        const win = createWallpaperWindow(display, wallpaperConfig);
        wallpaperWindows.set(monitorId, win);
      }
      // Overlay window — widgets
      const overlay = createOverlayWindow(display);
      overlayWindows.set(monitorId, overlay);
    }
  }

  isActive = true;

  // After windows are loaded, push widgets to overlays
  setTimeout(() => {
    sendWidgetsToOverlays();
    broadcastOverlayMode();
    isApplying = false;
  }, 3000);
}

/**
 * Set wallpaper for a specific monitor.
 */
function setMonitorWallpaper(monitorId, config) {
  settingsStore.setMonitorConfig(monitorId, config);

  const existingWin = wallpaperWindows.get(monitorId);
  if (existingWin && !existingWin.isDestroyed()) {
    existingWin.webContents.send('set-wallpaper', config);
  } else if (isActive) {
    const display = screen.getAllDisplays().find((d) => d.id.toString() === monitorId);
    if (display) {
      const win = createWallpaperWindow(display, config);
      wallpaperWindows.set(monitorId, win);
    }
  }
}

/**
 * Set the same wallpaper on all monitors.
 */
function setSameWallpaper(config) {
  settingsStore.setGlobalConfig(config);
  settingsStore.setMode('same');
  applyWallpapers();
}

/**
 * Set spanning wallpaper.
 */
function setSpanningWallpaper(config) {
  settingsStore.setGlobalConfig(config);
  settingsStore.setMode('spanning');
  applyWallpapers();
}

/**
 * Toggle sound for a specific monitor.
 */
function toggleSound(monitorId, enabled) {
  const mode = settingsStore.getMode();

  if (mode === 'spanning' && spanningWindow && !spanningWindow.isDestroyed()) {
    spanningWindow.webContents.send('toggle-sound', enabled);
    settingsStore.setGlobalConfig({ soundEnabled: enabled });
  } else if (mode === 'same') {
    for (const [, win] of wallpaperWindows) {
      if (!win.isDestroyed()) win.webContents.send('toggle-sound', enabled);
    }
    settingsStore.setGlobalConfig({ soundEnabled: enabled });
  } else {
    const win = wallpaperWindows.get(monitorId);
    if (win && !win.isDestroyed()) win.webContents.send('toggle-sound', enabled);
    settingsStore.setMonitorConfig(monitorId, { soundEnabled: enabled });
  }
}

/**
 * Toggle sound for all monitors.
 */
function toggleSoundAll(enabled) {
  for (const [, win] of wallpaperWindows) {
    if (!win.isDestroyed()) win.webContents.send('toggle-sound', enabled);
  }
  if (spanningWindow && !spanningWindow.isDestroyed()) {
    spanningWindow.webContents.send('toggle-sound', enabled);
  }
}

/**
 * Pause or resume all wallpapers.
 */
function togglePause(paused) {
  const message = paused ? 'pause' : 'resume';
  for (const [, win] of wallpaperWindows) {
    if (!win.isDestroyed()) win.webContents.send(message);
  }
  if (spanningWindow && !spanningWindow.isDestroyed()) {
    spanningWindow.webContents.send(message);
  }
}

/**
 * Remove all wallpapers and restore desktop.
 */
function removeAllWallpapers() {
  destroyAllWindows();
  win32Wallpaper.resetDesktop();
  isActive = false;
}

/**
 * Get info about all connected displays with actual dimensions.
 */
function getDisplaysInfo() {
  return screen.getAllDisplays().map((display) => ({
    id: display.id.toString(),
    label: display.label || `Display ${display.id}`,
    bounds: display.bounds,
    workArea: display.workArea,
    size: display.size,           // Physical pixel size
    scaleFactor: display.scaleFactor,
    rotation: display.rotation,
    isPrimary: display.id === screen.getPrimaryDisplay().id,
    // Actual resolution in pixels
    resolutionWidth: display.size.width,
    resolutionHeight: display.size.height,
  }));
}

/**
 * Check if wallpapers are currently active.
 */
function getIsActive() {
  return isActive;
}

/**
 * Setup display change listeners (debounced to prevent loops).
 */
function setupDisplayListeners() {
  const handleDisplayChange = (eventName) => {
    console.log(`[WallpaperManager] ${eventName}`);
    // Debounce: wait 2 seconds before reapplying to prevent loops
    if (displayChangeTimer) {
      clearTimeout(displayChangeTimer);
    }
    displayChangeTimer = setTimeout(() => {
      if (isActive) {
        console.log('[WallpaperManager] Reapplying wallpapers after display change');
        applyWallpapers();
      }
      displayChangeTimer = null;
    }, 2000);
  };

  screen.on('display-added', () => handleDisplayChange('Display added'));
  screen.on('display-removed', () => handleDisplayChange('Display removed'));
  // Don't listen to display-metrics-changed — it fires too often and causes loops
}

/**
 * Send widget configs to each overlay window based on current settings.
 */
function sendWidgetsToOverlays() {
  const mode = settingsStore.getMode();

  for (const [monitorId, overlay] of overlayWindows) {
    if (overlay.isDestroyed()) continue;

    let widgets = [];
    if (mode === 'same' || mode === 'spanning') {
      const monitorConfig = settingsStore.getMonitorConfig(monitorId);
      widgets = monitorConfig.widgets || [];
      // Fallback to global widgets if no per-monitor widgets
      if (widgets.length === 0) {
        const globalConfig = settingsStore.getGlobalConfig();
        widgets = globalConfig.widgets || [];
      }
    } else {
      const config = settingsStore.getMonitorConfig(monitorId);
      widgets = config.widgets || [];
    }

    overlay.webContents.send('set-widgets', widgets);
  }
}

/**
 * Broadcast current draggable/interactive mode to all overlays.
 */
function broadcastOverlayMode() {
  const settings = settingsStore.getAllSettings();
  const mode = {
    draggable: settings.widgetsDraggable !== false,
    interactive: settings.widgetsInteractive !== false,
  };
  for (const [, overlay] of overlayWindows) {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('set-overlay-mode', mode);
    }
  }
}

/**
 * Update widget position in the store after a drag.
 * @param {string} monitorId
 * @param {number} widgetIndex
 * @param {number} x
 * @param {number} y
 */
function updateWidgetPosition(monitorId, widgetIndex, x, y) {
  const mode = settingsStore.getMode();
  let config;
  if (mode === 'same' || mode === 'spanning') {
    config = settingsStore.getMonitorConfig(monitorId);
    if (!config.widgets || config.widgets.length === 0) {
      config = settingsStore.getGlobalConfig();
    }
  } else {
    config = settingsStore.getMonitorConfig(monitorId);
  }

  if (config.widgets && config.widgets[widgetIndex]) {
    config.widgets[widgetIndex].x = x;
    config.widgets[widgetIndex].y = y;
    if (mode === 'same' || mode === 'spanning') {
      settingsStore.setMonitorConfig(monitorId, { widgets: config.widgets });
    } else {
      settingsStore.setMonitorConfig(monitorId, config);
    }
  }
}

/**
 * Get the overlay windows map (for IPC handlers).
 */
function getOverlayWindows() {
  return overlayWindows;
}

module.exports = {
  applyWallpapers,
  setMonitorWallpaper,
  setSameWallpaper,
  setSpanningWallpaper,
  toggleSound,
  toggleSoundAll,
  togglePause,
  removeAllWallpapers,
  destroyAllWindows,
  getDisplaysInfo,
  getIsActive,
  setupDisplayListeners,
  sendWidgetsToOverlays,
  broadcastOverlayMode,
  updateWidgetPosition,
  getOverlayWindows,
};
