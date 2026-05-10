# DeskX — Quick Guide

A Windows desktop wallpaper engine that supports images, GIFs, videos, and interactive HTML — with full multi-monitor support.

> [!IMPORTANT]
> **DeskX is fully standalone.** The installer bundles everything — Chromium, Node.js, and all native modules. No runtimes, no frameworks, no extra downloads. Just install and run.

## 🚀 How to Install

### Option A — Installer (Recommended)

1. Download **`DeskX-Setup.exe`** from [Releases](https://github.com/Felix-au/DeskX-Wallpaper-Engine/releases)
2. Double-click to install
3. DeskX launches automatically after installation

### Option B — Portable ZIP

1. Download **`DeskX-win32-x64-1.0.0.zip`**
2. Extract to any folder
3. Run `DeskX.exe`

### Option C — From Source

```bash
git clone https://github.com/Felix-au/DeskX-Wallpaper-Engine.git
cd DeskX
npm install
npm run dev
```

## 🎯 How to Use

### Setting a Wallpaper

1. **Launch DeskX** — the settings window opens. DeskX also appears in your system tray.
2. **Choose a mode** at the top:
   - **Same** — one wallpaper on all monitors
   - **Different** — unique wallpaper per monitor (click a monitor tile to select it)
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

### Spanning Mode Preview

When "Span" is selected, the fit preview shows your actual monitor layout as separate tiles with gaps between them. Each tile shows its portion of the wallpaper, so you can see exactly how it will look across all monitors before applying.

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
| **Remove All Wallpapers** | Reset desktop to default |
| **Quit** | Exit DeskX completely |

## 📦 How to Build the EXE

```bash
npm run build
```

Output:

```
out/make/squirrel.windows/x64/DeskX-Setup.exe     # Installer (~118 MB)
out/make/zip/win32/x64/DeskX-win32-x64-1.0.0.zip  # Portable (~122 MB)
```

**What's inside the EXE:**
- Chromium browser engine (for rendering wallpapers)
- Node.js runtime (Electron main process)
- koffi native Win32 FFI module (for WorkerW desktop injection)
- All application code, UI assets, and dependencies

**Nothing downloads at runtime** — the EXE is entirely self-contained.

## ⚙ Settings

| Setting | Location | Description |
|---|---|---|
| **Fit mode** | Fit preview grid | How the wallpaper fits within the monitor |
| **Sound** | Options panel | Toggle audio for video wallpapers |
| **Loop** | Options panel | Toggle video looping |
| **Start with Windows** | Status bar | Auto-launch DeskX at boot |

Settings are saved to `%AppData%/Roaming/DeskX/config.json` and persist across restarts.

## ⚠️ Important Notes

- **Windows only** — uses Win32 WorkerW injection which is Windows-specific.
- **Works behind icons** — DeskX renders wallpapers _behind_ your desktop icons and taskbar, not on top.
- **No GPU required** — video decoding uses Chromium's built-in codecs (hardware acceleration used when available).
- **Single instance** — only one DeskX can run at a time. Launching a second instance focuses the first.
- **Supported formats** — PNG, JPG, WebP, BMP, GIF, MP4, WebM, MKV, AVI, MOV, WMV, FLV, HTML.
