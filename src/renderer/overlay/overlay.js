// ===========================================================================
// DeskX: Widget Overlay – Interactive Desktop Widget Layer
// Renders widgets on a transparent overlay window above the desktop.
// Handles hit-testing, live drag-to-reposition, and per-widget interactions.
// ===========================================================================

const widgetContainer = document.getElementById('widget-container');
let activeWidgets = [];
let isDraggable = true;
let isInteractive = true;

// ── Hit-Test: report to main process whether mouse is over a widget ──

let lastHitState = false;

document.addEventListener('mousemove', (e) => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const overWidget = el && (el.closest('.widget') !== null);

  if (overWidget !== lastHitState) {
    lastHitState = overWidget;
    if (window.wallpaperAPI && window.wallpaperAPI.overlayHitTest) {
      window.wallpaperAPI.overlayHitTest(overWidget);
    }
  }
});

// ── Drag-to-Reposition ──────────────────────────────────────────────

let dragState = null;

function startDrag(e, widget) {
  if (!isDraggable) return;
  e.preventDefault();
  e.stopPropagation();

  const rect = widgetContainer.getBoundingClientRect();
  dragState = {
    widget,
    startMouseX: e.clientX,
    startMouseY: e.clientY,
    startX: widget.config.x,
    startY: widget.config.y,
    containerW: rect.width,
    containerH: rect.height,
  };
  widget.element.classList.add('dragging');
}

document.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  e.preventDefault();

  const dx = e.clientX - dragState.startMouseX;
  const dy = e.clientY - dragState.startMouseY;
  const newX = dragState.startX + (dx / dragState.containerW) * 100;
  const newY = dragState.startY + (dy / dragState.containerH) * 100;
  const clampedX = Math.max(0, Math.min(100, newX));
  const clampedY = Math.max(0, Math.min(100, newY));

  dragState.widget.config.x = clampedX;
  dragState.widget.config.y = clampedY;
  dragState.widget.element.style.left = `${clampedX}%`;
  dragState.widget.element.style.top = `${clampedY}%`;
});

document.addEventListener('mouseup', () => {
  if (!dragState) return;
  dragState.widget.element.classList.remove('dragging');

  // Notify main process of new position
  if (window.wallpaperAPI && window.wallpaperAPI.overlayWidgetMoved) {
    const idx = activeWidgets.indexOf(dragState.widget);
    if (idx !== -1) {
      window.wallpaperAPI.overlayWidgetMoved(idx, dragState.widget.config.x, dragState.widget.config.y);
    }
  }
  dragState = null;
});

// ── Widget Creation ─────────────────────────────────────────────────

function clearWidgets() {
  widgetContainer.innerHTML = '';
  activeWidgets.forEach(w => { if (w.cleanup) w.cleanup(); });
  activeWidgets = [];
}

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

  if (isDraggable) widgetDiv.classList.add('draggable');
  if (!isInteractive) widgetDiv.classList.add('non-interactive');

  const widget = { config: widgetConfig, element: widgetDiv, cleanup: null };

  // Drag handler
  widgetDiv.addEventListener('mousedown', (e) => {
    if (isDraggable && !e.target.closest('.widget-action-btn, .calendar-nav-btn, button, [contenteditable]')) {
      startDrag(e, widget);
    }
  });

  // Type-specific rendering
  switch (widgetConfig.type) {
    case 'digital-clock': setupDigitalClock(widget); break;
    case 'analog-minimalist': setupAnalogMinimalist(widget); break;
    case 'analog-numbered': setupAnalogNumbered(widget); break;
    case 'weather': setupWeather(widget); break;
    case 'weather-detailed': setupWeatherDetailed(widget); break;
    case 'clock-weather': setupClockWeather(widget); break;
    case 'astronomy': setupAstronomy(widget); break;
    case 'aqi': setupAQI(widget); break;
    case 'custom-text': setupCustomText(widget); break;
    case 'embed-html': setupEmbedHTML(widget); break;
    case 'battery': setupBattery(widget); break;
    case 'countdown': setupCountdown(widget); break;
    case 'quote': setupQuote(widget); break;
    case 'calendar': setupCalendar(widget); break;
  }

  widgetContainer.appendChild(widgetDiv);
  activeWidgets.push(widget);
}

// ── Widget Implementations ──────────────────────────────────────────

const WEATHER_API_KEY = '5fcb015a41ea49dc92e170240261605';

