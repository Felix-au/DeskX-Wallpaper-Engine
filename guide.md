# DeskX — User Guide

A Windows desktop wallpaper engine that supports images, GIFs, videos, and interactive HTML — with a full multi-monitor **interactive widget overlay** system. Widgets live on a **3-layer transparent overlay** above your desktop and can be dragged, clicked, and interacted with directly — no settings window needed.

> [!IMPORTANT]
> **DeskX is fully standalone.** The installer bundles everything — Chromium, Node.js, and all native modules. No runtimes, no frameworks, no extra downloads. Just install and run.

---

## 🚀 How to Install

### Option A — Installer (Recommended)

1. Download **`DeskX-Setup.exe`** from [Releases](https://github.com/Felix-au/DeskX-Wallpaper-Engine/releases)
2. Double-click to install
3. DeskX launches automatically after installation

### Option B — Portable Version

1. Download **`DeskX-win32-x64-3.0.0.zip`** from [Releases](https://github.com/Felix-au/DeskX-Wallpaper-Engine/releases)
2. Extract the zip file to a folder of your choice
3. Run `DeskX.exe` from the extracted folder

### Option C — Build Yourself

```bash
git clone https://github.com/Felix-au/DeskX-Wallpaper-Engine.git
cd DeskX-Wallpaper-Engine
npm install
npm run build
```

Output files appear in `out/make/squirrel.windows/x64/DeskX-Setup.exe` and `out/make/zip/win32/x64/`.

### Option D — From Source (Dev)

```bash
git clone https://github.com/Felix-au/DeskX-Wallpaper-Engine.git
cd DeskX-Wallpaper-Engine
npm install
npm run dev
```

---

## 🎯 How to Use

### Setting a Wallpaper

1. **Launch DeskX** — the settings window opens. DeskX also appears in your system tray.
2. **Choose a mode** at the top:
   - **Same** — one wallpaper on all monitors (with independent widget sets per screen)
   - **Different** — unique wallpaper and widgets per monitor (click a monitor tile to select it)
   - **Span** — one wallpaper stretched across all monitors
3. **Add a wallpaper** — drag and drop a file, or click **Browse** to pick one.
4. **Choose a fit mode** — click one of the four preview cards:
   - **Cover** — fills the screen, may crop edges
   - **Contain** — fits entirely, may show bars
   - **Stretch** — fills exactly, may distort
   - **Center** — original size, centered
5. **Click Apply** — the wallpaper appears behind your desktop icons.

> [!NOTE]
> For **videos**, toggle Sound and Loop in the options panel below the fit preview. For **HTML** wallpapers, mouse and keyboard interaction is enabled by default.

### Removing a Wallpaper

- Click **Remove Wallpaper** in the settings window, or
- Right-click the system tray icon → **Remove All Wallpapers**

### System Tray

DeskX lives in your system tray. Right-click for:

| Action | Description |
|---|---|
| **Open Settings** | Show the settings window |
| **Pause / Resume** | Pause all wallpaper playback |
| **Mute / Unmute** | Toggle audio for video wallpapers |
| **🔒 Lock Widgets** | Disable drag-to-reposition on the desktop |
| **🚫 Disable Widget Interaction** | Make all widgets passive (no click/keyboard events) |
| **Remove All Wallpapers** | Reset desktop to default |
| **Quit** | Exit DeskX completely |

---

## 🧩 Using Widgets

Widgets are live overlays displayed directly on your desktop wallpaper — clocks, weather panels, calendars, countdowns, and more. They live on a **transparent overlay layer** above your desktop icons. Empty areas pass mouse clicks through to the desktop and icons normally.

### Opening the Widget Editor

1. In the settings window, click **Configure Widgets** in the sidebar.
2. The wallpaper preview area transforms into a drag-and-drop widget editor.

### Adding a Widget

- **Same Mode**: Each monitor section has its own **+ Add Widget** button.
- **Different Mode**: Select a monitor tile, then click **+ Add Widget**.
- A picker modal appears — scroll through all available widget types and click one to add it.

### Moving & Positioning

Drag any widget in the editor preview to set its initial position. Position is saved as a percentage of monitor size for resolution independence.

> [!TIP]
> You can also **drag widgets directly on your desktop** — no need to open the settings window.

### Configuring a Widget (Inspector)

Click a widget in the editor to select it. The **Widget Settings** panel shows:

| Control | Description |
|---|---|
| **Description** | Documents all desktop interactions available for this widget |
| **Scale** | Resize the widget (0.5× to 3×) |
| **Theme** | Light or Dark text mode |
| **Type-specific options** | City search, °F toggle, custom text, embed code, countdown date, etc. |
| **Draggable on Desktop** | Allow live drag-to-reposition (global toggle) |
| **Interactive on Desktop** | Enable widget interactions (global toggle) |
| **Float Above All Windows** | Move widget to topmost Z-order layer (above all apps) |

### Setting a City for Weather Widgets

1. Select a weather widget (Weather, Detailed Weather, Clock+Weather, Astronomy, AQI).
2. In the Inspector, find the **Location** field.
3. Type a city name — suggestions appear as you type.
4. Click a suggestion to confirm — a green flash confirms the city was set.

### Deleting a Widget

Select a widget in the editor, then click **Delete Widget** at the bottom of the inspector panel.

---

## 🖱️ Widget Desktop Interactions — Full Reference

### Digital Clock

| Interaction | Effect |
|---|---|
| **Left-click** the time | Toggle 12h ↔ 24h format |
| **Right-click** | Context menu: toggle 12h Format / Show Date / Show Seconds |

### Analog Minimalist / Analog Numbered

| Interaction | Effect |
|---|---|
| **Right-click** | Toggle face between minimalist (no numbers) ↔ numbered (1–12) — toggles back every click |

### Weather / Detailed Weather / Clock+Weather

| Interaction | Effect |
|---|---|
| **Click the temperature** | Toggle °C ↔ °F (persisted to config) |
| **Hover** | 🔄 Refresh button appears |
| **Tap "▼ 3-Day Forecast"** | Expand/collapse Mon/Tue/Wed hi-lo forecast *(Detailed Weather only)* |

### Astronomy / AQI

| Interaction | Effect |
|---|---|
| **Hover** | 🔄 Refresh button appears |

### Custom Text

| Interaction | Effect |
|---|---|
| **Double-click** | Edit text inline |
| **Enter** | Save and exit edit mode |
| **Esc / Click away** | Cancel |

### HTML Embed

| Interaction | Effect |
|---|---|
| **Hover** | 🔄 Reload button appears — refreshes the embed without reopening settings |

### Battery

| Interaction | Effect |
|---|---|
| **Automatic** | Desktop notification fires when battery ≤15% while unplugged |

### Countdown Timer

| Interaction | Effect |
|---|---|
| **Click the timer digits** | Opens inline date-picker popover to change target date |
| **Double-click the label** | Rename the countdown inline · Enter saves · Esc cancels |

### Quote of the Day

| Interaction | Effect |
|---|---|
| **Click quote / 🔄** | Load a new random quote |
| **📋** | Copy quote text to clipboard |
| **🤍 Heart** | Save current quote to favourites (turns ❤️) |
| **⭐** | Switch to cycling through saved favourites only |
| **🌐** | Switch back to random quotes from API |

### Calendar

| Interaction | Effect |
|---|---|
| **◀ / ▶ arrows** | Navigate months (shows pending mark count for each direction) |
| **Click a date cell** | Open mark popover — choose a color dot + label, then Save |
| **Click a marked date** | Open mark popover — edit or Delete the existing mark |

---

## 🧩 Widget Reference

| Widget | What It Shows | Inspector Options | Desktop Interactions |
|---|---|---|---|
| **Digital Clock** | Time (12h/24h) + optional date + seconds | 12h toggle, Show Date | Left-click: 12h/24h · Right-click: context menu |
| **Analog Minimalist** | Clean borderless clock hands | Theme | Right-click: toggle face |
| **Analog Numbered** | Analog clock with hour markers | Theme | Right-click: toggle face |
| **Weather** | Temperature, condition icon, city, condition tint | City search, °F toggle | Click temp: °C/°F · Hover: refresh |
| **Detailed Weather** | Feels Like, Humidity, Wind, UV + tint | City search, °F toggle | Click temp: °C/°F · ▼ Forecast · Hover: refresh |
| **Clock + Weather** | Digital time + weather summary + city | City search, 12h toggle, °F toggle | Click temp: °C/°F |
| **Astronomy** | Sunrise, Sunset, Moon phase + city | City search | Hover: refresh |
| **Air Quality (AQI)** | US-EPA level, health advisory, PM2.5 + tint | City search | Hover: refresh |
| **Custom Text** | Any user-written text | Text content | Double-click: inline edit |
| **HTML Embed** | Any iframe-compatible embed | Embed code | Hover: reload |
| **Battery Status** | Battery %, bar, charging, time remaining | — | Notification at ≤15% |
| **Countdown Timer** | d/h/m/s to target date | Label, target date | Click timer: date picker · Double-click label: rename |
| **Quote of the Day** | Random inspirational quote | — | Click/🔄 new · 📋 copy · 🤍 fav · ⭐ cycle · 🌐 random |
| **Calendar** | Month grid + today + date marks | Marked Dates list | ◀▶ navigate · Click date: mark · Click mark: edit |

---

## 📦 How to Build the EXE

```bash
npm run build
```

Output:

```
out/make/squirrel.windows/x64/DeskX-Setup.exe     # Installer
out/make/zip/win32/x64/DeskX-win32-x64-3.0.0.zip  # Portable
```

**What's inside:** Chromium engine · Node.js runtime · koffi Win32 FFI · electron-store · all app code.

**Nothing downloads at runtime** — fully self-contained.

---

## ⚙ Settings

| Setting | Location | Description |
|---|---|---|
| **Fit mode** | Fit preview grid | How the wallpaper fits within the monitor |
| **Sound** | Options panel | Toggle audio for video wallpapers |
| **Loop** | Options panel | Toggle video looping |
| **Start with Windows** | Status bar | Auto-launch DeskX at boot |
| **Widget Scale** | Inspector | Resize any individual widget (0.5× – 3×) |
| **Widget Theme** | Inspector | Light or dark text |
| **Use Fahrenheit (°F)** | Inspector | Weather widgets: default unit |
| **Draggable on Desktop** | Inspector | Allow live drag-to-reposition on the desktop |
| **Interactive on Desktop** | Inspector | Enable widget click/keyboard interactions |
| **Float Above All Windows** | Inspector | Move widget to HWND_TOPMOST layer |

Settings are saved to `%AppData%/Roaming/DeskX/config.json` and persist across restarts.

---

## ⚠️ Important Notes

- **Windows only** — uses Win32 WorkerW injection which is Windows-specific.
- **Works behind icons** — DeskX renders wallpapers _behind_ your desktop icons and taskbar, not on top.
- **No GPU required** — video decoding uses Chromium's built-in codecs (hardware acceleration used when available).
- **Single instance** — only one DeskX can run at a time. Launching a second instance focuses the first.
- **Supported formats** — PNG, JPG, WebP, BMP, GIF, MP4, WebM, MKV, AVI, MOV, WMV, FLV, HTML.
- **Weather widgets require internet** — they use WeatherAPI.com (free tier, key bundled). All other widgets (Clock, Calendar, Battery, Custom Text, Quote, Countdown) work fully offline.
- **Battery notification** — requires the browser Notification API permission. DeskX will prompt the first time.
