// ===========================================================================
// Wallpaper Renderer – Display Logic
// Handles rendering images, GIFs, videos, and HTML as desktop wallpaper
// ===========================================================================

const container = document.getElementById('wallpaper-container');
const widgetContainer = document.getElementById('widget-container');
let currentElement = null;
let currentConfig = null;
let activeWidgets = [];

/**
 * Clear the container and remove current wallpaper element.
 */
function clearContainer() {
  container.innerHTML = '';
  currentElement = null;
}

/**
 * Clear all widgets.
 */
function clearWidgets() {
  widgetContainer.innerHTML = '';
  activeWidgets.forEach(w => {
    if (w.cleanup) w.cleanup();
  });
  activeWidgets = [];
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
 * Create and add a widget to the screen.
 * @param {object} widgetConfig
 */
function addWidget(widgetConfig) {
  const widgetDiv = document.createElement('div');
  widgetDiv.className = `widget widget-${widgetConfig.type}`;
  widgetDiv.style.left = `${widgetConfig.x}%`;
  widgetDiv.style.top = `${widgetConfig.y}%`;
  widgetDiv.style.transform = `translate(-50%, -50%) scale(${widgetConfig.scale || 1})`;
  
  if (widgetConfig.theme === 'light') {
    widgetDiv.classList.add('theme-light');
  } else {
    widgetDiv.classList.add('theme-dark');
  }

  const widget = {
    config: widgetConfig,
    element: widgetDiv,
    cleanup: null
  };

  // Type-specific rendering
  switch (widgetConfig.type) {
    case 'digital-clock':
      setupDigitalClock(widget);
      break;
    case 'analog-minimalist':
      setupAnalogMinimalist(widget);
      break;
    case 'analog-numbered':
      setupAnalogNumbered(widget);
      break;
    case 'weather':
      setupWeather(widget);
      break;
  }

  widgetContainer.appendChild(widgetDiv);
  activeWidgets.push(widget);
}

// ── Widget Implementations ───────────────────────────────────────────

function setupDigitalClock(widget) {
  const timeEl = document.createElement('div');
  timeEl.className = 'digital-time';
  
  const dateEl = document.createElement('div');
  dateEl.className = 'digital-date';
  
  widget.element.appendChild(timeEl);
  widget.element.appendChild(dateEl);

  function update() {
    const now = new Date();
    
    // Time
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    let ampm = '';

    if (widget.config.format12h) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    
    timeEl.textContent = `${hours}:${minutes}:${seconds}${ampm}`;

    // Date
    if (widget.config.showDate) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString(undefined, options);
    } else {
      dateEl.textContent = '';
    }
  }

  update();
  const interval = setInterval(update, 1000);
  widget.cleanup = () => clearInterval(interval);
}

function setupAnalogMinimalist(widget) {
  widget.element.innerHTML = `
    <div class="analog-clock minimalist">
      <div class="face">
        <div class="hand hour"></div>
        <div class="hand minute"></div>
        <div class="hand second"></div>
        <div class="center-dot"></div>
      </div>
    </div>
  `;

  const hr = widget.element.querySelector('.hour');
  const min = widget.element.querySelector('.minute');
  const sec = widget.element.querySelector('.second');

  function update() {
    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours();

    const sDeg = (s / 60) * 360;
    const mDeg = (m / 60) * 360 + (s / 60) * 6;
    const hDeg = (h / 12) * 360 + (m / 60) * 30;

    sec.style.transform = `rotate(${sDeg}deg)`;
    min.style.transform = `rotate(${mDeg}deg)`;
    hr.style.transform = `rotate(${hDeg}deg)`;

    requestAnimationFrame(update);
  }

  const raf = requestAnimationFrame(update);
  widget.cleanup = () => cancelAnimationFrame(raf);
}

function setupAnalogNumbered(widget) {
  // Classic analog clock with numbers
  let numbersHtml = '';
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const x = Math.sin(angle) * 85;
    const y = -Math.cos(angle) * 85;
    numbersHtml += `<div class="number" style="transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px))">${i}</div>`;
  }

  widget.element.innerHTML = `
    <div class="analog-clock numbered">
      <div class="face">
        ${numbersHtml}
        <div class="hand hour"></div>
        <div class="hand minute"></div>
        <div class="hand second"></div>
        <div class="center-dot"></div>
      </div>
    </div>
  `;

  const hr = widget.element.querySelector('.hour');
  const min = widget.element.querySelector('.minute');
  const sec = widget.element.querySelector('.second');

  function update() {
    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours();

    const sDeg = (s / 60) * 360;
    const mDeg = (m / 60) * 360 + (s / 60) * 6;
    const hDeg = (h / 12) * 360 + (m / 60) * 30;

    sec.style.transform = `rotate(${sDeg}deg)`;
    min.style.transform = `rotate(${mDeg}deg)`;
    hr.style.transform = `rotate(${hDeg}deg)`;

    requestAnimationFrame(update);
  }

  const raf = requestAnimationFrame(update);
  widget.cleanup = () => cancelAnimationFrame(raf);
}

async function setupWeather(widget) {
  const weatherEl = document.createElement('div');
  weatherEl.className = 'weather-container';
  widget.element.appendChild(weatherEl);

  async function update() {
    try {
      // Use geolocation if coordinates not provided
      let lat = widget.config.lat;
      let lon = widget.config.lon;

      if (!lat || !lon) {
        const resp = await fetch('https://ipapi.co/json/');
        const data = await resp.json();
        lat = data.latitude;
        lon = data.longitude;
      }

      const weatherResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const weatherData = await weatherResp.json();
      const current = weatherData.current_weather;

      const code = current.weathercode;
      let icon = '☀️';
      if (code >= 1 && code <= 3) icon = '⛅';
      if (code >= 45 && code <= 48) icon = '🌫️';
      if (code >= 51 && code <= 67) icon = '🌧️';
      if (code >= 71 && code <= 77) icon = '❄️';
      if (code >= 80 && code <= 82) icon = '🌦️';
      if (code >= 95) icon = '⛈️';

      weatherEl.innerHTML = `
        <div class="weather-temp">${Math.round(current.temperature)}°C</div>
        <div class="weather-icon">${icon}</div>
      `;
    } catch (err) {
      console.error('[Weather] Failed to fetch:', err);
      weatherEl.textContent = 'Weather Error';
    }
  }

  update();
  const interval = setInterval(update, 30 * 60 * 1000); // Update every 30 mins
  widget.cleanup = () => clearInterval(interval);
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
    
    // Still clear widgets even if no wallpaper
    clearWidgets();
    if (config && config.widgets) {
      config.widgets.forEach(addWidget);
    }
    return;
  }

  currentConfig = config;

  // Render wallpaper
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

  // Render widgets
  clearWidgets();
  if (config.widgets) {
    config.widgets.forEach(addWidget);
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
