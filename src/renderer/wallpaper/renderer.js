// ===========================================================================
// Wallpaper Renderer – Display Logic
// Handles rendering images, GIFs, videos, and HTML as desktop wallpaper
// ===========================================================================

const container = document.getElementById('wallpaper-container');
let currentElement = null;
let currentConfig = null;

/**
 * Clear the container and remove current wallpaper element.
 */
function clearContainer() {
  container.innerHTML = '';
  currentElement = null;
}

/**
 * Set an image or GIF wallpaper.
 * @param {object} config
 */
function setImageWallpaper(config) {
  clearContainer();

  const img = document.createElement('img');
  img.className = `wallpaper-media fit-${config.fit || 'cover'}`;
  img.src = `file:///${config.wallpaperPath.replace(/\\/g, '/')}`;
  img.draggable = false;
  img.alt = '';

  img.onerror = () => {
    console.error('[Renderer] Failed to load image:', config.wallpaperPath);
    showError('Failed to load image');
  };

  container.appendChild(img);
  currentElement = img;
}

/**
 * Set a video wallpaper.
 * @param {object} config
 */
function setVideoWallpaper(config) {
  clearContainer();

  const video = document.createElement('video');
  video.className = `wallpaper-media fit-${config.fit || 'cover'}`;
  video.src = `file:///${config.wallpaperPath.replace(/\\/g, '/')}`;
  video.autoplay = true;
  video.loop = config.loop !== false;
  video.muted = !config.soundEnabled;
  video.playsInline = true;
  video.disablePictureInPicture = true;

  // Remove controls
  video.controls = false;

  video.onerror = () => {
    console.error('[Renderer] Failed to load video:', config.wallpaperPath);
    showError('Failed to load video');
  };

  // Ensure autoplay works
  video.addEventListener('canplay', () => {
    video.play().catch((err) => {
      console.warn('[Renderer] Autoplay blocked:', err);
    });
  });

  container.appendChild(video);
  currentElement = video;
}

/**
 * Set an HTML wallpaper.
 * @param {object} config
 */
function setHTMLWallpaper(config) {
  clearContainer();

  if (config.interactive) {
    // Use iframe for interactive HTML (allows direct mouse interaction)
    const iframe = document.createElement('iframe');
    iframe.className = 'wallpaper-html';
    iframe.src = `file:///${config.wallpaperPath.replace(/\\/g, '/')}`;
    iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
    iframe.allow = 'autoplay';

    container.appendChild(iframe);
    currentElement = iframe;
  } else {
    // Use iframe but make it non-interactive
    const iframe = document.createElement('iframe');
    iframe.className = 'wallpaper-html';
    iframe.src = `file:///${config.wallpaperPath.replace(/\\/g, '/')}`;
    iframe.sandbox = 'allow-scripts allow-same-origin';
    iframe.style.pointerEvents = 'none';
    iframe.allow = 'autoplay';

    container.appendChild(iframe);
    currentElement = iframe;
  }
}

/**
 * Show an error message in the container.
 * @param {string} message
 */
function showError(message) {
  clearContainer();
  const errorDiv = document.createElement('div');
  errorDiv.className = 'placeholder';
  errorDiv.innerHTML = `
    <div class="placeholder-icon">⚠️</div>
    <div class="placeholder-text">${message}</div>
  `;
  container.appendChild(errorDiv);
}

/**
 * Apply wallpaper configuration.
 * @param {object} config
 */
function applyWallpaper(config) {
  if (!config || !config.wallpaperPath) {
    clearContainer();
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = `
      <div class="placeholder-icon">🖼️</div>
      <div class="placeholder-text">No wallpaper set</div>
    `;
    container.appendChild(placeholder);
    return;
  }

  currentConfig = config;

  switch (config.wallpaperType) {
    case 'image':
    case 'gif':
      setImageWallpaper(config);
      break;
    case 'video':
      setVideoWallpaper(config);
      break;
    case 'html':
      setHTMLWallpaper(config);
      break;
    default:
      // Try to detect from extension
      const ext = config.wallpaperPath.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)) {
        config.wallpaperType = 'image';
        setImageWallpaper(config);
      } else if (ext === 'gif') {
        config.wallpaperType = 'gif';
        setImageWallpaper(config);
      } else if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) {
        config.wallpaperType = 'video';
        setVideoWallpaper(config);
      } else if (['html', 'htm'].includes(ext)) {
        config.wallpaperType = 'html';
        setHTMLWallpaper(config);
      } else {
        showError(`Unsupported format: .${ext}`);
      }
  }
}

// ── IPC Listeners ─────────────────────────────────────────────────────

if (window.wallpaperAPI) {
  window.wallpaperAPI.onSetWallpaper((config) => {
    console.log('[Renderer] Received wallpaper config:', config);
    applyWallpaper(config);
  });

  window.wallpaperAPI.onToggleSound((enabled) => {
    if (currentElement && currentElement.tagName === 'VIDEO') {
      currentElement.muted = !enabled;
    }
  });

  window.wallpaperAPI.onPause(() => {
    if (currentElement) {
      if (currentElement.tagName === 'VIDEO') {
        currentElement.pause();
      }
    }
  });

  window.wallpaperAPI.onResume(() => {
    if (currentElement) {
      if (currentElement.tagName === 'VIDEO') {
        currentElement.play().catch(() => {});
      }
    }
  });

  window.wallpaperAPI.onSetFit((fit) => {
    if (currentElement && currentElement.classList.contains('wallpaper-media')) {
      currentElement.className = `wallpaper-media fit-${fit}`;
    }
  });
}
