// ===========================================================================
// DeskX: Wallpaper Engine – Main Process Entry Point
// ===========================================================================

const { app, BrowserWindow, ipcMain, dialog, globalShortcut, screen } = require('electron');
const path = require('path');

// ── Squirrel Startup Events (required for installer/updater) ────────────
// Squirrel launches the app with --squirrel-* args during install/update/uninstall.
// We must handle these and quit immediately, or the installer will hang.
// Note: --squirrel-firstrun is a normal launch flag, NOT an install event.
if (process.platform === 'win32') {
  const squirrelEvents = ['--squirrel-install', '--squirrel-updated', '--squirrel-uninstall', '--squirrel-obsolete'];
  const squirrelArg = process.argv.find(arg => squirrelEvents.includes(arg));
  if (squirrelArg) {
    const { spawn } = require('child_process');
    const updateDotExe = path.resolve(
      path.dirname(process.execPath), '..', 'Update.exe'
    );

    const spawnUpdate = (args) => {
      try {
        spawn(updateDotExe, args, { detached: true });
      } catch (e) {
        // Update.exe not found — ignore
      }
    };

    switch (squirrelArg) {
      case '--squirrel-install':
      case '--squirrel-updated':
        spawnUpdate(['--createShortcut', path.basename(process.execPath)]);
        break;
      case '--squirrel-uninstall':
        spawnUpdate(['--removeShortcut', path.basename(process.execPath)]);
        break;
    }

    // Exit immediately — Squirrel will relaunch after install/update
    setTimeout(() => app.quit(), 1000);
    return;
  }
}

const wallpaperManager = require('./wallpaper-manager');
const settingsStore = require('./settings-store');
const trayModule = require('./tray');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Main] Another instance is running — quitting.');
  app.quit();
  return;
}

let settingsWindow = null;

// ── Settings Window ─────────────────────────────────────────────────────

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a1a',
    show: false,
    resizable: true,
    icon: path.join(__dirname, '..', '..', 'assets', 'DeskXLogo.png'),
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.setMenu(null);
  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings', 'index.html'));

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// ── IPC Handlers ────────────────────────────────────────────────────────

