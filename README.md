<h1 align="center">🖥️ DeskX: Wallpaper Engine</h1>
<p align="center">
  <strong>Set images, GIFs, videos, and HTML pages as your desktop wallpaper</strong><br/>
  <em>Full multi-monitor support · Spanning · Per-monitor config · Sound control · Interactive HTML</em>
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
| **Taskbar** | N/A | Never covers taskbar or icons |

---

## ✨ Features

### 🖼️ Multi-Monitor Support
| Feature | Description |
|---|---|
| **Same Mode** | Apply one wallpaper to all monitors |
| **Different Mode** | Set a unique wallpaper per monitor with independent config |
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
| **System Tray** | Minimizes to tray with context menu (pause, mute, remove, quit) |
| **Glassmorphism UI** | Dark theme with frosted glass effects, smooth transitions, Inter typography |
| **Drag & Drop** | Drop files directly onto the settings window |
| **Auto-Start** | Optional "Start with Windows" toggle |
| **Single Instance** | Only one instance runs at a time — second launch focuses the first |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      DeskX Desktop App                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Main Process (Node.js)                   │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │ Settings     │  │ Wallpaper    │  │ Win32          │   │  │
│  │  │ Store        │  │ Manager      │  │ Wallpaper      │   │  │
│  │  │              │  │              │  │                │   │  │
│  │  │ electron-    │  │ Creates      │  │ FindWindowW    │   │  │
│  │  │ store JSON   │  │ BrowserWins  │  │ EnumWindows    │   │  │
│  │  │ persistence  │  │ per monitor  │  │ SetParent      │   │  │
│  │  └──────────────┘  │ or spanning  │  │ SetWindowPos   │   │  │
│  │                    └──────┬───────┘  │ (via koffi)    │   │  │
│  │                           │attach    └───────┬────────┘   │  │
│  │                           └──────────────────┘            │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │ System Tray  │  │ IPC Bridge (preload.js)          │   │  │
│  │  │ (tray.js)    │  │ contextBridge.exposeInMainWorld  │   │  │
│  │  └──────────────┘  └──────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │               Renderer Processes (Chromium)                │  │
│  │                                                            │  │
│  │  ┌──────────────────┐    ┌─────────────────────────────┐  │  │
│  │  │ Settings Window  │    │ Wallpaper Window(s)         │  │  │
│  │  │                  │    │                             │  │  │
│  │  │ Monitor layout   │    │ <img> / <video> / <iframe>  │  │  │
│  │  │ File browser     │    │ per-monitor or spanning     │  │  │
│  │  │ Fit preview grid │    │ attached to WorkerW         │  │  │
│  │  │ Options panel    │    │                             │  │  │
│  │  └──────────────────┘    └─────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
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
SetParent(ourWindow, emptyWorkerW) → window is now behind desktop icons
    │
    ▼
SetWindowPos(x, y, w, h) → reposition for correct monitor / spanning bounds
```

---

## 🚀 Quick Start

### Option A — Standalone EXE (Recommended)

Download **`DeskX-Setup.exe`** from [Releases](https://github.com/Felix-au/DeskX/releases) and run it.

```
Just double-click DeskX-Setup.exe → installs and launches automatically
```

> **Fully standalone** — no Node.js, Python, or any runtime required. Electron bundles Chromium, Node.js, and all native dependencies (including the `koffi` Win32 FFI module) inside the installer. Nothing else to download.

### Option B — Portable ZIP

Download **`DeskX-win32-x64-1.0.0.zip`**, extract anywhere, and run `DeskX.exe`.

### Option C — From Source (Development)

```bash
git clone https://github.com/Felix-au/DeskX.git
cd DeskX
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

- **Chromium** — full browser engine for rendering wallpapers
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
│   ├── icon.ico                 # Multi-size app icon (16–256px)
│   ├── icon.png                 # 256px PNG icon
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
│       │   ├── index.html       # Main settings page
│       │   ├── settings.css     # Glassmorphism design system
│       │   └── settings.js      # UI logic, fit preview, monitor layout
│       │
│       └── wallpaper/           # Wallpaper renderer
│           ├── index.html       # Wallpaper display page
│           ├── renderer.css     # Fullscreen media styles
│           └── renderer.js      # Media loading, fit modes, IPC
│
├── forge.config.js              # Electron Forge build config
├── generate-icon.js             # DX lettermark icon generator
├── package.json                 # npm config + build scripts
├── implementation_plan.md       # Original design document
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
| **Per-Monitor** | Keyed by display ID | Independent wallpaper + fit + sound per monitor |

---

## 💡 Improvement Ideas

### High Impact
- **Wallpaper Gallery** — Built-in browser for community wallpapers (Wallpaper Engine Workshop-style).
- **Playlist Mode** — Cycle through multiple wallpapers on a timer.
- **Web URL Wallpapers** — Set any website URL as a live wallpaper.
- **GPU Acceleration** — Offload video decoding to GPU for lower CPU usage.

### Medium Impact
- **Global Hotkeys** — `Ctrl+Alt+W` to toggle interactive mode, `Ctrl+Alt+P` to pause.
- **Per-Monitor Sound** — Independent volume controls for multi-monitor video setups.
- **Transition Effects** — Crossfade, slide, or zoom between wallpaper changes.
- **DPI Scaling** — Improved handling for mixed-DPI multi-monitor setups.

### Polish
- **Wallpaper Scheduler** — Time-based wallpaper switching (day/night themes).
- **Performance Overlay** — Show FPS and memory usage for video/HTML wallpapers.
- **Export/Import Config** — Share wallpaper configurations between machines.
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
