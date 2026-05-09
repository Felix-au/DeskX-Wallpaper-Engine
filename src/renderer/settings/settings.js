// ===========================================================================
// Wallpaper Engine – Settings UI Logic
// ===========================================================================

const API = window.wallpaperAPI;

// ── State ─────────────────────────────────────────────────────────────

let displays = [];
let settings = null;
let selectedMonitorId = null;
let selectedMonitorIndex = 0;
let currentMode = 'same';
let currentFile = null;
let currentImageUrl = null;
let mediaDimensions = null; // { w, h } — natural dims of current wallpaper
let videoThumbnailUrl = null; // data URL captured from video frame

// ── DOM References ────────────────────────────────────────────────────

const monitorLayout = document.getElementById('monitor-layout');
const monitorInfo = document.getElementById('monitor-info');
const modeBtns = document.querySelectorAll('.mode-btn');

const dropZone = document.getElementById('drop-zone');
const btnBrowse = document.getElementById('btn-browse');
const btnChange = document.getElementById('btn-change');
const btnApply = document.getElementById('btn-apply');
const btnRemove = document.getElementById('btn-remove');

const previewContainer = document.getElementById('preview-container');
const previewArea = document.getElementById('preview-area');
const previewFilename = document.getElementById('preview-filename');
const previewTypeBadge = document.getElementById('preview-type-badge');

const panelOptions = document.getElementById('panel-options');
const dimInfo = document.getElementById('dim-info');
const optFitGroup = document.getElementById('opt-fit-group');
const optSoundGroup = document.getElementById('opt-sound-group');
const optLoopGroup = document.getElementById('opt-loop-group');
const optInteractiveGroup = document.getElementById('opt-interactive-group');

const toggleSound = document.getElementById('toggle-sound');
const toggleLoop = document.getElementById('toggle-loop');
const toggleInteractive = document.getElementById('toggle-interactive');
const toggleAutostart = document.getElementById('toggle-autostart');

const panelTitleText = document.getElementById('panel-title-text');
const selectedMonitorBadge = document.getElementById('selected-monitor-badge');
const statusText = document.getElementById('status-text');

const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');

// ── Initialize ────────────────────────────────────────────────────────

async function init() {
  try {
    displays = await API.getDisplays();
    settings = await API.getSettings();
    currentMode = settings.mode || 'same';
    renderMonitors();
    renderMonitorInfo();
    updateModeUI();
    if (displays.length > 0) selectMonitor(displays[0].id, 0);
    loadCurrentConfig();
    updateAutostartUI();
    setStatus('Ready');
  } catch (err) {
    console.error('[Settings] Init error:', err);
    setStatus('Error initializing', 'error');
  }
}

// ── Monitor Layout ────────────────────────────────────────────────────

function renderMonitors() {
  monitorLayout.innerHTML = '';
  if (displays.length === 0) {
    monitorLayout.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">No displays detected</span>';
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of displays) {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  }
  const totalW = maxX - minX, totalH = maxY - minY;
  const scale = Math.min(200 / totalW, 100 / totalH) * 0.85;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `position:relative;width:${totalW * scale}px;height:${totalH * scale}px;`;

  displays.forEach((display, index) => {
    const rect = document.createElement('div');
    rect.className = 'monitor-rect';
    rect.dataset.monitorId = display.id;
    rect.style.cssText = `position:absolute;left:${(display.bounds.x - minX) * scale}px;top:${(display.bounds.y - minY) * scale}px;width:${display.bounds.width * scale}px;height:${display.bounds.height * scale}px;`;

    const label = document.createElement('span');
    label.className = 'monitor-label';
    label.textContent = display.isPrimary ? '★' : (index + 1);
    rect.appendChild(label);

    const num = document.createElement('span');
    num.textContent = index + 1;
    rect.appendChild(num);

    if (selectedMonitorId === display.id) rect.classList.add('selected');
    const mc = settings.monitors[display.id];
    if (mc && mc.wallpaperPath) rect.classList.add('has-wallpaper');

    rect.addEventListener('click', () => selectMonitor(display.id, index));
    wrapper.appendChild(rect);
  });

  monitorLayout.style.flexDirection = 'column';
  monitorLayout.appendChild(wrapper);
}

function renderMonitorInfo() {
  monitorInfo.innerHTML = '';
  displays.forEach((display, index) => {
    const item = document.createElement('div');
    item.className = 'monitor-info-item';
    const dotClass = display.isPrimary ? 'primary' : 'secondary';
    const label = display.isPrimary ? `★ Monitor ${index + 1}` : `Monitor ${index + 1}`;
    item.innerHTML = `
      <span class="monitor-info-label"><span class="dot ${dotClass}"></span>${label}</span>
      <span class="monitor-info-value">${display.resolutionWidth}×${display.resolutionHeight}</span>`;
    monitorInfo.appendChild(item);
  });
}

