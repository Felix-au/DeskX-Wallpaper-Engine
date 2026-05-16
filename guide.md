# DeskX — User Guide

A Windows desktop wallpaper engine that supports images, GIFs, videos, and interactive HTML — with a full multi-monitor widget overlay system.

> [!IMPORTANT]
> **DeskX is fully standalone.** The installer bundles everything — Chromium, Node.js, and all native modules. No runtimes, no frameworks, no extra downloads. Just install and run.

---

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

---

## 🧩 Using Widgets

Widgets are live overlays displayed directly on your desktop wallpaper — clocks, weather panels, calendars, and more.

### Opening the Widget Editor

1. In the settings window, click **Configure Widgets** in the sidebar (under the WIDGETS section).
2. The wallpaper preview area transforms into a drag-and-drop widget editor.

### Adding a Widget

- **Same Mode**: Each monitor section has its own **+ Add Widget** button. Click the one for the monitor you want to add to.
- **Different Mode**: Select a monitor tile, then click **+ Add Widget**.
- A picker modal appears — scroll through all available widget types and click one to add it.

### Moving & Positioning

Drag any widget in the editor to reposition it. Its position is saved as a percentage of the monitor's size so it scales correctly at any resolution.

### Configuring a Widget

Click a widget in the editor to select it. The **Widget Settings** panel on the right updates to show:

| Control | Description |
|---|---|
| **Scale** | Resize the widget (0.5× to 3×) |
| **Theme** | Light or Dark text mode |
| **Type-specific options** | City search, custom text, embed code, countdown date, etc. |

### Setting a City for Weather Widgets

1. Select a weather widget (Weather, Detailed Weather, Clock+Weather, Astronomy, AQI).
2. In the Inspector, find the **Location** field.
3. Type a city name — suggestions appear as you type.
4. Optionally type a country name first to narrow down results.
5. Click a suggestion to confirm — a green flash confirms the city was set.

> [!NOTE]
> The city name and country are displayed directly on the widget so you always know which location's data is shown.

### Deleting a Widget

Select a widget in the editor, then click the **Delete Widget** button in the Widget Settings panel.

---

## 🧩 Widget Reference

| Widget | What It Shows | Config Options |
|---|---|---|
| **Digital Clock** | Current time (12h or 24h) and optional date | 12h toggle, show date toggle |
| **Analog Minimalist** | Clean borderless clock hands | Theme |
| **Analog Numbered** | Analog clock with hour numbers | Theme |
| **Weather** | Temperature, condition icon, city + country | City search |
| **Detailed Weather** | Feels Like, Humidity, Wind, UV + city | City search |
| **Clock + Weather** | Digital time + weather summary + city | City search, 12h toggle |
| **Astronomy** | Sunrise, Sunset, Moon phase + city | City search |
| **Air Quality (AQI)** | US-EPA level (1–6), label, PM2.5 + city | City search |
| **Custom Text** | Any user-written text or label | Text content |
| **HTML Embed (iframe)** | Any iframe-compatible embed code | Embed code textarea |
| **Battery Status** | Battery % + charging indicator | None |
| **Countdown Timer** | Days/Hours/Minutes/Seconds to a target | Label, target date & time |
| **Quote of the Day** | Random inspirational quote (refreshes every 2h) | None |
| **Calendar** | Current month grid, today highlighted | None |

---

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
- Chromium browser engine (for rendering wallpapers and widgets)
- Node.js runtime (Electron main process)
- koffi native Win32 FFI module (for WorkerW desktop injection)
- All application code, UI assets, and dependencies

**Nothing downloads at runtime** — the EXE is entirely self-contained.

---

## ⚙ Settings

| Setting | Location | Description |
|---|---|---|
| **Fit mode** | Fit preview grid | How the wallpaper fits within the monitor |
| **Sound** | Options panel | Toggle audio for video wallpapers |
| **Loop** | Options panel | Toggle video looping |
| **Start with Windows** | Status bar | Auto-launch DeskX at boot |
| **Widget Scale** | Widget Settings panel | Resize any individual widget |
| **Widget Theme** | Widget Settings panel | Light or dark text for any widget |

Settings are saved to `%AppData%/Roaming/DeskX/config.json` and persist across restarts.

---

## ⚠️ Important Notes

- **Windows only** — uses Win32 WorkerW injection which is Windows-specific.
- **Works behind icons** — DeskX renders wallpapers _behind_ your desktop icons and taskbar, not on top.
- **No GPU required** — video decoding uses Chromium's built-in codecs (hardware acceleration used when available).
- **Single instance** — only one DeskX can run at a time. Launching a second instance focuses the first.
- **Supported formats** — PNG, JPG, WebP, BMP, GIF, MP4, WebM, MKV, AVI, MOV, WMV, FLV, HTML.
- **Weather widgets require internet** — they use WeatherAPI.com (free tier, key bundled). Other widgets (Clock, Calendar, Battery, Custom Text) work fully offline.
