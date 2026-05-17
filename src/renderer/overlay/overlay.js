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

  // Interactive: click to toggle 12h/24h
  if (isInteractive) {
    timeEl.style.cursor = 'pointer';
    timeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      widget.config.format12h = !widget.config.format12h;
      update();
      notifyConfigChange(widget);
    });
  }

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
    timeEl.textContent = `${hours}:${minutes}:${seconds}${ampm}`;
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

  let running = true;
  function update() {
    if (!running) return;
    const now = new Date();
    const s = now.getSeconds(), m = now.getMinutes(), h = now.getHours();
    sec.style.transform = `rotate(${(s / 60) * 360}deg)`;
    min.style.transform = `rotate(${(m / 60) * 360 + (s / 60) * 6}deg)`;
    hr.style.transform = `rotate(${(h / 12) * 360 + (m / 60) * 30}deg)`;
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
  widget.cleanup = () => { running = false; };
}

function setupAnalogNumbered(widget) {
  let numbersHtml = '';
  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const x = Math.sin(angle) * 85, y = -Math.cos(angle) * 85;
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

  let running = true;
  function update() {
    if (!running) return;
    const now = new Date();
    const s = now.getSeconds(), m = now.getMinutes(), h = now.getHours();
    sec.style.transform = `rotate(${(s / 60) * 360}deg)`;
    min.style.transform = `rotate(${(m / 60) * 360 + (s / 60) * 6}deg)`;
    hr.style.transform = `rotate(${(h / 12) * 360 + (m / 60) * 30}deg)`;
    requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
  widget.cleanup = () => { running = false; };
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

async function setupWeather(widget) {
  const weatherEl = widget.element;
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const temp = Math.round(data.current.temp_c);
      const condition = data.current.condition.text;
      const iconUrl = 'https:' + data.current.condition.icon;
      const city = data.location.name, country = data.location.country;
      weatherEl.innerHTML = `
        <div class="weather-info-main">
          <div class="weather-temp">${temp}°C</div>
          <div class="weather-icon"><img src="${iconUrl}" alt="${condition}"></div>
        </div>
        <div class="weather-location">${city}, ${country}</div>
      `;
      addRefreshButton(widget, update);
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
  async function update() {
    try {
      let query = widget.config.locationQuery || 'auto:ip';
      const resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      const temp = Math.round(data.current.temp_c);
      const condition = data.current.condition.text;
      const iconUrl = 'https:' + data.current.condition.icon;
      const feelsLike = Math.round(data.current.feelslike_c);
      const humidity = data.current.humidity, wind = data.current.wind_kph, uv = data.current.uv;
      const city = data.location.name, country = data.location.country;
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
      addRefreshButton(widget, update);
    } catch (err) { console.error('[Weather Detailed] Error:', err); }
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
      let query = widget.config.locationQuery || 'auto:ip';
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}`);
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
      widget.element.innerHTML = `
        <div class="aqi-widget" style="border-left: 4px solid ${colors[aqiIdx] || '#ccc'}">
          <div class="aqi-value">Level ${aqiIdx}: ${labels[aqiIdx] || 'Unknown'}</div>
          <div class="aqi-pm">PM2.5: ${pm25} µg/m³</div>
          <div class="weather-location-small" style="margin-top: 4px; opacity: 0.5;">${city}, ${country}</div>
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

  // Interactive: click to edit inline
  if (isInteractive) {
    textEl.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      textEl.contentEditable = 'true';
      textEl.focus();
    });
    textEl.addEventListener('blur', () => {
      textEl.contentEditable = 'false';
      widget.config.customText = textEl.textContent;
      notifyConfigChange(widget);
    });
    textEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); }
    });
  }
}

function setupEmbedHTML(widget) {
  widget.element.innerHTML = `<div class="embed-container">${widget.config.embedCode || ''}</div>`;
}

function setupCalendar(widget) {
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  function render() {
    const now = new Date();
    const today = now.getDate();
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    let html = `<div class="calendar-widget">`;
    if (isInteractive) {
      html += `<div class="calendar-nav">
        <button class="calendar-nav-btn" id="cal-prev">◀</button>
        <div class="calendar-header">${monthNames[viewMonth]} ${viewYear}</div>
        <button class="calendar-nav-btn" id="cal-next">▶</button>
      </div>`;
    } else {
      html += `<div class="calendar-header">${monthNames[viewMonth]} ${viewYear}</div>`;
    }
    html += `<div class="calendar-grid">
      <div class="day-name">S</div><div class="day-name">M</div><div class="day-name">T</div>
      <div class="day-name">W</div><div class="day-name">T</div><div class="day-name">F</div><div class="day-name">S</div>`;
    for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
      const cls = (isCurrentMonth && i === today) ? 'today' : '';
      html += `<div class="day ${cls}">${i}</div>`;
    }
    html += `</div></div>`;
    widget.element.innerHTML = html;

    // Attach nav handlers
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
    }
  }

  render();
  // Refresh at midnight
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeout = setTimeout(() => { render(); setInterval(render, 24*60*60*1000); }, nextDay - now);
  widget.cleanup = () => clearTimeout(timeout);
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
    } catch(e) { widget.element.textContent = 'Battery Not Supported'; }
  }
  update();
  const interval = setInterval(update, 60000);
  widget.cleanup = () => clearInterval(interval);
}

function setupCountdown(widget) {
  const targetDate = new Date(widget.config.targetDate || Date.now() + 86400000);
  const label = widget.config.label || 'Countdown';

  function update() {
    const diff = targetDate - new Date();
    if (diff <= 0) {
      widget.element.innerHTML = `<div class="countdown-finished">${label} Finished!</div>`;
      return;
    }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
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
        const q = data[Math.floor(Math.random() * data.length)];
        const author = q.author ? q.author.split(',')[0] : 'Unknown';
        widget.element.innerHTML = `
          <div class="quote-widget">
            <div class="quote-text">"${q.text}"</div>
            <div class="quote-author">— ${author}</div>
          </div>
        `;
        addRefreshButton(widget, update);
      }
    } catch(e) {
      widget.element.innerHTML = '<div class="quote-error">Failed to load quote</div>';
    }
  }

  // Interactive: click quote to refresh
  if (isInteractive) {
    widget.element.style.cursor = 'pointer';
    widget.element.addEventListener('click', (e) => {
      if (!e.target.closest('.widget-action-btn') && !dragState) update();
    });
  }

  update();
  const interval = setInterval(update, 2 * 60 * 60 * 1000);
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