function selectMonitor(monitorId, index) {
  selectedMonitorId = monitorId;
  selectedMonitorIndex = index;
  document.querySelectorAll('.monitor-rect').forEach(el => {
    el.classList.toggle('selected', el.dataset.monitorId === monitorId);
  });
  selectedMonitorBadge.textContent = `Monitor ${index + 1}`;
  selectedMonitorBadge.style.display = currentMode === 'different' ? 'inline-block' : 'none';
  if (currentMode === 'different') loadMonitorConfig(monitorId);
}

// ── Mode Selection ────────────────────────────────────────────────────

function updateModeUI() {
  modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === currentMode));
  if (currentMode === 'same') {
    panelTitleText.textContent = 'Wallpaper — All Monitors';
    selectedMonitorBadge.style.display = 'none';
  } else if (currentMode === 'spanning') {
    panelTitleText.textContent = 'Wallpaper — Spanning';
    selectedMonitorBadge.style.display = 'none';
  } else {
    panelTitleText.textContent = 'Wallpaper';
    if (selectedMonitorId) {
      selectedMonitorBadge.textContent = `Monitor ${selectedMonitorIndex + 1}`;
      selectedMonitorBadge.style.display = 'inline-block';
    }
  }
}

modeBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    currentMode = btn.dataset.mode;
    updateModeUI();
    await API.setMode(currentMode);
    settings = await API.getSettings();
    loadCurrentConfig();
  });
});

// ── Config Loading ────────────────────────────────────────────────────

function loadCurrentConfig() {
  if (currentMode === 'different' && selectedMonitorId) {
    loadMonitorConfig(selectedMonitorId);
  } else {
    loadGlobalConfig();
  }
}

function loadGlobalConfig() {
  const config = settings.globalConfig;
  if (config && config.wallpaperPath) {
    currentFile = { filePath: config.wallpaperPath, wallpaperType: config.wallpaperType };
    showPreview(config);
    showOptions(config);
  } else { currentFile = null; hidePreview(); hideOptions(); }
}

function loadMonitorConfig(monitorId) {
  const config = settings.monitors[monitorId];
  if (config && config.wallpaperPath) {
    currentFile = { filePath: config.wallpaperPath, wallpaperType: config.wallpaperType };
    showPreview(config);
    showOptions(config);
  } else { currentFile = null; hidePreview(); hideOptions(); }
}

// ── File Selection ────────────────────────────────────────────────────

async function browseFile() {
  const result = await API.openFileDialog();
  if (result) {
    currentFile = result;
    const config = buildConfig(result);
    showPreview(config);
    showOptions(config);
    await saveConfig(config);
  }
}

function buildConfig(file) {
  return {
    wallpaperPath: file.filePath,
    wallpaperType: file.wallpaperType,
    soundEnabled: toggleSound.checked,
    interactive: toggleInteractive.checked,
    loop: toggleLoop.checked,
    fit: getSelectedFit(),
  };
}

function getSelectedFit() {
  const active = document.querySelector('.fit-preview-item.active');
  return active ? active.dataset.fit : 'cover';
}

async function saveConfig(config) {
  try {
    if (currentMode === 'different' && selectedMonitorId) {
      settings = await API.setMonitorConfig(selectedMonitorId, config);
    } else {
      settings = await API.setGlobalConfig(config);
    }
    renderMonitors();
  } catch (err) {
    console.error('[Settings] Save failed:', err);
    setStatus('Failed to save config', 'error');
  }
}

// ── Preview ───────────────────────────────────────────────────────────

function filePathToUrl(fp) { return `file:///${fp.replace(/\\/g, '/')}`; }

