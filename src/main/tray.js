// ===========================================================================
// DeskX: Wallpaper Engine – System Tray
// Manages the system tray icon and context menu
// ===========================================================================

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let isPaused = false;
let isMuted = true;

/**
 * Create the system tray icon and menu.
 * @param {object} callbacks
 * @param {Function} callbacks.onOpenSettings
 * @param {Function} callbacks.onTogglePause
 * @param {Function} callbacks.onToggleMute
 * @param {Function} callbacks.onRemoveWallpapers
 * @param {Function} callbacks.onQuit
 */
function createTray(callbacks) {
  // Create a simple icon (16x16 colored square)
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  
  // Try to load the icon, fallback to a generated one
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) throw new Error('Empty icon');
  } catch {
    // Generate a simple 16x16 icon
    icon = nativeImage.createEmpty();
    // Use a basic data URL icon as fallback
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      // Create a gradient purple-blue icon
      const x = i % size;
      const y = Math.floor(i / size);
      const r = Math.floor(100 + (x / size) * 80);
      const g = Math.floor(50 + (y / size) * 60);
      const b = Math.floor(180 + (x / size) * 75);
      canvas[i * 4] = r;     // R
      canvas[i * 4 + 1] = g; // G
      canvas[i * 4 + 2] = b; // B
      canvas[i * 4 + 3] = 255; // A
    }
    icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  }

  tray = new Tray(icon);
  tray.setToolTip('DeskX: Wallpaper Engine');

  updateMenu(callbacks);

  // Double-click opens settings
  tray.on('double-click', () => {
    callbacks.onOpenSettings();
  });

  return tray;
}

/**
 * Update the tray context menu.
 */
function updateMenu(callbacks) {
  if (!tray) return;

  const menu = Menu.buildFromTemplate([
    {
      label: '⚙️  Open Settings',
      click: () => callbacks.onOpenSettings(),
    },
    { type: 'separator' },
    {
      label: isPaused ? '▶️  Resume Wallpaper' : '⏸️  Pause Wallpaper',
      click: () => {
        isPaused = !isPaused;
        callbacks.onTogglePause(isPaused);
        updateMenu(callbacks);
      },
    },
    {
      label: isMuted ? '🔊  Unmute All' : '🔇  Mute All',
      click: () => {
        isMuted = !isMuted;
        callbacks.onToggleMute(isMuted);
        updateMenu(callbacks);
      },
    },
    { type: 'separator' },
    {
      label: '🗑️  Remove All Wallpapers',
      click: () => callbacks.onRemoveWallpapers(),
    },
    { type: 'separator' },
    {
      label: '❌  Quit',
      click: () => callbacks.onQuit(),
    },
  ]);

  tray.setContextMenu(menu);
}

/**
 * Destroy the tray icon.
 */
function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = {
  createTray,
  destroyTray,
};
