// ===========================================================================
// DeskX: Wallpaper Engine – Settings UI Logic
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

// Widget State
let selectedWidgetIndex = null;
let selectedWidgetMonitorId = null;
let isDragging = false;
let editorScaleFactor = 0.25;
let dragStartX, dragStartY;
let widgetStartX, widgetStartY;

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
const panelWidgets = document.getElementById('panel-widgets');
const dimInfo = document.getElementById('dim-info');
const optFitGroup = document.getElementById('opt-fit-group');
const optSoundGroup = document.getElementById('opt-sound-group');
const optLoopGroup = document.getElementById('opt-loop-group');

const toggleSound = document.getElementById('toggle-sound');
const toggleLoop = document.getElementById('toggle-loop');
const toggleAutostart = document.getElementById('toggle-autostart');

const panelTitleText = document.getElementById('panel-title-text');
const selectedMonitorBadge = document.getElementById('selected-monitor-badge');
const statusText = document.getElementById('status-text');

const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');

// Widgets DOM
const btnAddWidget = document.getElementById('btn-add-widget');
const widgetEditorCanvasesWrapper = document.getElementById('widget-editor-canvases-wrapper');
const widgetInspector = document.getElementById('widget-inspector');
const inspectorContent = document.getElementById('inspector-content');
const btnDeleteWidget = document.getElementById('btn-delete-widget');
const widgetPickerModal = document.getElementById('widget-picker-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const widgetTypeItems = document.querySelectorAll('.widget-type-item');

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
    initWidgetEvents();
    
    document.getElementById('nav-widgets-btn').addEventListener('click', () => {
      panelWidgets.scrollIntoView({ behavior: 'smooth' });
    });

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
    renderWidgetEditor();
  } else { 
    currentFile = null; 
    hidePreview(); 
    hideOptions(); 
    renderWidgetEditor();
  }
}

function loadMonitorConfig(monitorId) {
  const config = settings.monitors[monitorId];
  if (config && config.wallpaperPath) {
    currentFile = { filePath: config.wallpaperPath, wallpaperType: config.wallpaperType };
    showPreview(config);
    showOptions(config);
    renderWidgetEditor();
  } else { 
    currentFile = null; 
    hidePreview(); 
    hideOptions(); 
    // Even if no wallpaper, show widgets editor if there's a monitor selected
    renderWidgetEditor();
  }
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
    renderWidgetEditor();
  }
}

