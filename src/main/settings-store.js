// ===========================================================================
// Wallpaper Engine – Settings Store
// Persistent JSON-based configuration using electron-store
// ===========================================================================

const Store = require('electron-store');

const schema = {
  mode: {
    type: 'string',
    enum: ['same', 'different', 'spanning'],
    default: 'same',
  },
  monitors: {
    type: 'object',
    default: {},
  },
  globalConfig: {
    type: 'object',
    properties: {
      wallpaperPath: { type: 'string', default: '' },
      wallpaperType: { type: 'string', enum: ['image', 'gif', 'video', 'html', ''], default: '' },
      soundEnabled: { type: 'boolean', default: false },
      interactive: { type: 'boolean', default: false },
      fit: { type: 'string', enum: ['cover', 'contain', 'stretch', 'center'], default: 'cover' },
      loop: { type: 'boolean', default: true },
    },
    default: {
      wallpaperPath: '',
      wallpaperType: '',
      soundEnabled: false,
      interactive: false,
      fit: 'cover',
      loop: true,
    },
  },
  autostart: {
    type: 'boolean',
    default: false,
  },
  interactiveHotkey: {
    type: 'string',
    default: 'Ctrl+Alt+W',
  },
};

const store = new Store({ schema });

// Image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.ico'];
const GIF_EXTENSIONS = ['.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.wmv', '.flv'];
const HTML_EXTENSIONS = ['.html', '.htm'];

/**
 * Detect wallpaper type from file extension.
 * @param {string} filePath
 * @returns {'image'|'gif'|'video'|'html'|''}
 */
function detectWallpaperType(filePath) {
  if (!filePath) return '';
  const ext = require('path').extname(filePath).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (GIF_EXTENSIONS.includes(ext)) return 'gif';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (HTML_EXTENSIONS.includes(ext)) return 'html';
  return '';
}

/**
 * Get the full file filter for the open dialog.
 */
function getFileFilters() {
  return [
    {
      name: 'All Supported',
      extensions: [
        ...IMAGE_EXTENSIONS,
        ...GIF_EXTENSIONS,
        ...VIDEO_EXTENSIONS,
        ...HTML_EXTENSIONS,
      ].map((e) => e.slice(1)),
    },
    { name: 'Images', extensions: IMAGE_EXTENSIONS.map((e) => e.slice(1)) },
    { name: 'GIF', extensions: GIF_EXTENSIONS.map((e) => e.slice(1)) },
    { name: 'Videos', extensions: VIDEO_EXTENSIONS.map((e) => e.slice(1)) },
    { name: 'HTML', extensions: HTML_EXTENSIONS.map((e) => e.slice(1)) },
    { name: 'All Files', extensions: ['*'] },
  ];
}

/**
 * Get the current mode.
 */
function getMode() {
  return store.get('mode');
}

/**
 * Set the wallpaper mode.
 * @param {'same'|'different'|'spanning'} mode
 */
function setMode(mode) {
  store.set('mode', mode);
}

/**
 * Get config for a specific monitor.
 * @param {string} monitorId
 */
function getMonitorConfig(monitorId) {
  const monitors = store.get('monitors');
  return monitors[monitorId] || {
    wallpaperPath: '',
    wallpaperType: '',
    soundEnabled: false,
    interactive: false,
    fit: 'cover',
    loop: true,
  };
}

/**
 * Set config for a specific monitor.
 * @param {string} monitorId
 * @param {object} config
 */
function setMonitorConfig(monitorId, config) {
  const monitors = store.get('monitors');
  monitors[monitorId] = { ...getMonitorConfig(monitorId), ...config };
  store.set('monitors', monitors);
}

/**
 * Get global config (used for 'same' and 'spanning' modes).
 */
function getGlobalConfig() {
  return store.get('globalConfig');
}

/**
 * Set global config.
 * @param {object} config
 */
function setGlobalConfig(config) {
  const current = store.get('globalConfig');
  store.set('globalConfig', { ...current, ...config });
}

/**
 * Get full settings object.
 */
function getAllSettings() {
  return {
    mode: store.get('mode'),
    monitors: store.get('monitors'),
    globalConfig: store.get('globalConfig'),
    autostart: store.get('autostart'),
    interactiveHotkey: store.get('interactiveHotkey'),
  };
}

/**
 * Get autostart setting.
 */
function getAutostart() {
  return store.get('autostart');
}

/**
 * Set autostart setting.
 * @param {boolean} enabled
 */
function setAutostart(enabled) {
  store.set('autostart', enabled);
}

module.exports = {
  store,
  detectWallpaperType,
  getFileFilters,
  getMode,
  setMode,
  getMonitorConfig,
  setMonitorConfig,
  getGlobalConfig,
  setGlobalConfig,
  getAllSettings,
  getAutostart,
  setAutostart,
};