function showPreview(config) {
  dropZone.style.display = 'none';
  previewContainer.style.display = 'block';

  const filename = config.wallpaperPath.split(/[\\/]/).pop();
  previewFilename.textContent = filename;
  previewTypeBadge.textContent = config.wallpaperType.toUpperCase();
  previewTypeBadge.className = `type-badge type-${config.wallpaperType}`;

  currentImageUrl = filePathToUrl(config.wallpaperPath);
  videoThumbnailUrl = null;
  mediaDimensions = null;

  previewArea.innerHTML = '';

  switch (config.wallpaperType) {
    case 'image':
    case 'gif': {
      const img = document.createElement('img');
      img.src = currentImageUrl;
      img.alt = filename;
      img.draggable = false;
      img.onload = () => {
        mediaDimensions = { w: img.naturalWidth, h: img.naturalHeight };
        updateFitPreview();
      };
      previewArea.appendChild(img);
      break;
    }
    case 'video': {
      const video = document.createElement('video');
      video.src = currentImageUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.controls = false;

      // Show dimensional template immediately with estimated 16:9 ratio
      mediaDimensions = { w: 1920, h: 1080 };
      updateFitPreview(); // Show template right away

      video.onloadedmetadata = () => {
        mediaDimensions = { w: video.videoWidth, h: video.videoHeight };
        updateFitPreview(); // Update template with actual dimensions
      };

      // Capture a thumbnail frame once the video can play
      video.addEventListener('canplay', () => {
        captureVideoThumbnail(video);
      }, { once: true });

      previewArea.appendChild(video);
      break;
    }
    case 'html': {
      const iframe = document.createElement('iframe');
      iframe.src = currentImageUrl;
      iframe.sandbox = 'allow-scripts allow-same-origin';
      previewArea.appendChild(iframe);
      const monitor = getSelectedDisplay();
      if (monitor) {
        mediaDimensions = { w: monitor.resolutionWidth, h: monitor.resolutionHeight };
        updateFitPreview();
      }
      break;
    }
    default:
      previewArea.innerHTML = `<span style="color:var(--text-muted);">Preview not available</span>`;
  }
}

/**
 * Capture a single frame from the video as a data URL thumbnail.
 */
function captureVideoThumbnail(video) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    videoThumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
    updateFitPreview(); // Re-render with actual thumbnail
  } catch (e) {
    console.warn('[Settings] Could not capture video thumbnail:', e);
  }
}

function hidePreview() {
  dropZone.style.display = 'block';
  previewContainer.style.display = 'none';
  previewArea.innerHTML = '';
  currentImageUrl = null;
  videoThumbnailUrl = null;
  mediaDimensions = null;
}

// ── Fit Preview Visualization ─────────────────────────────────────────

function getSelectedDisplay() {
  if (selectedMonitorId) return displays.find(d => d.id === selectedMonitorId);
  return displays[0] || null;
}

/**
 * Render the fit preview for all 4 modes.
 * Uses the actual image for images/gifs, a captured thumbnail for videos,
 * and a hatched dimensional template as fallback.
 */
function updateFitPreview() {
  const monitor = getSelectedDisplay();
  if (!monitor || !mediaDimensions) return;

  const monW = monitor.resolutionWidth;
  const monH = monitor.resolutionHeight;
  const imgW = mediaDimensions.w;
  const imgH = mediaDimensions.h;

  // Show dimension info
  dimInfo.textContent = `${monW}×${monH} ← ${imgW}×${imgH}`;
  dimInfo.style.display = 'inline-block';

  const imgAspect = imgW / imgH;
  const monAspect = monW / monH;

  // Determine which image source to use for the preview
  const hasRealThumb = videoThumbnailUrl || (currentFile && currentFile.wallpaperType !== 'video' && currentFile.wallpaperType !== 'html');
  const thumbUrl = videoThumbnailUrl || currentImageUrl;

  const fitModes = ['cover', 'contain', 'stretch', 'center'];
  const currentFit = getSelectedFit();

  fitModes.forEach(mode => {
    const previewMon = document.getElementById(`fit-vis-${mode}`);
    if (!previewMon) return;

    const imageEl = previewMon.querySelector('.fit-preview-image');
    const templateEl = previewMon.querySelector('.fit-template');
    if (!imageEl || !templateEl) return;

    // Set monitor aspect ratio
    previewMon.style.aspectRatio = `${monW} / ${monH}`;

    // Calculate image rect as percentages
    let iLeft, iTop, iWidth, iHeight;

    switch (mode) {
      case 'cover':
        if (imgAspect > monAspect) {
          iHeight = 100; iWidth = (imgAspect / monAspect) * 100;
          iTop = 0; iLeft = -(iWidth - 100) / 2;
        } else {
          iWidth = 100; iHeight = (monAspect / imgAspect) * 100;
          iLeft = 0; iTop = -(iHeight - 100) / 2;
        }
        break;
      case 'contain':
        if (imgAspect > monAspect) {
          iWidth = 100; iHeight = (monAspect / imgAspect) * 100;
          iLeft = 0; iTop = (100 - iHeight) / 2;
        } else {
          iHeight = 100; iWidth = (imgAspect / monAspect) * 100;
          iTop = 0; iLeft = (100 - iWidth) / 2;
        }
        break;
      case 'stretch':
        iLeft = 0; iTop = 0; iWidth = 100; iHeight = 100;
        break;
      case 'center':
        iWidth = Math.min((imgW / monW) * 100, 200);
        iHeight = Math.min((imgH / monH) * 100, 200);
        iLeft = (100 - iWidth) / 2;
        iTop = (100 - iHeight) / 2;
        break;
    }

    const posStyle = `left:${iLeft}%;top:${iTop}%;width:${iWidth}%;height:${iHeight}%;`;

    // Always show the dimensional template
    templateEl.style.cssText = posStyle;

    // Show the actual image/thumbnail if available
    if (hasRealThumb && thumbUrl) {
      imageEl.style.cssText = posStyle + `background-image:url("${thumbUrl}");background-size:100% 100%;background-repeat:no-repeat;`;
      previewMon.classList.add('has-thumb');
    } else {
      imageEl.style.cssText = posStyle;
      previewMon.classList.remove('has-thumb');
    }

    // Highlight the active mode
    const item = previewMon.closest('.fit-preview-item');
    if (item) item.classList.toggle('active', mode === currentFit);
  });
}