function buildConfig(file) {
  return {
    wallpaperPath: file.filePath,
    wallpaperType: file.wallpaperType,
    soundEnabled: toggleSound.checked,
    interactive: file.wallpaperType === 'html', // HTML is always interactive
    loop: toggleLoop.checked,
    fit: getSelectedFit(),
    widgets: currentMode === 'different' || currentMode === 'spanning' ? getWidgetsFromEditor() : [],
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
        // Generate a white "visible area" preview at the video's native dimensions
        generateVideoAreaPreview(video.videoWidth, video.videoHeight);
        updateFitPreview();
      };

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
 * Generate a white canvas at the video's dimensions with "Visible area" text.
 * This gives the user a clear dimensional reference for how each fit mode
 * will crop or pad the video on their monitor.
 */
function generateVideoAreaPreview(vidW, vidH) {
  try {
    // Scale down for the data URL but keep aspect ratio
    const maxDim = 400;
    const scale = Math.min(maxDim / vidW, maxDim / vidH, 1);
    const cW = Math.round(vidW * scale);
    const cH = Math.round(vidH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = cW;
    canvas.height = cH;
    const ctx = canvas.getContext('2d');

    // White fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cW, cH);

    // Subtle border
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, cW - 1, cH - 1);

    // Label text
    const fontSize = Math.max(10, Math.round(cH * 0.08));
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Visible area', cW / 2, cH / 2 - fontSize * 0.6);

    // Dimension sub-label
    const subSize = Math.max(8, Math.round(cH * 0.055));
    ctx.font = `400 ${subSize}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillText(`${vidW} × ${vidH}`, cW / 2, cH / 2 + fontSize * 0.6);

    videoThumbnailUrl = canvas.toDataURL('image/png');
  } catch (e) {
    console.warn('[Settings] Could not generate video area preview:', e);
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
 * Calculate the bounding rectangle of all displays.
 */
function getVirtualDesktopBounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of displays) {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Calculate the image rect as percentages for a given fit mode.
 */
function calcFitRect(mode, imgW, imgH, canvasW, canvasH) {
  const imgAspect = imgW / imgH;
  const canvasAspect = canvasW / canvasH;
  let iLeft, iTop, iWidth, iHeight;

  switch (mode) {
    case 'cover':
      if (imgAspect > canvasAspect) {
        iHeight = 100; iWidth = (imgAspect / canvasAspect) * 100;
        iTop = 0; iLeft = -(iWidth - 100) / 2;
      } else {
        iWidth = 100; iHeight = (canvasAspect / imgAspect) * 100;
        iLeft = 0; iTop = -(iHeight - 100) / 2;
      }
      break;
    case 'contain':
      if (imgAspect > canvasAspect) {
        iWidth = 100; iHeight = (canvasAspect / imgAspect) * 100;
        iLeft = 0; iTop = (100 - iHeight) / 2;
      } else {
        iHeight = 100; iWidth = (imgAspect / canvasAspect) * 100;
        iTop = 0; iLeft = (100 - iWidth) / 2;
      }
      break;
    case 'stretch':
      iLeft = 0; iTop = 0; iWidth = 100; iHeight = 100;
      break;
    case 'center':
      iWidth = Math.min((imgW / canvasW) * 100, 200);
      iHeight = Math.min((imgH / canvasH) * 100, 200);
      iLeft = (100 - iWidth) / 2;
      iTop = (100 - iHeight) / 2;
      break;
  }

  return { left: iLeft, top: iTop, width: iWidth, height: iHeight };
}

/**
 * Render the fit preview for all 4 modes.
 * - In spanning mode: shows multiple monitor tiles with wallpaper spanning across.
 * - In same/different mode: shows a single monitor preview.
 */
function updateFitPreview() {
  if (!mediaDimensions) return;

  const imgW = mediaDimensions.w;
  const imgH = mediaDimensions.h;

  // Determine which image source to use for the preview
  const isVideo = currentFile && currentFile.wallpaperType === 'video';
  const isImage = currentFile && (currentFile.wallpaperType === 'image' || currentFile.wallpaperType === 'gif');
  const hasRealThumb = isImage || (isVideo && videoThumbnailUrl);
  const thumbUrl = isVideo ? videoThumbnailUrl : (isImage ? currentImageUrl : null);

  const isSpanning = currentMode === 'spanning';

  // Determine the canvas dimensions (what the wallpaper is fit to)
  let canvasW, canvasH;
  if (isSpanning) {
    const vd = getVirtualDesktopBounds();
    canvasW = vd.width;
    canvasH = vd.height;
  } else {
    const monitor = getSelectedDisplay();
    if (!monitor) return;
    canvasW = monitor.resolutionWidth;
    canvasH = monitor.resolutionHeight;
  }

  // Show dimension info
  if (isSpanning) {
    dimInfo.textContent = `${canvasW}×${canvasH} (span) ← ${imgW}×${imgH}`;
  } else {
    dimInfo.textContent = `${canvasW}×${canvasH} ← ${imgW}×${imgH}`;
  }
  dimInfo.style.display = 'inline-block';

  const fitModes = ['cover', 'contain', 'stretch', 'center'];
  const currentFit = getSelectedFit();

  fitModes.forEach(mode => {
    const previewMon = document.getElementById(`fit-vis-${mode}`);
    if (!previewMon) return;

    // Clear any previous spanning overlays
    previewMon.querySelectorAll('.span-monitor-outline').forEach(el => el.remove());

    const imageEl = previewMon.querySelector('.fit-preview-image');
    const templateEl = previewMon.querySelector('.fit-template');
    if (!imageEl || !templateEl) return;

    // Set aspect ratio to match the canvas
    previewMon.style.aspectRatio = `${canvasW} / ${canvasH}`;

    // Calculate the wallpaper rect (percentages of the canvas)
    const rect = calcFitRect(mode, imgW, imgH, canvasW, canvasH);

    if (isSpanning && displays.length > 1) {
      // ── Spanning: split wallpaper into per-monitor tiles ──
      // Hide the single full-span layers
      imageEl.style.cssText = 'display:none;';
      templateEl.style.cssText = 'display:none;';
      previewMon.classList.add('spanning-preview');

      const vd = getVirtualDesktopBounds();
      const gap = 1.2; // percentage inset on each side

      displays.forEach((d, i) => {
        const outline = document.createElement('div');
        outline.className = 'span-monitor-outline';

        // Monitor position as percentage of virtual desktop
        const mLeft = ((d.bounds.x - vd.x) / vd.width) * 100;
        const mTop = ((d.bounds.y - vd.y) / vd.height) * 100;
        const mWidth = (d.bounds.width / vd.width) * 100;
        const mHeight = (d.bounds.height / vd.height) * 100;

        outline.style.cssText = `left:${mLeft + gap}%;top:${mTop + gap}%;width:${mWidth - gap * 2}%;height:${mHeight - gap * 2}%;overflow:hidden;`;

        // Create a wallpaper slice inside this monitor tile
        // The slice is positioned so that the full wallpaper rect
        // maps correctly when viewed through this monitor's viewport
        const slice = document.createElement('div');
        slice.className = 'span-wallpaper-slice';

        // Transform wallpaper rect from virtual-desktop % to monitor-local %
        const sliceLeft = ((rect.left - mLeft) / mWidth) * 100;
        const sliceTop = ((rect.top - mTop) / mHeight) * 100;
        const sliceWidth = (rect.width / mWidth) * 100;
        const sliceHeight = (rect.height / mHeight) * 100;

        let sliceStyle = `left:${sliceLeft}%;top:${sliceTop}%;width:${sliceWidth}%;height:${sliceHeight}%;`;

        if (hasRealThumb && thumbUrl) {
          sliceStyle += `background-image:url("${thumbUrl}");background-size:100% 100%;background-repeat:no-repeat;`;
        }
        slice.style.cssText = sliceStyle;
        outline.appendChild(slice);

        // Also add a template overlay for the same area (visible when no thumb)
        if (!hasRealThumb || !thumbUrl) {
          const tpl = document.createElement('div');
          tpl.className = 'span-wallpaper-template';
          tpl.style.cssText = `left:${sliceLeft}%;top:${sliceTop}%;width:${sliceWidth}%;height:${sliceHeight}%;`;
          outline.appendChild(tpl);
        }

        // Monitor number label
        const label = document.createElement('span');
        label.className = 'span-monitor-label';
        label.textContent = i + 1;
        outline.appendChild(label);

        previewMon.appendChild(outline);
      });
    } else {
      // ── Single monitor preview ──
      previewMon.classList.remove('spanning-preview');
      const posStyle = `left:${rect.left}%;top:${rect.top}%;width:${rect.width}%;height:${rect.height}%;`;

      templateEl.style.cssText = posStyle;

      if (hasRealThumb && thumbUrl) {
        imageEl.style.cssText = posStyle + `background-image:url("${thumbUrl}");background-size:100% 100%;background-repeat:no-repeat;`;
        previewMon.classList.add('has-thumb');
      } else {
        imageEl.style.cssText = posStyle;
        previewMon.classList.remove('has-thumb');
      }
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
  const isMedia = ['image', 'gif', 'video'].includes(config.wallpaperType);

  optFitGroup.style.display = isMedia ? 'flex' : 'none';
  optSoundGroup.style.display = isVideo ? 'flex' : 'none';
  optLoopGroup.style.display = isVideo ? 'flex' : 'none';

  toggleSound.checked = config.soundEnabled || false;
  toggleLoop.checked = config.loop !== false;

  // Highlight current fit in preview grid
  document.querySelectorAll('.fit-preview-item').forEach(item => {
    item.classList.toggle('active', item.dataset.fit === (config.fit || 'cover'));
  });
}

function hideOptions() {
  panelOptions.style.display = 'none';
  if (dimInfo) dimInfo.style.display = 'none';
}

// ── Widget Editor Logic ──────────────────────────────────────────────

function initWidgetEvents() {
  btnAddWidget.addEventListener('click', () => {
    widgetPickerModal.style.display = 'flex';
  });

  btnCloseModal.addEventListener('click', () => {
    widgetPickerModal.style.display = 'none';
  });

  widgetTypeItems.forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      addNewWidget(type);
      widgetPickerModal.style.display = 'none';
    });
  });

  btnDeleteWidget.addEventListener('click', () => {
    if (selectedWidgetIndex !== null) deleteWidget(selectedWidgetIndex);
  });

  window.addEventListener('mousemove', onWidgetDragMove);
  window.addEventListener('mouseup', onWidgetDragEnd);

  // Initial picker previews
  renderPickerPreviews();
}

function renderWidgetToElement(widgetConfig, container) {
  container.innerHTML = '';
  const widgetDiv = document.createElement('div');
  widgetDiv.className = `widget widget-${widgetConfig.type}`;
  
  if (widgetConfig.theme === 'light') {
    widgetDiv.classList.add('theme-light');
  } else {
    widgetDiv.classList.add('theme-dark');
  }

  // Type-specific rendering (simplified for settings UI)
  switch (widgetConfig.type) {
    case 'digital-clock':
      const timeEl = document.createElement('div');
      timeEl.className = 'digital-time';
      const dateEl = document.createElement('div');
      dateEl.className = 'digital-date';
      widgetDiv.appendChild(timeEl);
      widgetDiv.appendChild(dateEl);
      
      const updateClock = () => {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        let ampm = '';
        if (widgetConfig.format12h) {
          ampm = hours >= 12 ? ' PM' : ' AM';
          hours = hours % 12 || 12;
        }
        timeEl.textContent = `${hours}:${minutes}:${seconds}${ampm}`;
        if (widgetConfig.showDate) {
          dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        }
      };
      updateClock();
      break;

    case 'analog-minimalist':
    case 'analog-numbered':
      const isNumbered = widgetConfig.type === 'analog-numbered';
      let numbersHtml = '';
      if (isNumbered) {
        for (let i = 1; i <= 12; i++) {
          const angle = (i * 30) * (Math.PI / 180);
          const x = Math.sin(angle) * 85;
          const y = -Math.cos(angle) * 85;
          numbersHtml += `<div class="number" style="transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px))">${i}</div>`;
        }
      }
      widgetDiv.innerHTML = `
        <div class="analog-clock ${isNumbered ? 'numbered' : 'minimalist'}">
          <div class="face">
            ${numbersHtml}
            <div class="hand hour"></div>
            <div class="hand minute"></div>
            <div class="hand second"></div>
            <div class="center-dot"></div>
          </div>
        </div>
      `;
      const updateAnalog = () => {
        const now = new Date();
        const sDeg = (now.getSeconds() / 60) * 360;
        const mDeg = (now.getMinutes() / 60) * 360;
        const hDeg = (now.getHours() / 12) * 360 + (now.getMinutes() / 60) * 30;
        widgetDiv.querySelector('.second').style.transform = `rotate(${sDeg}deg)`;
        widgetDiv.querySelector('.minute').style.transform = `rotate(${mDeg}deg)`;
        widgetDiv.querySelector('.hour').style.transform = `rotate(${hDeg}deg)`;
      };
      updateAnalog();
      break;

    case 'weather':
      widgetDiv.innerHTML = `
        <div class="weather-container">
          <div class="weather-temp">24°C</div>
          <div class="weather-icon">⛅</div>
        </div>
      `;
      break;
  }

  container.appendChild(widgetDiv);
}

function renderPickerPreviews() {
  const types = ['digital-clock', 'analog-minimalist', 'analog-numbered', 'weather'];
  types.forEach(type => {
    const el = document.getElementById(`preview-${type}`);
    if (el) {
      renderWidgetToElement({ type, theme: 'light', showDate: true, format12h: true }, el);
    }
  });
}


function renderWidgetEditor() {
  panelWidgets.style.display = 'block';
  
  // Wait for DOM reflow to get accurate container dimensions
  setTimeout(() => {
    widgetEditorCanvasesWrapper.innerHTML = '';
    
    if (currentMode === 'same') {
      displays.forEach((display, index) => {
        const monitorId = display.id.toString();
        const mConfig = settings.monitors[monitorId] || {};
        createWidgetCanvas(display, index, { ...settings.globalConfig, widgets: mConfig.widgets || [] }, `Monitor ${index + 1}`);
      });
    } else if (currentMode === 'different') {
      if (selectedMonitorId) {
        const display = displays.find(d => d.id.toString() === selectedMonitorId);
        if (display) {
          createWidgetCanvas(display, selectedMonitorIndex, settings.monitors[selectedMonitorId] || {}, `Monitor ${selectedMonitorIndex + 1}`);
        }
      }
    } else if (currentMode === 'spanning') {
      // For now, just render using primary display bounding box size ratio
      const primary = displays.find(d => d.isPrimary) || displays[0];
      if (primary) {
        createWidgetCanvas(primary, 0, settings.globalConfig || {}, 'Spanning Display');
      }
    }

    if (selectedWidgetIndex !== null && selectedWidgetMonitorId !== null) {
      const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
        ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
        : (settings.globalConfig?.widgets || []);
        
      if (currentWidgets[selectedWidgetIndex]) {
        updateInspector(currentWidgets[selectedWidgetIndex]);
      } else {
        selectedWidgetIndex = null;
        selectedWidgetMonitorId = null;
        widgetInspector.style.display = 'none';
      }
    } else {
      widgetInspector.style.display = 'none';
    }
  }, 0);
}

function hideWidgetEditor() {
  panelWidgets.style.display = 'none';
}

function createWidgetCanvas(display, index, config, titleText) {
  const section = document.createElement('div');
  section.className = 'widget-monitor-section';
  
  const title = document.createElement('h4');
  title.textContent = titleText;
  section.appendChild(title);
  
  const canvas = document.createElement('div');
  canvas.className = 'widget-editor-canvas';
  
  const previewArea = document.createElement('div');
  previewArea.className = 'widget-preview-area';
  previewArea.dataset.monitorId = display.id.toString();
  
  const previewBg = document.createElement('div');
  previewBg.className = 'widget-preview-bg';
  
  const canvasW = widgetEditorCanvasesWrapper.clientWidth - 20; 
  const canvasH = 350; 
  
  const monitorAspect = display.resolutionWidth / display.resolutionHeight;
  const canvasAspect = canvasW / canvasH;

  let w, h;
  if (monitorAspect > canvasAspect) {
    w = canvasW;
    h = canvasW / monitorAspect;
  } else {
    h = canvasH;
    w = canvasH * monitorAspect;
  }

  previewArea.style.width = `${w}px`;
  previewArea.style.height = `${h}px`;
  
  const scaleFactor = w / display.resolutionWidth;
  previewArea.dataset.scaleFactor = scaleFactor;

  if (currentImageUrl) {
    const fit = config.fit || 'cover';
    previewBg.style.backgroundImage = `url("${currentImageUrl}")`;
    
    if (fit === 'cover') {
      previewBg.style.backgroundSize = 'cover';
      previewBg.style.backgroundPosition = 'center';
    } else if (fit === 'contain') {
      previewBg.style.backgroundSize = 'contain';
      previewBg.style.backgroundPosition = 'center';
      previewBg.style.backgroundRepeat = 'no-repeat';
    } else if (fit === 'stretch') {
      previewBg.style.backgroundSize = '100% 100%';
      previewBg.style.backgroundPosition = 'center';
    } else if (fit === 'center') {
      previewBg.style.backgroundSize = 'auto';
      previewBg.style.backgroundPosition = 'center';
      previewBg.style.backgroundRepeat = 'no-repeat';
    }
  } else {
    previewBg.style.backgroundImage = 'none';
  }
  
  previewArea.appendChild(previewBg);
  
  const widgets = config.widgets || [];
  widgets.forEach((w, wIndex) => {
    const el = document.createElement('div');
    el.className = 'draggable-widget';
    el.dataset.id = wIndex;
    el.dataset.monitorId = display.id.toString();
    el.style.left = `${w.x}%`;
    el.style.top = `${w.y}%`;
    el.style.transform = `translate(-50%, -50%) scale(${(w.scale || 1) * scaleFactor})`;
    
    renderWidgetToElement(w, el);
    
    el.addEventListener('mousedown', (e) => onWidgetDragStart(e, wIndex, display.id.toString(), previewArea));
    previewArea.appendChild(el);
    
    if (selectedWidgetIndex === wIndex && selectedWidgetMonitorId === display.id.toString()) {
      el.classList.add('selected');
    }
  });
  
  canvas.appendChild(previewArea);
  section.appendChild(canvas);
  widgetEditorCanvasesWrapper.appendChild(section);
}

let currentDragPreviewArea = null;

function onWidgetDragStart(e, index, monitorId, previewArea) {
  e.preventDefault();
  selectWidget(index, monitorId);
  
  isDragging = true;
  selectedWidgetIndex = index;
  selectedWidgetMonitorId = monitorId;
  currentDragPreviewArea = previewArea;
  
  const el = previewArea.querySelector(`.draggable-widget[data-id="${index}"]`);
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  
  widgetStartX = parseFloat(el.style.left);
  widgetStartY = parseFloat(el.style.top);
}

function onWidgetDragMove(e) {
  if (!isDragging || selectedWidgetIndex === null || !currentDragPreviewArea) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  const areaW = currentDragPreviewArea.clientWidth;
  const areaH = currentDragPreviewArea.clientHeight;

  let newX = widgetStartX + (dx / areaW) * 100;
  let newY = widgetStartY + (dy / areaH) * 100;

  // Constrain
  newX = Math.max(0, Math.min(100, newX));
  newY = Math.max(0, Math.min(100, newY));

  const el = currentDragPreviewArea.querySelector(`.draggable-widget[data-id="${selectedWidgetIndex}"]`);
  if (el) {
    el.style.left = `${newX}%`;
    el.style.top = `${newY}%`;
  }
}

async function onWidgetDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  currentDragPreviewArea = null;
  
  // Save position
  await saveCurrentWidgets(false);
}

function selectWidget(index, monitorId) {
  selectedWidgetIndex = index;
  selectedWidgetMonitorId = monitorId;
  
  document.querySelectorAll('.draggable-widget').forEach(el => {
    const isSelected = parseInt(el.dataset.id) === index && el.dataset.monitorId === monitorId;
    el.classList.toggle('selected', isSelected);
  });

  const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
    ? (settings.monitors[monitorId]?.widgets || [])
    : (settings.globalConfig?.widgets || []);

  if (currentWidgets[index]) {
    updateInspector(currentWidgets[index]);
  } else {
    widgetInspector.style.display = 'none';
  }
}

function updateSelectedWidgetStyle(scale) {
  if (selectedWidgetIndex === null || !selectedWidgetMonitorId) return;
  const el = widgetEditorCanvasesWrapper.querySelector(`.draggable-widget[data-id="${selectedWidgetIndex}"][data-monitor-id="${selectedWidgetMonitorId}"]`);
  if (el) {
    const previewArea = el.closest('.widget-preview-area');
    const scaleFactor = parseFloat(previewArea.dataset.scaleFactor || 1);
    el.style.transform = `translate(-50%, -50%) scale(${scale * scaleFactor})`;
  }
}

function updateInspector(widget) {
  widgetInspector.style.display = 'flex';
  inspectorContent.innerHTML = '';

  // Common: Scale
  addInspectorRange('Scale', widget.scale || 1, 0.5, 3, 0.1, (val, save) => {
    const scale = parseFloat(val);
    widget.scale = scale;
    
    // Update local settings object immediately
    const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
      ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
      : (settings.globalConfig?.widgets || []);
    if (currentWidgets[selectedWidgetIndex]) currentWidgets[selectedWidgetIndex].scale = scale;

    if (save) {
      saveCurrentWidgets(true); // Save and re-render
    } else {
      updateSelectedWidgetStyle(scale); // Visual only
    }
  });

  // Common: Theme
  addInspectorSelect('Theme', widget.theme || 'light', [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' }
  ], (val) => {
    widget.theme = val;
    const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
      ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
      : (settings.globalConfig?.widgets || []);
    if (currentWidgets[selectedWidgetIndex]) currentWidgets[selectedWidgetIndex].theme = val;
    saveCurrentWidgets();
  });

  // Type specific
  if (widget.type === 'digital-clock') {
    addInspectorCheckbox('Show Date', widget.showDate, (val) => {
      widget.showDate = val;
      const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
        ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
        : (settings.globalConfig?.widgets || []);
      if (currentWidgets[selectedWidgetIndex]) currentWidgets[selectedWidgetIndex].showDate = val;
      saveCurrentWidgets();
    });
    addInspectorCheckbox('12h Format', widget.format12h, (val) => {
      widget.format12h = val;
      const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
        ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
        : (settings.globalConfig?.widgets || []);
      if (currentWidgets[selectedWidgetIndex]) currentWidgets[selectedWidgetIndex].format12h = val;
      saveCurrentWidgets();
    });
  }

  if (widget.type === 'weather') {
    addInspectorInput('Latitude (opt)', widget.lat || '', 'number', (val) => {
      widget.lat = val;
      const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
        ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
        : (settings.globalConfig?.widgets || []);
      if (currentWidgets[selectedWidgetIndex]) currentWidgets[selectedWidgetIndex].lat = val;
      saveCurrentWidgets();
    });
    addInspectorInput('Longitude (opt)', widget.lon || '', 'number', (val) => {
      widget.lon = val;
      const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
        ? (settings.monitors[selectedWidgetMonitorId]?.widgets || [])
        : (settings.globalConfig?.widgets || []);
      if (currentWidgets[selectedWidgetIndex]) currentWidgets[selectedWidgetIndex].lon = val;
      saveCurrentWidgets();
    });
  }

  // Delete button
  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete-widget';
  btnDelete.style.marginTop = '20px';
  btnDelete.textContent = 'Delete Widget';
  btnDelete.onclick = () => deleteWidget(selectedWidgetIndex);
  inspectorContent.appendChild(btnDelete);
}

function addInspectorRange(label, value, min, max, step, onChange) {
  const ctrl = document.createElement('div');
  ctrl.className = 'inspector-control';
  ctrl.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;
  const input = ctrl.querySelector('input');
  
  // Real-time visual update
  input.addEventListener('input', (e) => {
    onChange(e.target.value, false); // false = don't save/re-render
  });
  
  // Save on release
  input.addEventListener('change', (e) => {
    onChange(e.target.value, true); // true = save to store
  });
  
  inspectorContent.appendChild(ctrl);
}

function addInspectorSelect(label, value, options, onChange) {
  const ctrl = document.createElement('div');
  ctrl.className = 'inspector-control';
  const optsHtml = options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('');
  ctrl.innerHTML = `<label>${label}</label><select>${optsHtml}</select>`;
  ctrl.querySelector('select').addEventListener('change', (e) => onChange(e.target.value));
  inspectorContent.appendChild(ctrl);
}

function addInspectorCheckbox(label, value, onChange) {
  const ctrl = document.createElement('div');
  ctrl.className = 'inspector-control';
  ctrl.innerHTML = `
    <label class="checkbox-row">
      <input type="checkbox" ${value ? 'checked' : ''}>
      <span>${label}</span>
    </label>
  `;
  ctrl.querySelector('input').addEventListener('change', (e) => onChange(e.target.checked));
  inspectorContent.appendChild(ctrl);
}

function addInspectorInput(label, value, type, onChange) {
  const ctrl = document.createElement('div');
  ctrl.className = 'inspector-control';
  ctrl.innerHTML = `<label>${label}</label><input type="${type}" value="${value}">`;
  ctrl.querySelector('input').addEventListener('change', (e) => onChange(e.target.value));
  inspectorContent.appendChild(ctrl);
}

function getWidgetsFromArea(area, monitorId) {
  const widgets = [];
  const elWidgets = area.querySelectorAll('.draggable-widget');
  
  const currentWidgets = (currentMode === 'same' || currentMode === 'different') 
    ? (settings.monitors[monitorId]?.widgets || [])
    : (settings.globalConfig?.widgets || []);

  elWidgets.forEach(el => {
    const id = parseInt(el.dataset.id);
    const w = { ...currentWidgets[id] };
    w.x = parseFloat(el.style.left);
    w.y = parseFloat(el.style.top);
    widgets.push(w);
  });
  return widgets;
}

function getWidgetsFromEditor() {
  if (currentMode === 'spanning') {
    const area = widgetEditorCanvasesWrapper.querySelector('.widget-preview-area');
    if (!area) return [];
    return getWidgetsFromArea(area, null);
  } else if (currentMode === 'different') {
    if (!selectedMonitorId) return [];
    const area = widgetEditorCanvasesWrapper.querySelector(`.widget-preview-area[data-monitor-id="${selectedMonitorId}"]`);
    if (!area) return [];
    return getWidgetsFromArea(area, selectedMonitorId);
  }
  return [];
}

async function addNewWidget(type) {
  let targetMonitorId = null;
  let widgets = [];
  
  if (currentMode === 'spanning') {
    const area = widgetEditorCanvasesWrapper.querySelector('.widget-preview-area');
    if (area) widgets = getWidgetsFromArea(area, null);
  } else {
    // If in same or different mode, default to selected monitor or first available
    targetMonitorId = selectedMonitorId || (displays.length > 0 ? displays[0].id.toString() : null);
    if (targetMonitorId) {
      const area = widgetEditorCanvasesWrapper.querySelector(`.widget-preview-area[data-monitor-id="${targetMonitorId}"]`);
      if (area) widgets = getWidgetsFromArea(area, targetMonitorId);
    }
  }

  const newWidget = {
    type,
    x: 50,
    y: 50,
    scale: 1,
    theme: 'light',
    showDate: true,
    format12h: true
  };
  widgets.push(newWidget);
  
  selectedWidgetIndex = widgets.length - 1;
  selectedWidgetMonitorId = targetMonitorId;
  
  if (currentMode === 'spanning') {
    const config = buildConfig(currentFile || { filePath: '', wallpaperType: '' });
    config.widgets = widgets;
    await saveConfig(config);
  } else if (targetMonitorId) {
    await API.setMonitorConfig(targetMonitorId, { widgets });
    
    // Also save global config to ensure consistency
    const config = buildConfig(currentFile || { filePath: '', wallpaperType: '' });
    await saveConfig(config);
    
    // Refresh settings
    settings = await API.getSettings();
  }
  
  renderWidgetEditor();
}

async function deleteWidget(id) {
  if (selectedWidgetMonitorId === null && currentMode !== 'spanning') return;
  
  let widgets = [];
  if (currentMode === 'spanning') {
    const area = widgetEditorCanvasesWrapper.querySelector('.widget-preview-area');
    if (area) widgets = getWidgetsFromArea(area, null);
  } else {
    const area = widgetEditorCanvasesWrapper.querySelector(`.widget-preview-area[data-monitor-id="${selectedWidgetMonitorId}"]`);
    if (area) widgets = getWidgetsFromArea(area, selectedWidgetMonitorId);
  }
  
  widgets.splice(id, 1);
  selectedWidgetIndex = null;
  
  if (currentMode === 'spanning') {
    const config = buildConfig(currentFile || { filePath: '', wallpaperType: '' });
    config.widgets = widgets;
    await saveConfig(config);
  } else if (selectedWidgetMonitorId) {
    await API.setMonitorConfig(selectedWidgetMonitorId, { widgets });
    
    const config = buildConfig(currentFile || { filePath: '', wallpaperType: '' });
    await saveConfig(config);
    
    settings = await API.getSettings();
  }
  
  renderWidgetEditor();
}

async function saveCurrentWidgets(reRender = true) {
  const config = buildConfig(currentFile || { filePath: '', wallpaperType: '' });
  await saveConfig(config);
  
  if (currentMode === 'same') {
    const areas = widgetEditorCanvasesWrapper.querySelectorAll('.widget-preview-area');
    for (const area of areas) {
      const mId = area.dataset.monitorId;
      const widgets = getWidgetsFromArea(area, mId);
      await API.setMonitorConfig(mId, { widgets });
    }
    settings = await API.getSettings();
  }
  
  if (reRender) renderWidgetEditor();
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
      renderWidgetEditor();
    }
  }
});

// Fit preview items — click to select fit mode
function onFitChange(fit) {
  document.querySelectorAll('.fit-preview-item').forEach(i => i.classList.toggle('active', i.dataset.fit === fit));
  if (currentFile) {
    saveConfig(buildConfig(currentFile));
    renderWidgetEditor();
  }
}

document.querySelectorAll('.fit-preview-item').forEach(item => {
  item.addEventListener('click', () => onFitChange(item.dataset.fit));
});

// Toggle handlers
toggleSound.addEventListener('change', () => { if (currentFile) saveConfig(buildConfig(currentFile)); });
toggleLoop.addEventListener('change', () => { if (currentFile) saveConfig(buildConfig(currentFile)); });
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