function setupDigitalClock(widget) {
  const timeEl = document.createElement('div');
  timeEl.className = 'digital-time';
  const dateEl = document.createElement('div');
  dateEl.className = 'digital-date';
  widget.element.appendChild(timeEl);
  widget.element.appendChild(dateEl);

  function update() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    let ampm = '';
    if (widget.config.format12h) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }
    timeEl.textContent = widget.config.showSeconds !== false
      ? `${hours}:${minutes}:${seconds}${ampm}`
      : `${hours}:${minutes}${ampm}`;
    if (widget.config.showDate) {
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      dateEl.textContent = now.toLocaleDateString(undefined, options);
    } else {
      dateEl.textContent = '';
    }
  }

  if (isInteractive) {
    timeEl.style.cursor = 'pointer';
    // Left-click: toggle 12h/24h
    timeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      widget.config.format12h = !widget.config.format12h;
      update();
      notifyConfigChange(widget);
    });
    // Right-click: context menu
    widget.element.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      document.querySelectorAll('.widget-ctx-menu').forEach(m => m.remove());
      const menu = document.createElement('div');
      menu.className = 'widget-ctx-menu';
      const items = [
        { label: `${widget.config.format12h ? '✓ ' : ''}12h Format`, action: () => { widget.config.format12h = !widget.config.format12h; update(); notifyConfigChange(widget); } },
        { label: `${widget.config.showDate ? '✓ ' : ''}Show Date`, action: () => { widget.config.showDate = !widget.config.showDate; update(); notifyConfigChange(widget); } },
        { label: `${widget.config.showSeconds !== false ? '✓ ' : ''}Show Seconds`, action: () => { widget.config.showSeconds = !(widget.config.showSeconds !== false); update(); notifyConfigChange(widget); } },
      ];
      items.forEach(item => {
        const li = document.createElement('div');
        li.className = 'ctx-menu-item';
        li.textContent = item.label;
        li.addEventListener('click', (ev) => { ev.stopPropagation(); item.action(); menu.remove(); });
        menu.appendChild(li);
      });
      const rect = widget.element.getBoundingClientRect();
      menu.style.left = `${e.clientX - rect.left}px`;
      menu.style.top = `${e.clientY - rect.top}px`;
      widget.element.style.position = 'absolute';
      widget.element.appendChild(menu);
      document.addEventListener('click', () => menu.remove(), { once: true });
    });
  }

  update();
  const interval = setInterval(update, 1000);
  widget.cleanup = () => clearInterval(interval);
}

function buildAnalogFace(type) {
  if (type === 'numbered') {
    let numbersHtml = '';
    for (let i = 1; i <= 12; i++) {
      const angle = (i * 30) * (Math.PI / 180);
      const x = Math.sin(angle) * 85, y = -Math.cos(angle) * 85;
      numbersHtml += `<div class="number" style="transform:translate(calc(-50% + ${x}px),calc(-50% + ${y}px))">${i}</div>`;
    }
    return `<div class="analog-clock numbered"><div class="face">${numbersHtml}<div class="hand hour"></div><div class="hand minute"></div><div class="hand second"></div><div class="center-dot"></div></div></div>`;
  }
  return `<div class="analog-clock minimalist"><div class="face"><div class="hand hour"></div><div class="hand minute"></div><div class="hand second"></div><div class="center-dot"></div></div></div>`;
}

