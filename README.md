<h1 align="center">🖥️ DeskX: Wallpaper Engine</h1>
<p align="center">
  <strong>Set images, GIFs, videos, and HTML pages as your desktop wallpaper — with live interactive widgets</strong><br/>
  <em>Full multi-monitor support · Spanning · Per-monitor config · Interactive Widget Overlay · Live Drag · Click-Through · Sound control</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Windows_10%2F11-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/runtime-Electron_34-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/win32-koffi_FFI-orange?style=flat-square" alt="Koffi" />
  <img src="https://img.shields.io/badge/exe-standalone-brightgreen?style=flat-square" alt="Standalone" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
</p>

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
- [Improvement Ideas](#-improvement-ideas)
- [Author](#-author)

---

## 🔍 Overview

**DeskX** is a Windows desktop application that replaces your static wallpaper with dynamic media. It uses the Win32 **WorkerW injection** technique to embed content _behind_ your desktop icons — exactly where the real wallpaper lives — so it never covers your icons, taskbar, or other applications.

On top of the wallpaper itself, DeskX features a **modular widget overlay system** that lets you place live, interactive widgets directly on your desktop: clocks, weather panels, calendars, countdowns, battery monitors, and more.

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
| **Widgets** | Not supported | 14+ live interactive desktop widgets |
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
| **Fallback Mode** | `HWND_BOTTOM` z-order fallback if WorkerW injection fails |

### 🖥️ Desktop App
| Feature | Description |
|---|---|
| **System Tray** | Minimizes to tray with context menu (pause, mute, lock widgets, disable interaction, remove, quit) |
| **Glassmorphism UI** | Dark theme with frosted glass effects, smooth transitions, Inter typography |
| **Drag & Drop** | Drop files directly onto the settings window |
| **Auto-Start** | Optional "Start with Windows" toggle |
| **Single Instance** | Only one instance runs at a time — second launch focuses the first |

### 🧩 Widget Overlay System
| Feature | Description |
|---|---|
| **Transparent Overlay Layer** | Widgets render on a transparent `BrowserWindow` above the desktop, below all apps |
| **Live Desktop Drag** | Drag widgets directly on the desktop to reposition — no settings window needed |
| **Click-Through** | Empty overlay areas pass all mouse events through to desktop icons and the shell |
| **Hit-Test IPC** | Mouse-over detection toggles `WS_EX_TRANSPARENT` in real time for seamless click-through |
| **Per-Widget Interactions** | Clock toggle, calendar navigation, weather refresh, quote refresh, inline text edit |
| **Lock / Disable Toggles** | Tray menu + inspector toggles to lock dragging or disable all interactions globally |
| **Visual Editor** | Drag-and-drop widget placement on a scaled WYSIWYG preview in the settings window |
| **Per-Monitor Widgets** | Independent widget sets for each monitor in "Same" and "Different" modes |
| **Widget Inspector** | Per-widget panel: description, scale, theme, type options, draggable & interactive toggles |
| **Live Previews** | Widget picker shows actual rendered previews for every widget type |
| **Persistent Config** | All widget positions, sizes, and settings saved via `electron-store` |
| **City Search** | WeatherAPI autocomplete with country filtering — no lat/lon required |

---

## 🧩 Widget Library

| Widget | Description | Data Source | Desktop Interaction |
|---|---|---|---|
| **Digital Clock** | 12h/24h time with optional date display | System time | Click to toggle 12h/24h |
| **Analog Minimalist** | Sleek borderless analog clock face | System time | — |
| **Analog Numbered** | Classic analog with number markers | System time | — |
| **Weather** | Current temperature, condition icon, city name | WeatherAPI.com | Hover to refresh |
| **Detailed Weather** | Feels Like, Humidity, Wind, UV Index + location | WeatherAPI.com | Hover to refresh |
| **Clock + Weather** | Hybrid digital clock with live weather summary | WeatherAPI.com | — |
| **Astronomy** | Sunrise, Sunset, and Moon phase for your location | WeatherAPI.com | Hover to refresh |
| **Air Quality (AQI)** | US-EPA index (1–6), severity label, and PM2.5 value | WeatherAPI.com | Hover to refresh |
| **Custom Text** | User-defined label or note displayed on screen | User config | Double-click to edit inline |
| **HTML Embed (iframe)** | Embed any iframe-compatible third-party widget | External URL | — |
| **Battery Status** | Visual battery bar with level % and charging indicator | Browser API | — |
| **Countdown Timer** | Customizable event countdown (label + target date) | User config | — |
| **Quote of the Day** | Random inspirational quote refreshed every 2 hours | type.fit API | Click to refresh |
| **Calendar** | Month-view grid with today's date highlighted | System date | ◀ ▶ month navigation |

---

## 🏗 Architecture

DeskX uses a **split-window architecture** (v2.0+):

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
│                            │  │  Overlay Window (transparent)   │ │  │
│                            │  │  WS_EX_TRANSPARENT + LAYERED    │ │  │
│                            │  │  Hit-test → toggle click-through│ │  │
│                            │  │  All 14 interactive widgets      │ │  │
│                            │  │  Live drag · click · keyboard   │ │  │
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
overlayWindow (transparent BrowserWindow) → sits above desktop, below all apps
    │
    ▼
periodic SetWindowPos(HWND_BOTTOM) → maintains z-order automatically
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

> **Fully standalone** — no Node.js, Python, or any runtime required. Electron bundles Chromium, Node.js, and all native dependencies (including the `koffi` Win32 FFI module) inside the installer. Nothing else to download.

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

This runs the icon generator and then `electron-forge make`, producing:

```
out/make/
├── squirrel.windows/x64/
│   ├── DeskX-Setup.exe          # Squirrel installer (~118 MB)
│   └── DeskX-1.0.0-full.nupkg   # Update package
└── zip/win32/x64/
    └── DeskX-win32-x64-1.0.0.zip  # Portable ZIP (~122 MB)
```

### What's Bundled Inside the EXE

- **Chromium** — full browser engine for rendering wallpapers and widgets
- **Node.js** — Electron main process runtime
- **koffi** — native Win32 FFI module (unpacked from asar for direct loading)
- **electron-store** — JSON-based settings persistence
- All application source code, HTML, CSS, and JS

> **Nothing downloads at runtime.** The EXE is entirely self-contained.

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
│   │   ├── index.js             # App entry — window creation, IPC handlers
│   │   ├── wallpaper-manager.js # Creates/manages wallpaper BrowserWindows
│   │   ├── win32-wallpaper.js   # WorkerW injection via koffi FFI
│   │   ├── settings-store.js    # Persistent config (electron-store)
│   │   └── tray.js              # System tray icon + context menu
│   │
│   ├── preload/
│   │   └── preload.js           # Secure IPC bridge (contextBridge)
│   │
│   └── renderer/
│       ├── settings/            # Settings UI
│       │   ├── index.html       # Main settings page (widget picker modal)
│       │   ├── settings.css     # Glassmorphism design system + inspector styles
│       │   └── settings.js      # UI logic, fit preview, widget editor & inspector
│       │
│       ├── overlay/             # Interactive widget overlay (v2.0)
│       │   ├── index.html       # Transparent overlay page
│       │   ├── overlay.css      # Widget styles for overlay layer
│       │   └── overlay.js       # All 14 widgets + hit-test + live drag + interactions
│       │
│       └── wallpaper/           # Wallpaper renderer (media only)
│           ├── index.html       # Wallpaper display page
│           ├── renderer.css     # Fullscreen media styles
│           └── renderer.js      # Media loading and fit modes
│
├── forge.config.js              # Electron Forge build config
├── generate-icon.js             # DX lettermark icon generator
├── package.json                 # npm config + build scripts
├── CHANGELOG.md                 # Post-v1.0.0 change history
├── README.md                    # This file
├── guide.md                     # Quick-start user guide
└── LICENSE                      # MIT License
```

---

## 📚 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `electron` | ^34.0.0 | Desktop application framework (Chromium + Node.js) |
| `koffi` | ^2.9.0 | Native Win32 FFI — calls User32.dll for WorkerW injection |
| `electron-store` | ^8.2.0 | Persistent JSON config storage in `%AppData%` |
| `@electron-forge/cli` | ^7.6.0 | Build toolchain for packaging and making installers |
| `@electron-forge/maker-squirrel` | ^7.6.0 | Windows Squirrel installer maker |
| `@electron-forge/maker-zip` | ^7.6.0 | Portable ZIP maker |

> All dependencies are bundled at build time. The standalone EXE has **zero external requirements**.

**External APIs used at runtime (free tier, no key required to be configured by user):**

| API | Used By | Notes |
|---|---|---|
| [WeatherAPI.com](https://www.weatherapi.com/) | Weather, Detailed Weather, Clock+Weather, Astronomy, AQI widgets | Free tier, key bundled in app |
| [type.fit](https://type.fit/api/quotes) | Quote of the Day widget | Free, no key required |
| Browser `navigator.getBattery()` | Battery widget | Local only, no network |

---

## ⚙️ Configuration

Settings are stored in `%AppData%/Roaming/DeskX/config.json` via `electron-store`:

| Setting | Values | Description |
|---|---|---|
| **Mode** | `same` / `different` / `spanning` | How wallpapers are applied across monitors |
| **Fit** | `cover` / `contain` / `stretch` / `center` | How the wallpaper fits within the monitor |
| **Sound** | `true` / `false` | Audio playback for video wallpapers |
| **Loop** | `true` / `false` | Loop video playback |
| **Interactive** | Always `true` for HTML | Mouse/keyboard forwarded to HTML wallpapers |
| **Autostart** | `true` / `false` | Launch DeskX when Windows starts |
| **widgetsDraggable** | `true` / `false` | Allow live drag-to-reposition on the desktop |
| **widgetsInteractive** | `true` / `false` | Enable widget click/keyboard interactions on desktop |
| **Per-Monitor Widgets** | Keyed by display ID | Independent widget array per monitor including type, position, scale, config |

---

## 💡 Improvement Ideas

### High Impact
- **Wallpaper Gallery** — Built-in browser for community wallpapers (Wallpaper Engine Workshop-style).
- **Playlist Mode** — Cycle through multiple wallpapers on a timer.
- **Pomodoro Timer Widget** — On-screen productivity timer (25/5 work-break cycles).
- **RSS News Ticker** — Scrolling headline widget from any RSS feed.

### Medium Impact
- **Global Hotkeys** — `Ctrl+Alt+W` to toggle interactive mode, `Ctrl+Alt+P` to pause.
- **World Clock Widget** — Secondary clock for a user-specified timezone.
- **Per-Monitor Sound** — Independent volume controls for multi-monitor video setups.
- **Transition Effects** — Crossfade, slide, or zoom between wallpaper changes.
- **DPI Scaling** — Improved handling for mixed-DPI multi-monitor setups.

### Polish
- **Wallpaper Scheduler** — Time-based wallpaper switching (day/night themes).
- **Performance Overlay** — Show FPS and memory usage for video/HTML wallpapers.
- **Export/Import Config** — Share wallpaper and widget configurations between machines.
- **Auto-Update** — Check for new versions via GitHub releases.

---

## 👤 Author

**Felix-au** (Harshit Soni)

- 🔗 GitHub: [github.com/Felix-au](https://github.com/Felix-au)
- 📧 Email: [harshit.soni.23cse@bmu.edu.in](mailto:harshit.soni.23cse@bmu.edu.in)

---

<p align="center">
  <sub>DeskX — your desktop, your rules.</sub>
</p>