function setupIPC() {
  ipcMain.handle('get-displays', () => {
    return wallpaperManager.getDisplaysInfo();
  });

  ipcMain.handle('get-settings', () => {
    return settingsStore.getAllSettings();
  });

  ipcMain.handle('set-mode', (_, mode) => {
    settingsStore.setMode(mode);
    return true;
  });

  ipcMain.handle('set-global-config', (_, config) => {
    // Auto-detect wallpaper type
    if (config.wallpaperPath) {
      config.wallpaperType = settingsStore.detectWallpaperType(config.wallpaperPath);
    }
    settingsStore.setGlobalConfig(config);
    return settingsStore.getAllSettings();
  });

  ipcMain.handle('set-monitor-config', (_, monitorId, config) => {
    if (config.wallpaperPath) {
      config.wallpaperType = settingsStore.detectWallpaperType(config.wallpaperPath);
    }
    settingsStore.setMonitorConfig(monitorId, config);
    return settingsStore.getAllSettings();
  });

  ipcMain.handle('apply-wallpapers', () => {
    wallpaperManager.applyWallpapers();
    return true;
  });

  ipcMain.handle('remove-wallpapers', () => {
    wallpaperManager.removeAllWallpapers();
    return true;
  });

  ipcMain.handle('toggle-sound-monitor', (_, monitorId, enabled) => {
    wallpaperManager.toggleSound(monitorId, enabled);
    return true;
  });

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(settingsWindow, {
      title: 'Select Wallpaper',
      filters: settingsStore.getFileFilters(),
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const wallpaperType = settingsStore.detectWallpaperType(filePath);
      return { filePath, wallpaperType };
    }
    return null;
  });

  ipcMain.handle('set-autostart', (_, enabled) => {
    settingsStore.setAutostart(enabled);
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
    });
    return true;
  });

  // Window control IPC (for frameless window)
  ipcMain.handle('window-minimize', () => {
    if (settingsWindow) settingsWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (settingsWindow) {
      if (settingsWindow.isMaximized()) {
        settingsWindow.unmaximize();
      } else {
        settingsWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (settingsWindow) settingsWindow.close();
  });

  // --- Overlay IPC Handlers ---

  // Hit-test: toggle click-through on overlay window
  ipcMain.on('overlay:hit-test', (event, isHit) => {
    // Find which overlay sent this
    const overlayWindows = wallpaperManager.getOverlayWindows();
    for (const [monitorId, overlay] of overlayWindows) {
      if (!overlay.isDestroyed() && overlay.webContents === event.sender) {
        try {
          const hwnd = require('./win32-wallpaper').bufferToHwnd(overlay.getNativeWindowHandle());
          if (isHit) {
            // Mouse is over a widget — allow clicks
            overlay.setIgnoreMouseEvents(false);
            require('./win32-wallpaper').setWindowClickThrough(hwnd, false);
          } else {
            // Mouse is over empty space — pass clicks through
            overlay.setIgnoreMouseEvents(true, { forward: true });
            require('./win32-wallpaper').setWindowClickThrough(hwnd, true);
          }
        } catch (err) {
          console.error('[Main] Hit-test toggle failed:', err.message);
        }
        break;
      }
    }
  });

  // Request keyboard focus for overlay (e.g., contenteditable widget)
  ipcMain.on('overlay:request-focus', (event) => {
    const overlayWindows = wallpaperManager.getOverlayWindows();
    for (const [, overlay] of overlayWindows) {
      if (!overlay.isDestroyed() && overlay.webContents === event.sender) {
        overlay.focus();
        break;
      }
    }
  });

  // Release keyboard focus from overlay
  ipcMain.on('overlay:release-focus', (event) => {
    const overlayWindows = wallpaperManager.getOverlayWindows();
    for (const [, overlay] of overlayWindows) {
      if (!overlay.isDestroyed() && overlay.webContents === event.sender) {
        overlay.blur();
        break;
      }
    }
  });

  // Widget moved via drag on desktop
  ipcMain.on('overlay:widget-moved', (event, index, x, y) => {
    const overlayWindows = wallpaperManager.getOverlayWindows();
    for (const [monitorId, overlay] of overlayWindows) {
      if (!overlay.isDestroyed() && overlay.webContents === event.sender) {
        wallpaperManager.updateWidgetPosition(monitorId, index, x, y);
        break;
      }
    }
  });

  // Widget config changed via interaction (e.g., clock toggled 12h)
  ipcMain.on('overlay:widget-config-changed', (event, index, config) => {
    const overlayWindows = wallpaperManager.getOverlayWindows();
    for (const [monitorId, overlay] of overlayWindows) {
      if (!overlay.isDestroyed() && overlay.webContents === event.sender) {
        const mode = settingsStore.getMode();
        const monitorConfig = settingsStore.getMonitorConfig(monitorId);
        if (monitorConfig.widgets && monitorConfig.widgets[index]) {
          monitorConfig.widgets[index] = { ...monitorConfig.widgets[index], ...config };
          settingsStore.setMonitorConfig(monitorId, { widgets: monitorConfig.widgets });
        }
        break;
      }
    }
  });

  // Draggable toggle
  ipcMain.handle('set-widgets-draggable', (_, enabled) => {
    settingsStore.store.set('widgetsDraggable', enabled);
    wallpaperManager.broadcastOverlayMode();
    return true;
  });

  // Interactive toggle
  ipcMain.handle('set-widgets-interactive', (_, enabled) => {
    settingsStore.store.set('widgetsInteractive', enabled);
    wallpaperManager.broadcastOverlayMode();
    return true;
  });
}

// ── App Lifecycle ───────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Setup IPC handlers
  setupIPC();

  // Setup display change listeners
  wallpaperManager.setupDisplayListeners();

  // Create system tray
  trayModule.createTray({
    onOpenSettings: createSettingsWindow,
    onTogglePause: (paused) => wallpaperManager.togglePause(paused),
    onToggleMute: (muted) => wallpaperManager.toggleSoundAll(!muted),
    onRemoveWallpapers: () => wallpaperManager.removeAllWallpapers(),
    onToggleWidgetsLocked: (draggable) => {
      settingsStore.store.set('widgetsDraggable', draggable);
      wallpaperManager.broadcastOverlayMode();
    },
    onToggleWidgetsInteractive: (interactive) => {
      settingsStore.store.set('widgetsInteractive', interactive);
      wallpaperManager.broadcastOverlayMode();
    },
    onQuit: () => {
      wallpaperManager.removeAllWallpapers();
      trayModule.destroyTray();
      app.quit();
    },
  });

  // Register global shortcut for interactive toggle
  try {
    globalShortcut.register('Ctrl+Alt+W', () => {
      // Toggle interactive mode for all HTML wallpapers
      console.log('[Main] Interactive toggle shortcut pressed');
    });
  } catch (err) {
    console.warn('[Main] Failed to register global shortcut:', err);
  }

  // Restore wallpapers from saved settings
  const settings = settingsStore.getAllSettings();
  const hasWallpaper = settings.mode === 'different'
    ? Object.values(settings.monitors).some((m) => m.wallpaperPath)
    : settings.globalConfig.wallpaperPath;

  if (hasWallpaper) {
    console.log('[Main] Restoring wallpapers from saved settings');
    wallpaperManager.applyWallpapers();
  }

  // Open settings window on first launch
  createSettingsWindow();

  // Handle autostart
  if (settings.autostart) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
    });
  }
});

// Keep running in tray when all windows are closed
app.on('window-all-closed', (e) => {
  // Don't quit — keep running in system tray
  // Only quit via tray menu
});

// Handle second instance
app.on('second-instance', () => {
  createSettingsWindow();
});

// Cleanup on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  wallpaperManager.destroyAllWindows();
});

app.on('before-quit', () => {
  trayModule.destroyTray();
});