// ── Options ───────────────────────────────────────────────────────────

function showOptions(config) {
  panelOptions.style.display = 'block';

  const isVideo = config.wallpaperType === 'video';
  const isHTML = config.wallpaperType === 'html';
  const isMedia = ['image', 'gif', 'video'].includes(config.wallpaperType);

  optFitGroup.style.display = isMedia ? 'flex' : 'none';
  optSoundGroup.style.display = isVideo ? 'flex' : 'none';
  optLoopGroup.style.display = isVideo ? 'flex' : 'none';
  optInteractiveGroup.style.display = isHTML ? 'flex' : 'none';

  toggleSound.checked = config.soundEnabled || false;
  toggleLoop.checked = config.loop !== false;
  toggleInteractive.checked = config.interactive || false;

  // Highlight current fit in preview grid
  document.querySelectorAll('.fit-preview-item').forEach(item => {
    item.classList.toggle('active', item.dataset.fit === (config.fit || 'cover'));
  });
}

function hideOptions() {
  panelOptions.style.display = 'none';
  if (dimInfo) dimInfo.style.display = 'none';
}

// ── Event Handlers ────────────────────────────────────────────────────

btnBrowse.addEventListener('click', e => { e.stopPropagation(); browseFile(); });
btnChange.addEventListener('click', browseFile);
dropZone.addEventListener('click', browseFile);

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    let wallpaperType = '';
    if (['png','jpg','jpeg','webp','bmp','tiff','ico'].includes(ext)) wallpaperType = 'image';
    else if (ext === 'gif') wallpaperType = 'gif';
    else if (['mp4','webm','mkv','avi','mov','wmv','flv'].includes(ext)) wallpaperType = 'video';
    else if (['html','htm'].includes(ext)) wallpaperType = 'html';
    if (wallpaperType) {
      currentFile = { filePath: file.path, wallpaperType };
      const config = buildConfig(currentFile);
      showPreview(config);
      showOptions(config);
      saveConfig(config);
    }
  }
});

// Fit preview items — click to select fit mode
function onFitChange(fit) {
  document.querySelectorAll('.fit-preview-item').forEach(i => i.classList.toggle('active', i.dataset.fit === fit));
  if (currentFile) saveConfig(buildConfig(currentFile));
}

document.querySelectorAll('.fit-preview-item').forEach(item => {
  item.addEventListener('click', () => onFitChange(item.dataset.fit));
});

// Toggle handlers
toggleSound.addEventListener('change', () => { if (currentFile) saveConfig(buildConfig(currentFile)); });
toggleLoop.addEventListener('change', () => { if (currentFile) saveConfig(buildConfig(currentFile)); });
toggleInteractive.addEventListener('change', () => { if (currentFile) saveConfig(buildConfig(currentFile)); });
toggleAutostart.addEventListener('change', () => API.setAutostart(toggleAutostart.checked));

// Apply
btnApply.addEventListener('click', async () => {
  setStatus('Applying wallpaper...', 'active');
  try {
    await API.setMode(currentMode);
    await API.applyWallpapers();
    setStatus('Wallpaper applied!', 'active');
    setTimeout(() => setStatus('Active', 'active'), 2000);
  } catch (err) {
    setStatus('Failed to apply wallpaper', 'error');
    console.error(err);
  }
});

// Remove
btnRemove.addEventListener('click', async () => {
  try { await API.removeWallpapers(); setStatus('Wallpapers removed'); }
  catch (err) { setStatus('Failed to remove wallpapers', 'error'); }
});

// Titlebar
btnMinimize.addEventListener('click', () => API.windowMinimize());
btnMaximize.addEventListener('click', () => API.windowMaximize());
btnClose.addEventListener('click', () => API.windowClose());

// ── Utilities ─────────────────────────────────────────────────────────

function updateAutostartUI() {
  if (settings) toggleAutostart.checked = settings.autostart || false;
}

function setStatus(text, type = '') {
  statusText.textContent = text;
  statusText.className = `status-text ${type}`;
}

// ── Start ─────────────────────────────────────────────────────────────

init();