// Starts (or restarts) the rAF animation loop for an analog clock.
// Does NOT attach any event listeners — call this as many times as needed.
function startAnalogClock(widget) {
  widget.element.innerHTML = buildAnalogFace(widget.config.analogFace);
  const hr = widget.element.querySelector('.hour');
  const min = widget.element.querySelector('.minute');
  const sec = widget.element.querySelector('.second');
  let running = true;
  function tick() {
    if (!running) return;
    const now = new Date();
    const s = now.getSeconds(), m = now.getMinutes(), h = now.getHours();
    sec.style.transform = `rotate(${(s / 60) * 360}deg)`;
    min.style.transform = `rotate(${(m / 60) * 360 + (s / 60) * 6}deg)`;
    hr.style.transform  = `rotate(${(h / 12) * 360 + (m / 60) * 30}deg)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  // Expose a stop handle so the previous loop can be killed before restarting
  widget._analogStop = () => { running = false; };
  widget.cleanup    = () => { running = false; };
}

function setupAnalogMinimalist(widget) {
  if (!widget.config.analogFace) widget.config.analogFace = 'minimalist';
  startAnalogClock(widget);
  // Attach the right-click toggle ONCE for the lifetime of this widget
  if (isInteractive) {
    widget.element.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      // Stop the current rAF loop before rebuilding DOM
      if (widget._analogStop) widget._analogStop();
      widget.config.analogFace = widget.config.analogFace === 'numbered' ? 'minimalist' : 'numbered';
      notifyConfigChange(widget);
      startAnalogClock(widget); // restarts loop, replaces innerHTML only
    });
  }
}

function setupAnalogNumbered(widget) {
  if (!widget.config.analogFace) widget.config.analogFace = 'numbered';
  startAnalogClock(widget);
  // Attach the right-click toggle ONCE for the lifetime of this widget
  if (isInteractive) {
    widget.element.addEventListener('contextmenu', (e) => {
      e.preventDefault(); e.stopPropagation();
      if (widget._analogStop) widget._analogStop();
      widget.config.analogFace = widget.config.analogFace === 'numbered' ? 'minimalist' : 'numbered';
      notifyConfigChange(widget);
      startAnalogClock(widget);
    });
  }
}

function addRefreshButton(widget, refreshFn) {
  if (!isInteractive) return;
  const btn = document.createElement('button');
  btn.className = 'widget-action-btn widget-refresh-btn';
  btn.innerHTML = '🔄';
  btn.title = 'Refresh';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.add('spinning');
    setTimeout(() => btn.classList.remove('spinning'), 600);
    refreshFn();
  });
  widget.element.style.position = 'absolute';
  widget.element.appendChild(btn);
}

// Map WeatherAPI condition codes to background tint colors
const CONDITION_TINTS = {
  sunny:   'rgba(251,191,36,0.07)',
  clear:   'rgba(251,191,36,0.07)',
  rain:    'rgba(59,130,246,0.08)',
  drizzle: 'rgba(59,130,246,0.06)',
  snow:    'rgba(186,230,253,0.1)',
  thunder: 'rgba(139,92,246,0.1)',
  fog:     'rgba(156,163,175,0.1)',
  mist:    'rgba(156,163,175,0.08)',
  cloud:   'rgba(107,114,128,0.07)',
  overcast:'rgba(107,114,128,0.09)',
};
function conditionTint(text) {
  const t = (text || '').toLowerCase();
  for (const [key, val] of Object.entries(CONDITION_TINTS)) { if (t.includes(key)) return val; }
  return 'transparent';
}
function fmtTemp(c, useFahrenheit) {
  if (useFahrenheit) return `${Math.round(c * 9/5 + 32)}°F`;
  return `${Math.round(c)}°C`;
}
function unitLabel(useFahrenheit) { return useFahrenheit ? '°F' : '°C'; }

async function setupWeather(widget) {
  const weatherEl = widget.element;
  let lastData = null;

  function render() {
    if (!lastData) return;
    const d = lastData;
    const isFah = !!widget.config.useFahrenheit;
    const temp = fmtTemp(d.current.temp_c, isFah);
    const condition = d.current.condition.text;
    const iconUrl = 'https:' + d.current.condition.icon;
    const city = d.location.name, country = d.location.country;
    const tint = conditionTint(condition);
    weatherEl.innerHTML = `
      <div class="weather-widget-wrap" style="background:${tint};border-radius:14px;padding:4px 8px;">
        <div class="weather-info-main">
          <div class="weather-temp unit-toggle" title="Click to toggle °C/°F" style="cursor:pointer">${temp}</div>
          <div class="weather-icon"><img src="${iconUrl}" alt="${condition}"></div>
        </div>
        <div class="weather-location">${city}, ${country}</div>
      </div>
    `;
    addRefreshButton(widget, update);
    if (isInteractive) {
      weatherEl.querySelector('.unit-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        widget.config.useFahrenheit = !widget.config.useFahrenheit;
        notifyConfigChange(widget);
        render();
      });
    }
  }

  async function update() {
    try {
      const query = widget.config.locationQuery || 'auto:ip';
      const resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      lastData = data;
      render();
    } catch (err) {
      console.error('[Weather] Failed:', err);
      weatherEl.textContent = 'Weather Error';
    }
  }
  update();
  const interval = setInterval(update, 30 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupWeatherDetailed(widget) {
  const weatherEl = widget.element;
  let lastData = null;
  let forecastExpanded = false;

  function render() {
    if (!lastData) return;
    const d = lastData;
    const isFah = !!widget.config.useFahrenheit;
    const temp = fmtTemp(d.current.temp_c, isFah);
    const feelsLike = fmtTemp(d.current.feelslike_c, isFah);
    const condition = d.current.condition.text;
    const iconUrl = 'https:' + d.current.condition.icon;
    const humidity = d.current.humidity, wind = d.current.wind_kph, uv = d.current.uv;
    const city = d.location.name, country = d.location.country;
    const tint = conditionTint(condition);
    const ul = unitLabel(isFah);
    const windUnit = isFah ? `${Math.round(d.current.wind_mph)} mph` : `${wind} km/h`;

    let forecastHtml = '';
    if (forecastExpanded && d.forecast) {
      forecastHtml = '<div class="weather-forecast-row">';
      d.forecast.forecastday.forEach(day => {
        const hi = fmtTemp(day.day.maxtemp_c, isFah);
        const lo = fmtTemp(day.day.mintemp_c, isFah);
        const label = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
        forecastHtml += `<div class="forecast-day"><img src="https:${day.day.condition.icon}" style="width:20px"><div class="forecast-label">${label}</div><div class="forecast-hi">${hi}</div><div class="forecast-lo">${lo}</div></div>`;
      });
      forecastHtml += '</div>';
    }

    weatherEl.innerHTML = `
      <div class="weather-detailed-grid" style="background:${tint};border-radius:14px;">
        <div class="weather-main-row">
          <div class="weather-temp-large unit-toggle" title="Click to toggle ${ul}" style="cursor:pointer">${temp}</div>
          <img src="${iconUrl}" alt="${condition}">
        </div>
        <div class="weather-condition-text">${condition}</div>
        <div class="weather-location-small">${city}, ${country}</div>
        <div class="weather-stats-grid">
          <div class="stat-item"><span>Feels Like:</span> ${feelsLike}</div>
          <div class="stat-item"><span>Humidity:</span> ${humidity}%</div>
          <div class="stat-item"><span>Wind:</span> ${windUnit}</div>
          <div class="stat-item"><span>UV Index:</span> ${uv}</div>
        </div>
        ${isInteractive ? `<button class="weather-forecast-toggle">${forecastExpanded ? '▲ Hide Forecast' : '▼ 3-Day Forecast'}</button>` : ''}
        ${forecastHtml}
      </div>
    `;
    addRefreshButton(widget, update);
    if (isInteractive) {
      weatherEl.querySelector('.unit-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        widget.config.useFahrenheit = !widget.config.useFahrenheit;
        notifyConfigChange(widget);
        render();
      });
      weatherEl.querySelector('.weather-forecast-toggle')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        forecastExpanded = !forecastExpanded;
        if (forecastExpanded && !d.forecast) await updateWithForecast();
        else render();
      });
    }
  }

  async function update() {
    try {
      const query = widget.config.locationQuery || 'auto:ip';
      const resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      lastData = data;
      render();
    } catch (err) { console.error('[Weather Detailed] Error:', err); }
  }

  async function updateWithForecast() {
    try {
      const query = widget.config.locationQuery || 'auto:ip';
      const resp = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&days=3`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      lastData = data;
      render();
    } catch (err) { console.error('[Forecast] Error:', err); forecastExpanded = false; render(); }
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
      const query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!data.error) {
        const isFah = !!widget.config.useFahrenheit;
        const temp = fmtTemp(data.current.temp_c, isFah);
        weatherInner.innerHTML = `
          <div class="clock-weather-info">
            <img src="https:${data.current.condition.icon}" style="width:24px;">
            <span class="unit-toggle" style="cursor:pointer" title="Toggle °C/°F">${temp}</span>
          </div>
          <div class="weather-location-tiny">${data.location.name}</div>
        `;
        if (isInteractive) {
          weatherInner.querySelector('.unit-toggle')?.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.config.useFahrenheit = !widget.config.useFahrenheit;
            notifyConfigChange(widget);
            updateWeather();
          });
        }
      }
    } catch(e){}
  }

  updateTime(); updateWeather();
  const tInt = setInterval(updateTime, 1000);
  const wInt = setInterval(updateWeather, 30 * 60 * 1000);
  widget.cleanup = () => { clearInterval(tInt); clearInterval(wInt); };
}

