<h1 align="center">🖥️ DeskX: Wallpaper Engine</h1>
<p align="center">
  <strong>Set images, GIFs, videos, and HTML pages as your desktop wallpaper — with live interactive widgets</strong><br/>
  <em>Full multi-monitor support · Spanning · Per-monitor config · 3-Layer Widget Overlay · Live Drag · Click-Through · Z-Order control</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-brightgreen?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/v3.0-in_development-6366f1?style=flat-square" alt="v3 In Dev" />
  <img src="https://img.shields.io/badge/platform-Windows_10%2F11-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/runtime-Electron_34-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/win32-koffi_FFI-orange?style=flat-square" alt="Koffi" />
  <img src="https://img.shields.io/badge/exe-standalone-brightgreen?style=flat-square" alt="Standalone" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

> [!NOTE]
> **Current release: v2.0.0.** The features below marked with 🔬 are part of the **v3.0 development build** (implemented and committed, but not yet in a formal release). Everything unmarked is available in the current v2.0.0 release.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Why DeskX?](#-why-deskx)
- [Features](#-features)
- [Widget Library](#-widget-library)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Build Standalone EXE](#-build-standalone-exe)
- [Project Structure](#-project-structure)
- [Dependencies](#-dependencies)
- [Configuration](#-configuration)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 🔍 Overview

**DeskX** is a Windows desktop application that replaces your static wallpaper with dynamic media. It uses the Win32 **WorkerW injection** technique to embed content _behind_ your desktop icons — exactly where the real wallpaper lives — so it never covers your icons, taskbar, or other applications.

On top of the wallpaper, DeskX features a **modular widget overlay system** with a **3-layer Z-order architecture** — widgets can live below apps, above the taskbar, or floating above all windows. Place clocks, weather panels, calendars, countdowns, battery monitors, and more — all interactive, draggable, and fully configurable per monitor.

Supported wallpaper types:

| Type | Formats | Features |
|---|---|---|
| **Static Images** | PNG, JPG, JPEG, WebP, BMP, TIFF, ICO | Cover / Contain / Stretch / Center fit modes |
| **Animated GIFs** | GIF | Same fit modes, smooth looping |
| **Videos** | MP4, WebM, MKV, AVI, MOV, WMV, FLV | Sound toggle, loop control, all fit modes |
| **HTML Pages** | HTML, HTM | Mouse & keyboard interaction always enabled |

> All rendering uses Chromium (via Electron), so CSS animations, WebGL, `<canvas>`, and JavaScript all work out of the box.

---

## 🎯 Why DeskX?

| | Standard Windows Wallpaper | DeskX |
|---|---|---|
| **Formats** | Static images only | Images, GIFs, videos, HTML |
| **Multi-Monitor** | Same image or slideshow | Same, different per-monitor, or spanning |
| **Fit Preview** | None — guess and apply | Live fit preview with actual wallpaper |
| **Spanning** | Basic stretch | True span with multi-monitor tile visualization |
| **Videos** | Not supported | Full video with sound & loop control |
| **HTML** | Not supported | Interactive HTML/CSS/JS wallpapers |
| **Widgets** | Not supported | 14 live interactive desktop widgets |
| **Z-Order** | N/A | 3-layer: below apps / above taskbar / topmost |
| **Taskbar** | N/A | Never covers taskbar or icons |

---

## ✨ Features

### 🖼️ Multi-Monitor Support
| Feature | Description |
|---|---|
| **Same Mode** | Apply one wallpaper to all monitors; configure independent widgets per screen |
| **Different Mode** | Set a unique wallpaper and widget set per monitor |
| **Spanning Mode** | Stretch a single wallpaper across the entire virtual desktop |
| **Monitor Dashboard** | Real-time layout view showing resolution, position, and primary status |

### 🎬 Media Engine
| Feature | Description |
|---|---|
| **Video Playback** | MP4, WebM, MKV, AVI, MOV, WMV, FLV — native Chromium decoding |
| **Sound Control** | Toggle audio on/off per video wallpaper |
| **Loop Control** | Enable or disable video looping |
| **GIF Support** | Smooth animated GIF rendering at native frame rate |
| **HTML Wallpapers** | Full browser-grade rendering — CSS animations, WebGL, JS, canvas |
| **Interactive HTML** | Mouse and keyboard events forwarded to HTML wallpapers by default |

### 🧩 Widget Overlay System
| Feature | Description |
|---|---|
| **3-Layer Z-Order** | Widgets route to `bottom` (below apps), `taskbar` (above taskbar), or `topmost` (above all windows) layers |
| **Float Above All** | Per-widget "Float Above All Windows" inspector toggle; uses `HWND_TOPMOST` Win32 layer |
| **Transparent Overlay** | Widgets render on transparent `BrowserWindow`s above the desktop |
| **Live Desktop Drag** | Drag widgets directly on the desktop to reposition — no settings window needed |
| **Click-Through** | Empty overlay areas pass all mouse events through to desktop icons and the shell |
| **Hit-Test IPC** | Mouse-over detection toggles `WS_EX_TRANSPARENT` in real time |
| **Per-Widget Interactions** | Clock toggles, calendar marks, weather unit/forecast, quote favourites, countdown date picker, and more |
| **Lock / Disable Toggles** | Tray menu + inspector toggles to lock dragging or disable all interactions globally |
| **Visual Editor** | Drag-and-drop widget placement on a scaled WYSIWYG preview |
| **Per-Monitor Widgets** | Independent widget sets for each monitor in "Same" and "Different" modes |
| **Widget Inspector** | Per-widget panel: full interaction docs, scale, theme, type options, Z-order, draggable & interactive toggles |
| **Live Previews** | Widget picker shows actual rendered previews for every widget type |
| **Persistent Config** | All widget positions, sizes, configs and marks saved via `electron-store` |
| **City Search** | WeatherAPI autocomplete with country filtering — no lat/lon required |

### 🔧 Fit Mode Preview
| Feature | Description |
|---|---|
| **Live Preview** | Each fit mode card shows the actual wallpaper rendered at the correct aspect ratio |
| **Video Previews** | White dimensional template with "Visible area" label and resolution |
| **Spanning Preview** | Multi-monitor tile layout with per-monitor wallpaper slices and visible gaps |
| **Dimension Badge** | Shows `monitor_res ← wallpaper_res` for instant reference |

### 🪟 Win32 Desktop Integration
| Feature | Description |
|---|---|
| **WorkerW Injection** | Embeds windows behind desktop icons using the undocumented `0x052C` Progman message |
| **Taskbar Hidden** | `WS_EX_TOOLWINDOW` + `WS_EX_NOACTIVATE` flags — invisible in taskbar and alt-tab |
| **Focus Protection** | Windows are non-focusable; clicking the desktop works normally |
| **3 Win32 Layer Helpers** | `pinOverlayToBottom`, `pinOverlayAboveTaskbar`, `pinOverlayTopmost` |
| **Anti-Flicker** | `thickFrame:false` + `in-process-gpu` suppress DWM repaints on monitor drag |

### 🖥️ Desktop App
| Feature | Description |
|---|---|
| **System Tray** | Minimizes to tray with context menu (pause, mute, lock widgets, disable interaction, remove, quit) |
| **Glassmorphism UI** | Dark theme with frosted glass effects, smooth transitions, Inter typography |
| **Drag & Drop** | Drop files directly onto the settings window |
| **Auto-Start** | Optional "Start with Windows" toggle |
| **Single Instance** | Only one instance runs at a time — second launch focuses the first |

---

## 🧩 Widget Library

| Widget | Description | Desktop Interactions |
|---|---|---|
| **Digital Clock** | 12h/24h time with optional date + seconds | Left-click → toggle 12h/24h · Right-click → context menu (12h, Date, Seconds) |
| **Analog Minimalist** | Sleek borderless analog clock | Right-click → switch to numbered face (toggles back each click) |
| **Analog Numbered** | Classic analog with 1–12 hour markers | Right-click → switch to minimalist face (toggles back each click) |
| **Weather** | Temperature, condition icon, city name, condition tint | Click temp → toggle °C/°F · Hover → 🔄 refresh |
| **Detailed Weather** | Feels Like, Humidity, Wind, UV + condition tint | Click temp → toggle °C/°F · ▼ 3-Day Forecast expand · Hover → 🔄 refresh |
| **Clock + Weather** | Hybrid digital clock with live weather summary | Click temp → toggle °C/°F |
| **Astronomy** | Sunrise, Sunset, and Moon phase | Hover → 🔄 refresh |
| **Air Quality (AQI)** | US-EPA index, severity tint, health advisory | Hover → 🔄 refresh |
| **Custom Text** | User-defined label or note on screen | Double-click → inline edit · Enter/click away to save |
| **HTML Embed (iframe)** | Embed any iframe-compatible third-party widget | Hover → 🔄 reload embed |
| **Battery Status** | Battery bar, level %, charging indicator, time remaining | Desktop notification when ≤15% unplugged |
| **Countdown Timer** | Days/Hours/Minutes/Seconds countdown | Click timer → inline date picker · Double-click label → rename |
| **Quote of the Day** | Random inspirational quote | Click/🔄 new quote · 📋 copy · 🤍 heart/favourite · ⭐ cycle favs · 🌐 random mode |
| **Calendar** | Month-view grid, today highlighted, date marks | ◀ ▶ navigate · Click date → add color mark · Manage marks in inspector |

---

## 🏗 Architecture

DeskX uses a **3-layer overlay architecture** (v3.0):

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DeskX Desktop App                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                    Main Process (Node.js)                    │    │
│  │  Settings Store · Wallpaper Manager · Win32 FFI · Tray       │    │
│  │  IPC Bridge (preload.js / contextBridge)                     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────┐   ┌──────────────────────────────────────┐  │
│  │  Settings Window    │   │  Per-Monitor Renderer Processes      │  │
│  │  (Chromium)         │   │                                      │  │
│  │  Monitor layout     │   │  ┌─────────────────────────────────┐ │  │
│  │  Fit preview        │   │  │  Wallpaper Window (WorkerW)     │ │  │
│  │  Widget editor      │   │  │  <img> / <video> / <iframe>     │ │  │
│  │  Inspector panel    │   │  │  media-only, no widgets         │ │  │
│  └─────────────────────┘   │  └─────────────────────────────────┘ │  │
│                            │                                      │  │
│                            │  ┌─────────────────────────────────┐ │  │
│                            │  │  Layer 0 — Bottom Overlay       │ │  │
│                            │  │  HWND_BOTTOM · default widgets  │ │  │
│                            │  └─────────────────────────────────┘ │  │
│                            │  ┌─────────────────────────────────┐ │  │
│                            │  │  Layer 1 — Taskbar Overlay      │ │  │
│                            │  │  Above taskbar, below apps      │ │  │
│                            │  └─────────────────────────────────┘ │  │
│                            │  ┌─────────────────────────────────┐ │  │
│                            │  │  Layer 2 — Topmost Overlay      │ │  │
│                            │  │  HWND_TOPMOST · Float above all │ │  │
│                            │  └─────────────────────────────────┘ │  │
│                            └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### WorkerW Injection Flow

```
FindWindowW("Progman") → SendMessage(0x052C)
    │
    ▼
EnumWindows → find window containing SHELLDLL_DefView
    │
    ▼
FindWindowEx(NULL, shellParent, "WorkerW") → empty WorkerW behind icons
    │
    ▼
SetParent(wallpaperWindow, emptyWorkerW) → wallpaper is now behind desktop icons
    │
    ▼
3× overlay BrowserWindows per monitor → bottom / taskbar / topmost layers
    │
    ▼
routeWidgetsByLayer() → distributes each widget to its correct layer window
    │
    ▼
periodic SetWindowPos() per layer → maintains z-order automatically
```

### Overlay Hit-Test Flow

```
mousemove → document.elementFromPoint(x, y)
    │
    ├─ widget element found → send overlay:hit-test(true)
    │       → setIgnoreMouseEvents(false) + clear WS_EX_TRANSPARENT
    │       → widget receives clicks / keyboard
    │
    └─ no widget → send overlay:hit-test(false)
            → setIgnoreMouseEvents(true, forward) + set WS_EX_TRANSPARENT
            → desktop icons receive clicks normally
```

---

## 🚀 Quick Start

### Option A — Standalone EXE (Recommended)

Download **`DeskX-Setup.exe`** from [Releases](https://github.com/Felix-au/DeskX-Wallpaper-Engine/releases) and run it.

```
Just double-click DeskX-Setup.exe → installs and launches automatically
```

> **Fully standalone** — no Node.js, Python, or any runtime required.

### Option B — Portable ZIP

Download **`DeskX-win32-x64-1.0.0.zip`**, extract anywhere, and run `DeskX.exe`.

### Option C — From Source (Development)

```bash
git clone https://github.com/Felix-au/DeskX-Wallpaper-Engine.git
cd DeskX-Wallpaper-Engine
npm install
npm run dev
```

---

## 📦 Build Standalone EXE

```bash
npm run build
```

Output:

```
out/make/
├── squirrel.windows/x64/
│   ├── DeskX-Setup.exe          # Squirrel installer (~118 MB)
│   └── DeskX-1.0.0-full.nupkg
└── zip/win32/x64/
    └── DeskX-win32-x64-1.0.0.zip  # Portable ZIP (~122 MB)
```

---

## 📁 Project Structure

```
DeskX/
├── assets/
│   ├── DeskXLogo.ico            # Multi-size app icon (16–256px)
│   ├── DeskXLogo.png            # 256px PNG icon
│   └── tray-icon.png            # System tray icon
│
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.js             # App entry — window creation, IPC handlers (multi-layer aware)
│   │   ├── wallpaper-manager.js # Creates/manages wallpaper + 3-layer overlay BrowserWindows
│   │   ├── win32-wallpaper.js   # WorkerW injection + pinOverlayToBottom/AboveTaskbar/Topmost
│   │   ├── settings-store.js    # Persistent config (electron-store)
│   │   └── tray.js              # System tray icon + context menu
│   │
│   ├── preload/
│   │   └── preload.js           # Secure IPC bridge (contextBridge)
│   │
│   └── renderer/
│       ├── settings/            # Settings UI
│       │   ├── index.html       # Main settings page (widget picker modal)
│       │   ├── settings.css     # Glassmorphism design system + inspector + toggle switches
│       │   └── settings.js      # UI logic, fit preview, widget editor & inspector
│       │
│       ├── overlay/             # Interactive widget overlay (v3.0)
│       │   ├── index.html       # Transparent overlay page
│       │   ├── overlay.css      # All widget styles incl. context menus, forecast, popover
│       │   └── overlay.js       # All 14 widgets + hit-test + live drag + all interactions
│       │
│       └── wallpaper/           # Wallpaper renderer (media only)
│           ├── index.html
│           ├── renderer.css
│           └── renderer.js
│
├── forge.config.js
├── generate-icon.js
├── package.json
├── CHANGELOG.md
├── README.md
├── DeskX.md                     # Full technical guide
├── guide.md                     # Quick-start user guide
├── future_ideas.md              # Roadmap and feature backlog
└── LICENSE
```

---

## 📚 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `electron` | ^34.0.0 | Desktop application framework (Chromium + Node.js) |
| `koffi` | ^2.9.0 | Native Win32 FFI — calls User32.dll for WorkerW injection and Z-order control |
| `electron-store` | ^8.2.0 | Persistent JSON config storage in `%AppData%` |
| `@electron-forge/cli` | ^7.6.0 | Build toolchain for packaging and making installers |
| `@electron-forge/maker-squirrel` | ^7.6.0 | Windows Squirrel installer maker |
| `@electron-forge/maker-zip` | ^7.6.0 | Portable ZIP maker |

**External APIs used at runtime (free tier):**

| API | Used By | Notes |
|---|---|---|
| [WeatherAPI.com](https://www.weatherapi.com/) | Weather, Detailed Weather, Clock+Weather, Astronomy, AQI | Free tier, key bundled in app |
| [type.fit](https://type.fit/api/quotes) | Quote of the Day widget | Free, no key required |
| Browser `navigator.getBattery()` | Battery widget | Local only, no network |
| Browser `Notification` API | Battery low-alert | Local only, no network |

---

## ⚙️ Configuration

Settings are stored in `%AppData%/Roaming/DeskX/config.json`:

| Setting | Values | Description |
|---|---|---|
| **Mode** | `same` / `different` / `spanning` | How wallpapers are applied across monitors |
| **Fit** | `cover` / `contain` / `stretch` / `center` | How the wallpaper fits within the monitor |
| **Sound** | `true` / `false` | Audio playback for video wallpapers |
| **Loop** | `true` / `false` | Loop video playback |
| **Autostart** | `true` / `false` | Launch DeskX when Windows starts |
| **widgetsDraggable** | `true` / `false` | Allow live drag-to-reposition on the desktop |
| **widgetsInteractive** | `true` / `false` | Enable widget click/keyboard interactions on desktop |
| **Per-Monitor Widgets** | Keyed by display ID | Independent widget array per monitor — type, position, scale, config (incl. marks, favourites, useFahrenheit, analogFace, etc.) |

---

## 💡 Roadmap

### v3.0 — In Development 🔬
All items below are implemented in the dev build and will ship with the v3.0 release:
- **3-Layer Z-Order Overlay** — widgets can float below apps, above taskbar, or above all windows
- **Calendar Date Marking** — click any date to add color-coded marks with labels
- **Weather °C/°F Toggle + 3-Day Forecast** — per-widget unit toggle + expandable forecast cards
- **Analog Clock Face Toggle** — right-click to switch between minimalist and numbered face
- **Digital Clock Context Menu** — right-click to toggle 12h/date/seconds without opening settings
- **Quote Favourites System** — heart to save, cycle through saved quotes
- **Battery Low-Alert Notification** — desktop notification at ≤15%
- **Countdown Inline Date Picker** — click timer to set target date on the desktop
- **HTML Embed Reload Button** — hover to refresh without reopening settings

### v4.0 — Planned
- **Wallpaper Gallery** — Built-in browser for community wallpapers.
- **Playlist Mode** — Cycle through multiple wallpapers on a timer.
- **Pomodoro Timer Widget** — On-screen 25/5 work-break cycles.
- **RSS News Ticker** — Scrolling headline widget from any RSS feed.
- **Global Hotkeys** — `Ctrl+Alt+W` to toggle interactive mode.
- **World Clock Widget** — Secondary clock for a user-specified timezone.
- **Transition Effects** — Crossfade, slide, or zoom between wallpaper changes.
- **Wallpaper Scheduler** — Time-based wallpaper switching (day/night themes).
- **Export/Import Config** — Share widget configurations between machines.

---

## 👤 Author

**Felix-au** (Harshit Soni)

- 🔗 GitHub: [github.com/Felix-au](https://github.com/Felix-au)
- 📧 Email: [harshit.soni.23cse@bmu.edu.in](mailto:harshit.soni.23cse@bmu.edu.in)

---

<p align="center">
  <sub>DeskX v3.0 — your desktop, your rules.</sub>
</p>
