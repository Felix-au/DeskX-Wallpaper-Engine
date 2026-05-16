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
    case 'weather-detailed':
      setupWeatherDetailed(widget);
      break;
    case 'clock-weather':
      setupClockWeather(widget);
      break;
    case 'astronomy':
      setupAstronomy(widget);
      break;
    case 'aqi':
      setupAQI(widget);
      break;
    case 'custom-text':
      setupCustomText(widget);
      break;
    case 'embed-html':
      setupEmbedHTML(widget);
      break;
    case 'battery':
      setupBattery(widget);
      break;
    case 'countdown':
      setupCountdown(widget);
      break;
    case 'quote':
      setupQuote(widget);
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
  const weatherEl = widget.element;
  const apiKey = '5fcb015a41ea49dc92e170240261605';
  
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const weatherResp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}`);
      const data = await weatherResp.json();
      if (data.error) throw new Error(data.error.message);

      const temp = Math.round(data.current.temp_c);
      const condition = data.current.condition.text;
      const iconUrl = 'https:' + data.current.condition.icon;
      const city = data.location.name;
      const country = data.location.country;

      weatherEl.innerHTML = `
        <div class="weather-info-main">
          <div class="weather-temp">${temp}°C</div>
          <div class="weather-icon"><img src="${iconUrl}" alt="${condition}"></div>
        </div>
        <div class="weather-location">${city}, ${country}</div>
      `;
    } catch (err) {
      console.error('[Weather] Failed to fetch:', err);
      weatherEl.textContent = 'Weather Error';
    }
  }

  update();
  const interval = setInterval(update, 30 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupWeatherDetailed(widget) {
  const weatherEl = widget.element;
  const apiKey = '5fcb015a41ea49dc92e170240261605';
  
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const weatherResp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}`);
      const data = await weatherResp.json();
      if (data.error) throw new Error(data.error.message);

      const temp = Math.round(data.current.temp_c);
      const condition = data.current.condition.text;
      const iconUrl = 'https:' + data.current.condition.icon;
      const feelsLike = Math.round(data.current.feelslike_c);
      const humidity = data.current.humidity;
      const wind = data.current.wind_kph;
      const uv = data.current.uv;
      const city = data.location.name;
      const country = data.location.country;

      weatherEl.innerHTML = `
        <div class="weather-detailed-grid">
          <div class="weather-main-row">
            <div class="weather-temp-large">${temp}°C</div>
            <img src="${iconUrl}" alt="${condition}">
          </div>
          <div class="weather-condition-text">${condition}</div>
          <div class="weather-location-small">${city}, ${country}</div>
          <div class="weather-stats-grid">
            <div class="stat-item"><span>Feels Like:</span> ${feelsLike}°C</div>
            <div class="stat-item"><span>Humidity:</span> ${humidity}%</div>
            <div class="stat-item"><span>Wind:</span> ${wind} km/h</div>
            <div class="stat-item"><span>UV Index:</span> ${uv}</div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('[Weather Detailed] Error:', err);
    }
  }

  update();
  const interval = setInterval(update, 30 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupClockWeather(widget) {
  const timeEl = document.createElement('div');
  timeEl.className = 'digital-time-small';
  const weatherInner = document.createElement('div');
  weatherInner.className = 'clock-weather-inner';
  widget.element.appendChild(timeEl);
  widget.element.appendChild(weatherInner);

  const apiKey = '5fcb015a41ea49dc92e170240261605';

  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    let ampm = '';
    if (widget.config.format12h) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    timeEl.textContent = `${hours}:${minutes}${ampm}`;
  }

  async function updateWeather() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.error) {
        weatherInner.innerHTML = `
          <div class="clock-weather-info">
            <img src="https:${data.current.condition.icon}" style="width:24px;"> 
            <span>${Math.round(data.current.temp_c)}°C</span>
          </div>
          <div class="weather-location-tiny">${data.location.name}</div>
        `;
      }
    } catch(e){}
  }

  updateTime();
  updateWeather();
  const tInt = setInterval(updateTime, 1000);
  const wInt = setInterval(updateWeather, 30 * 60 * 1000);
  widget.cleanup = () => { clearInterval(tInt); clearInterval(wInt); };
}

async function setupAstronomy(widget) {
  const apiKey = '5fcb015a41ea49dc92e170240261605';
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/astronomy.json?key=${apiKey}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const a = data.astronomy.astro;
      const city = data.location.name;
      const country = data.location.country;

      widget.element.innerHTML = `
        <div class="astro-widget">
          <div class="astro-item">🌅 <span>Sunrise:</span> ${a.sunrise}</div>
          <div class="astro-item">🌇 <span>Sunset:</span> ${a.sunset}</div>
          <div class="astro-item">🌙 <span>Moon:</span> ${a.moon_phase}</div>
          <div class="weather-location-small" style="margin-top: 5px; opacity: 0.5;">${city}, ${country}</div>
        </div>
      `;
    } catch(e){}
  }
  update();
  const interval = setInterval(update, 60 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupAQI(widget) {
  const apiKey = '5fcb015a41ea49dc92e170240261605';
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(query)}&aqi=yes`);
      const data = await res.json();
      const air = data.current.air_quality;
      const aqiIdx = air['us-epa-index'];
      const pm25 = Math.round(air['pm2_5']);
      const city = data.location.name;
      const country = data.location.country;

      const labels = ['', 'Good', 'Moderate', 'Unhealthy (SG)', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
      const colors = ['', '#10b981', '#fbbf24', '#f59e0b', '#ef4444', '#b91c1c', '#7f1d1d'];
      
      widget.element.innerHTML = `
        <div class="aqi-widget" style="border-left: 4px solid ${colors[aqiIdx] || '#ccc'}">
          <div class="aqi-value">Level ${aqiIdx}: ${labels[aqiIdx] || 'Unknown'}</div>
          <div class="aqi-pm">PM2.5: ${pm25} µg/m³</div>
          <div class="weather-location-small" style="margin-top: 4px; opacity: 0.5;">${city}, ${country}</div>
        </div>
      `;
    } catch(e){}
  }
  update();
  const interval = setInterval(update, 30 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

function setupCustomText(widget) {
  widget.element.innerHTML = `<div class="custom-text-content">${widget.config.customText || 'Custom Text'}</div>`;
}

function setupEmbedHTML(widget) {
  widget.element.innerHTML = `<div class="embed-container">${widget.config.embedCode || ''}</div>`;
}

async function setupBattery(widget) {
  async function update() {
    try {
      const battery = await navigator.getBattery();
      const level = Math.round(battery.level * 100);
      const charging = battery.charging;
      widget.element.innerHTML = `
        <div class="battery-widget ${level < 20 ? 'low' : ''}">
          <div class="battery-icon-wrapper">
            <div class="battery-level" style="width: ${level}%"></div>
            ${charging ? '<div class="charging-bolt">⚡</div>' : ''}
          </div>
          <div class="battery-text">${level}%</div>
        </div>
      `;
    } catch(e) {
      widget.element.textContent = 'Battery Not Supported';
    }
  }
  update();
  const interval = setInterval(update, 60000);
  widget.cleanup = () => clearInterval(interval);
}

function setupCountdown(widget) {
  const targetDate = new Date(widget.config.targetDate || Date.now() + 86400000);
  const label = widget.config.label || 'Countdown';
  
  function update() {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) {
      widget.element.innerHTML = `<div class="countdown-finished">${label} Finished!</div>`;
      return;
    }
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    
    widget.element.innerHTML = `
      <div class="countdown-widget">
        <div class="countdown-label">${label}</div>
        <div class="countdown-timer">
          <span>${d}d</span> <span>${h}h</span> <span>${m}m</span> <span>${s}s</span>
        </div>
      </div>
    `;
  }
  update();
  const interval = setInterval(update, 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupQuote(widget) {
  async function update() {
    try {
      const res = await fetch('https://type.fit/api/quotes');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        const q = data[randomIndex];
        // Type.fit authors sometimes have ", type.fit" appended
        const author = q.author ? q.author.split(',')[0] : 'Unknown';
        widget.element.innerHTML = `
          <div class="quote-widget">
            <div class="quote-text">"${q.text}"</div>
            <div class="quote-author">— ${author}</div>
          </div>
        `;
      }
    } catch(e) {
      console.error('[Quote] Failed to fetch:', e);
      widget.element.innerHTML = '<div class="quote-error">Failed to load quote</div>';
    }
  }
  update();
  const interval = setInterval(update, 2 * 60 * 60 * 1000);
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