async function setupAstronomy(widget) {
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/astronomy.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const a = data.astronomy.astro;
      const city = data.location.name, country = data.location.country;
      widget.element.innerHTML = `
        <div class="astro-widget">
          <div class="astro-item">🌅 <span>Sunrise:</span> ${a.sunrise}</div>
          <div class="astro-item">🌇 <span>Sunset:</span> ${a.sunset}</div>
          <div class="astro-item">🌙 <span>Moon:</span> ${a.moon_phase}</div>
          <div class="weather-location-small" style="margin-top: 5px; opacity: 0.5;">${city}, ${country}</div>
        </div>
      `;
      addRefreshButton(widget, update);
    } catch(e){}
  }
  update();
  const interval = setInterval(update, 60 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupAQI(widget) {
  const AQI_ADVISORIES = [
    '', // 0 (unused)
    'Air quality is satisfactory.',                         // 1 Good
    'Acceptable; some pollutants may concern sensitive.',   // 2 Moderate
    'Sensitive groups may experience effects.',             // 3 Unhealthy (SG)
    'Everyone may experience health effects.',              // 4 Unhealthy
    'Health alert — everyone is affected.',                 // 5 Very Unhealthy
    'Health emergency — everyone is at risk.',              // 6 Hazardous
  ];

  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&aqi=yes`);
      const data = await res.json();
      const air = data.current.air_quality;
      const aqiIdx = air['us-epa-index'];
      const pm25 = Math.round(air['pm2_5']);
      const city = data.location.name, country = data.location.country;
      const labels = ['', 'Good', 'Moderate', 'Unhealthy (SG)', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
      const colors = ['', '#10b981', '#fbbf24', '#f59e0b', '#ef4444', '#b91c1c', '#7f1d1d'];
      const tintColors = ['', 'rgba(16,185,129,0.08)', 'rgba(251,191,36,0.08)', 'rgba(245,158,11,0.08)', 'rgba(239,68,68,0.08)', 'rgba(185,28,28,0.1)', 'rgba(127,29,29,0.12)'];
      const advisory = AQI_ADVISORIES[aqiIdx] || '';
      widget.element.innerHTML = `
        <div class="aqi-widget" style="border-left:4px solid ${colors[aqiIdx]||'#ccc'};background-color:${tintColors[aqiIdx]||'transparent'}">
          <div class="aqi-value">Level ${aqiIdx}: ${labels[aqiIdx] || 'Unknown'}</div>
          <div class="aqi-pm">PM2.5: ${pm25} µg/m³</div>
          ${advisory ? `<div class="aqi-advisory">${advisory}</div>` : ''}
          <div class="weather-location-small" style="margin-top:4px;opacity:0.5">${city}, ${country}</div>
        </div>
      `;
      addRefreshButton(widget, update);
    } catch(e){}
  }
  update();
  const interval = setInterval(update, 30 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

function setupCustomText(widget) {
  const textEl = document.createElement('div');
  textEl.className = 'custom-text-content';
  textEl.textContent = widget.config.customText || 'Custom Text';
  widget.element.appendChild(textEl);

  // Interactive: double-click to edit inline
  if (isInteractive) {
    textEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      textEl.contentEditable = 'true';
      textEl.focus();
      // Request window focus so keyboard input works
      if (window.wallpaperAPI && window.wallpaperAPI.overlayRequestFocus) {
        window.wallpaperAPI.overlayRequestFocus();
      }
    });
    textEl.addEventListener('blur', () => {
      textEl.contentEditable = 'false';
      widget.config.customText = textEl.textContent;
      notifyConfigChange(widget);
      // Release window focus
      if (window.wallpaperAPI && window.wallpaperAPI.overlayReleaseFocus) {
        window.wallpaperAPI.overlayReleaseFocus();
      }
    });
    textEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); }
    });
  }
}

function setupEmbedHTML(widget) {
  function render() {
    widget.element.innerHTML = `<div class="embed-container">${widget.config.embedCode || ''}</div>`;
    if (isInteractive) {
      const btn = document.createElement('button');
      btn.className = 'widget-action-btn embed-reload-btn';
      btn.innerHTML = '🔄';
      btn.title = 'Reload embed';
      btn.style.position = 'absolute';
      btn.style.top = '4px';
      btn.style.right = '4px';
      btn.addEventListener('click', (e) => { e.stopPropagation(); render(); });
      widget.element.style.position = 'absolute';
      widget.element.appendChild(btn);
    }
  }
  render();
}

function setupCalendar(widget) {
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();
  const MARK_COLORS = ['#f59e0b','#10b981','#ef4444','#6366f1','#ec4899','#06b6d4','#f97316','#a3e635'];

  function getMarks() {
    return widget.config.marks || widget.marks || {};
  }

  function isoDate(y, m, d) {
    return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }

  let openPopover = null;

  function closePopover() {
    if (openPopover) { openPopover.remove(); openPopover = null; }
  }

  function showMarkPopover(dayEl, iso) {
    closePopover();
    const marks = getMarks();
    const existing = marks[iso] || null;
    let chosenColor = existing ? existing.color : MARK_COLORS[0];

    const pop = document.createElement('div');
    pop.className = 'mark-popover';

    // Swatches
    const swatchRow = document.createElement('div');
    swatchRow.className = 'mark-popover-swatches';
    MARK_COLORS.forEach(c => {
      const sw = document.createElement('span');
      sw.className = 'mark-popover-swatch' + (c === chosenColor ? ' active' : '');
      sw.style.background = c;
      sw.addEventListener('click', (e) => {
        e.stopPropagation();
        chosenColor = c;
        swatchRow.querySelectorAll('.mark-popover-swatch').forEach(s => s.classList.remove('active'));
        sw.classList.add('active');
      });
      swatchRow.appendChild(sw);
    });
    pop.appendChild(swatchRow);

    // Label input
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.className = 'mark-popover-label';
    labelInput.placeholder = 'Label (optional)';
    labelInput.value = existing ? (existing.label || '') : '';
    pop.appendChild(labelInput);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'mark-popover-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'mark-popover-save';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!widget.config.marks) widget.config.marks = {};
      widget.config.marks[iso] = { color: chosenColor, label: labelInput.value.trim() };
      notifyConfigChange(widget);
      closePopover();
      render();
    });
    actions.appendChild(saveBtn);

    if (existing) {
      const delBtn = document.createElement('button');
      delBtn.className = 'mark-popover-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (widget.config.marks) delete widget.config.marks[iso];
        notifyConfigChange(widget);
        closePopover();
        render();
      });
      actions.appendChild(delBtn);
    }

    pop.appendChild(actions);

    // Position popover relative to widget element
    const dayRect = dayEl.getBoundingClientRect();
    const widgetRect = widget.element.getBoundingClientRect();
    pop.style.left = `${dayRect.left - widgetRect.left}px`;
    pop.style.top  = `${dayRect.bottom - widgetRect.top + 4}px`;

    widget.element.style.position = 'absolute';
    widget.element.appendChild(pop);
    openPopover = pop;
    labelInput.focus();
  }

  function render() {
    closePopover();
    const now = new Date();
    const today = now.getDate();
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const marks = getMarks();

    // Count marks in prev/next month
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    const prevCount = Object.keys(marks).filter(k => k.startsWith(`${prevY}-${String(prevM+1).padStart(2,'0')}`)).length;
    const nextCount = Object.keys(marks).filter(k => k.startsWith(`${nextY}-${String(nextM+1).padStart(2,'0')}`)).length;

    let html = `<div class="calendar-widget">`;
    if (isInteractive) {
      html += `<div class="calendar-nav">
        <button class="calendar-nav-btn" id="cal-prev">${prevCount ? `◀ ${prevCount}` : '◀'}</button>
        <div class="calendar-header">${monthNames[viewMonth]} ${viewYear}</div>
        <button class="calendar-nav-btn" id="cal-next">${nextCount ? `${nextCount} ▶` : '▶'}</button>
      </div>`;
    } else {
      html += `<div class="calendar-header">${monthNames[viewMonth]} ${viewYear}</div>`;
    }
    html += `<div class="calendar-grid">
      <div class="day-name">S</div><div class="day-name">M</div><div class="day-name">T</div>
      <div class="day-name">W</div><div class="day-name">T</div><div class="day-name">F</div><div class="day-name">S</div>`;
    for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
      const iso = isoDate(viewYear, viewMonth, i);
      const dayMarks = Object.keys(marks)
        .filter(k => k === iso)
        .map(k => marks[k]);
      const todayCls = (isCurrentMonth && i === today) ? ' today' : '';
      const interactiveCls = isInteractive ? ' interactive-day' : '';
      let marksHtml = '';
      if (dayMarks.length === 1) {
        const m = dayMarks[0];
        marksHtml = `<div class="mark-dots"><span class="mark-dot" style="background:${m.color}"></span></div>`;
        if (m.label) marksHtml += `<span class="mark-pill" style="background:${m.color}20;color:${m.color}">${m.label}</span>`;
      } else if (dayMarks.length > 1) {
        const dots = dayMarks.slice(0, 3).map(m => `<span class="mark-dot" style="background:${m.color}"></span>`).join('');
        marksHtml = `<div class="mark-dots">${dots}</div><span class="mark-count-badge">+${dayMarks.length}</span>`;
      }
      html += `<div class="day${todayCls}${interactiveCls}" data-iso="${iso}">${i}${marksHtml}</div>`;
    }
    html += `</div></div>`;
    widget.element.innerHTML = html;

    // Nav handlers
    if (isInteractive) {
      const prev = widget.element.querySelector('#cal-prev');
      const next = widget.element.querySelector('#cal-next');
      if (prev) prev.addEventListener('click', (e) => {
        e.stopPropagation();
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        render();
      });
      if (next) next.addEventListener('click', (e) => {
        e.stopPropagation();
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        render();
      });

      // Click-to-mark day cells
      widget.element.querySelectorAll('.day.interactive-day').forEach(dayEl => {
        dayEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (e.target.closest('.calendar-nav-btn')) return;
          showMarkPopover(dayEl, dayEl.dataset.iso);
        });
      });
    }

    // Close popover on outside click
    document.addEventListener('click', closePopover, { once: true });
  }

  render();
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeout = setTimeout(() => { render(); setInterval(render, 24*60*60*1000); }, nextDay - now);
  widget.cleanup = () => { clearTimeout(timeout); closePopover(); };
}

async function setupBattery(widget) {
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `~${h}h ${m}m`;
    return `~${m}m`;
  }

  let alertThreshold = widget.config.lowBatteryAlert ?? 15;
  let alertFired = false;

  async function update() {
    try {
      const battery = await navigator.getBattery();
      const level = Math.round(battery.level * 100);
      const charging = battery.charging;
      const timeLeft = charging
        ? formatTime(battery.chargingTime)
        : formatTime(battery.dischargingTime);

      // Low battery alert
      if (!charging && level <= alertThreshold && !alertFired && widget.config.lowBatteryAlert !== false) {
        alertFired = true;
        if (Notification.permission === 'granted') {
          new Notification('DeskX — Low Battery', { body: `Battery at ${level}%. Please plug in.`, icon: '' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification('DeskX — Low Battery', { body: `Battery at ${level}%.` });
          });
        }
      }
      if (charging || level > alertThreshold) alertFired = false;

      widget.element.innerHTML = `
        <div class="battery-widget ${level < 20 ? 'low' : ''}">
          <div class="battery-icon-wrapper">
            <div class="battery-level" style="width:${level}%"></div>
            ${charging ? '<div class="charging-bolt">⚡</div>' : ''}
          </div>
          <div class="battery-text">${level}%</div>
          ${timeLeft ? `<div class="battery-time">${charging ? '⚡' : '🔋'} ${timeLeft}</div>` : ''}
        </div>
      `;
    } catch(e) { widget.element.textContent = 'Battery Not Supported'; }
  }
  update();
  const interval = setInterval(update, 60000);
  widget.cleanup = () => clearInterval(interval);
}

function setupCountdown(widget) {
  let targetDate = new Date(widget.config.targetDate || Date.now() + 86400000);
  let isEditing = false;
  let isDateEditing = false;

  // Build DOM once — update only the changing parts each tick
  widget.element.innerHTML = `
    <div class="countdown-widget" id="cd-root">
      <div class="countdown-label" id="cd-label"></div>
      <div class="countdown-timer" id="cd-timer"></div>
    </div>
  `;
  widget.element.style.position = 'absolute';

  const rootEl  = widget.element.querySelector('#cd-root');
  const labelEl = widget.element.querySelector('#cd-label');
  const timerEl = widget.element.querySelector('#cd-timer');

  // ── Label inline edit ────────────────────────────────────────────
  function setupLabelEdit() {
    if (!isInteractive) return;
    labelEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isEditing = true;
      labelEl.contentEditable = 'true';
      labelEl.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(labelEl);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      if (window.wallpaperAPI?.overlayRequestFocus) window.wallpaperAPI.overlayRequestFocus();
    });
    labelEl.addEventListener('blur', () => {
      isEditing = false;
      labelEl.contentEditable = 'false';
      widget.config.label = labelEl.textContent.trim() || 'Countdown';
      notifyConfigChange(widget);
      if (window.wallpaperAPI?.overlayReleaseFocus) window.wallpaperAPI.overlayReleaseFocus();
    });
    labelEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); labelEl.blur(); }
      if (e.key === 'Escape') { labelEl.textContent = widget.config.label || 'Countdown'; labelEl.blur(); }
    });
  }

  // ── Inline date picker ───────────────────────────────────────────
  function showDatePicker() {
    if (isDateEditing) return;
    isDateEditing = true;
    const existing = widget.element.querySelector('.cd-date-popover');
    if (existing) { existing.remove(); isDateEditing = false; return; }

    const popover = document.createElement('div');
    popover.className = 'cd-date-popover';
    // Format current targetDate as local datetime-local value
    const pad = n => String(n).padStart(2, '0');
    const d = targetDate;
    const localStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    popover.innerHTML = `
      <div class="cd-popover-label">Set Target Date</div>
      <input class="cd-date-input" type="datetime-local" value="${localStr}">
      <div class="cd-popover-actions">
        <button class="cd-save-btn">Save</button>
        <button class="cd-cancel-btn">Cancel</button>
      </div>
    `;
    rootEl.appendChild(popover);
    if (window.wallpaperAPI?.overlayRequestFocus) window.wallpaperAPI.overlayRequestFocus();

    const input = popover.querySelector('.cd-date-input');
    input.focus();

    popover.querySelector('.cd-save-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (input.value) {
        widget.config.targetDate = input.value;
        targetDate = new Date(input.value);
        notifyConfigChange(widget);
      }
      popover.remove();
      isDateEditing = false;
      if (window.wallpaperAPI?.overlayReleaseFocus) window.wallpaperAPI.overlayReleaseFocus();
    });
    popover.querySelector('.cd-cancel-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      popover.remove();
      isDateEditing = false;
      if (window.wallpaperAPI?.overlayReleaseFocus) window.wallpaperAPI.overlayReleaseFocus();
    });
    // Stop clicks inside popover from bubbling to the drag system
    popover.addEventListener('click', e => e.stopPropagation());
    popover.addEventListener('mousedown', e => e.stopPropagation());
  }

  // ── Tick — only updates text content, never replaces DOM ─────────
  function update() {
    if (isEditing || isDateEditing) return; // never clobber active input

    const label = widget.config.label || 'Countdown';
    if (labelEl.contentEditable !== 'true') labelEl.textContent = label;

    const diff = targetDate - new Date();
    if (diff <= 0) {
      timerEl.innerHTML = `<span class="finished-text">${label} Finished! 🎉</span>`;
      rootEl.classList.add('countdown-glow');
      return;
    }
    rootEl.classList.remove('countdown-glow');
    const dd = Math.floor(diff / (1000*60*60*24));
    const hh = Math.floor((diff / (1000*60*60)) % 24);
    const mm = Math.floor((diff / (1000*60)) % 60);
    const ss = Math.floor((diff / 1000) % 60);
    // Update each segment individually — no innerHTML swap on the whole widget
    timerEl.innerHTML = `<span>${dd}d</span> <span>${hh}h</span> <span>${mm}m</span> <span id="cd-sec">${ss}s</span>`;

    if (isInteractive) {
      timerEl.style.cursor = 'pointer';
      timerEl.title = 'Click to change target date';
    }
  }

  setupLabelEdit();

  if (isInteractive) {
    timerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      showDatePicker();
    });
    labelEl.title = 'Double-click to rename';
  }

  update();
  const interval = setInterval(update, 1000);
  widget.cleanup = () => clearInterval(interval);
}

async function setupQuote(widget) {
  let currentQuote = { text: '', author: '' };
  let allQuotes = [];
  let favMode = false; // true when cycling through favourites

  function getFavs() { return widget.config.favourites || []; }

  function addCopyButton() {
    if (!isInteractive) return;
    const existing = widget.element.querySelector('.widget-copy-btn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'widget-action-btn widget-copy-btn';
    btn.innerHTML = '📋';
    btn.title = 'Copy quote';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(`"${currentQuote.text}" — ${currentQuote.author}`).then(() => {
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 2000);
      });
    });
    widget.element.style.position = 'absolute';
    widget.element.appendChild(btn);
  }

  function addHeartButton() {
    if (!isInteractive) return;
    const existing = widget.element.querySelector('.widget-heart-btn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'widget-action-btn widget-heart-btn';
    const favs = getFavs();
    const isFaved = favs.some(f => f.text === currentQuote.text);
    btn.innerHTML = isFaved ? '❤️' : '🤍';
    btn.title = isFaved ? 'Remove from favourites' : 'Save to favourites';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!widget.config.favourites) widget.config.favourites = [];
      const idx = widget.config.favourites.findIndex(f => f.text === currentQuote.text);
      if (idx === -1) {
        widget.config.favourites.push({ ...currentQuote });
        btn.innerHTML = '❤️';
      } else {
        widget.config.favourites.splice(idx, 1);
        btn.innerHTML = '🤍';
      }
      notifyConfigChange(widget);
    });
    widget.element.style.position = 'absolute';
    widget.element.appendChild(btn);
  }

  function addFavModeButton() {
    if (!isInteractive || getFavs().length === 0) return;
    const existing = widget.element.querySelector('.widget-fav-btn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.className = 'widget-action-btn widget-fav-btn';
    btn.innerHTML = favMode ? '🌐' : '⭐';
    btn.title = favMode ? 'Switch to random quotes' : 'Cycle favourites';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      favMode = !favMode;
      showNext();
    });
    widget.element.style.position = 'absolute';
    widget.element.appendChild(btn);
  }

  function renderQuote() {
    widget.element.innerHTML = `
      <div class="quote-widget">
        <div class="quote-text">"${currentQuote.text}"</div>
        <div class="quote-author">— ${currentQuote.author}</div>
      </div>
    `;
    addRefreshButton(widget, showNext);
    addCopyButton();
    addHeartButton();
    addFavModeButton();
  }

  let favIndex = 0;
  function showNext() {
    if (favMode && getFavs().length > 0) {
      const favs = getFavs();
      currentQuote = favs[favIndex % favs.length];
      favIndex++;
      renderQuote();
    } else {
      fetchRandom();
    }
  }

  async function fetchRandom() {
    try {
      if (allQuotes.length === 0) {
        const res = await fetch('https://type.fit/api/quotes');
        allQuotes = await res.json();
      }
      if (Array.isArray(allQuotes) && allQuotes.length > 0) {
        const q = allQuotes[Math.floor(Math.random() * allQuotes.length)];
        currentQuote = { text: q.text, author: q.author ? q.author.split(',')[0] : 'Unknown' };
        renderQuote();
      }
    } catch(e) {
      widget.element.innerHTML = '<div class="quote-error">Failed to load quote</div>';
    }
  }

  if (isInteractive) {
    widget.element.style.cursor = 'pointer';
    widget.element.addEventListener('click', (e) => {
      if (!e.target.closest('.widget-action-btn') && !dragState) showNext();
    });
  }

  showNext();
  const interval = setInterval(showNext, 2 * 60 * 60 * 1000);
  widget.cleanup = () => clearInterval(interval);
}

// ── Helpers ──────────────────────────────────────────────────────────

function notifyConfigChange(widget) {
  const idx = activeWidgets.indexOf(widget);
  if (idx !== -1 && window.wallpaperAPI && window.wallpaperAPI.overlayWidgetConfigChanged) {
    window.wallpaperAPI.overlayWidgetConfigChanged(idx, widget.config);
  }
}

// ── IPC Listeners ───────────────────────────────────────────────────

if (window.wallpaperAPI) {
  // Receive full widget set from main
  window.wallpaperAPI.onSetWidgets && window.wallpaperAPI.onSetWidgets((widgets) => {
    console.log('[Overlay] Received widgets:', widgets.length);
    clearWidgets();
    (widgets || []).forEach(addWidget);
  });

  // Receive interactivity state
  window.wallpaperAPI.onSetOverlayMode && window.wallpaperAPI.onSetOverlayMode((mode) => {
    console.log('[Overlay] Mode update:', mode);
    isDraggable = mode.draggable !== false;
    isInteractive = mode.interactive !== false;

    // Update existing widgets
    activeWidgets.forEach(w => {
      if (isDraggable) w.element.classList.add('draggable');
      else w.element.classList.remove('draggable');
      if (!isInteractive) w.element.classList.add('non-interactive');
      else w.element.classList.remove('non-interactive');
    });
  });
}
