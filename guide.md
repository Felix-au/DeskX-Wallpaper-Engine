# DeskX — User Guide

A Windows desktop wallpaper engine that supports images, GIFs, videos, and interactive HTML — with a full multi-monitor **interactive widget overlay** system. Widgets live on a transparent layer above your desktop and can be dragged, clicked, and interacted with directly — no settings window needed.

> [!IMPORTANT]
> **DeskX is fully standalone.** The installer bundles everything — Chromium, Node.js, and all native modules. No runtimes, no frameworks, no extra downloads. Just install and run.

---

## 🚀 How to Install

### Option A — Installer (Recommended)

1. Download **`DeskX-Setup.exe`** from [Releases](https://github.com/Felix-au/DeskX-Wallpaper-Engine/releases)
2. Double-click to install
3. DeskX launches automatically after installation

### Option B — Portable Version

1. Download **`DeskX-win32-x64-1.0.0.zip`** from [Releases](https://github.com/Felix-au/DeskX-Wallpaper-Engine/releases)
2. Extract the zip file to a folder of your choice
3. Run `DeskX.exe` from the extracted folder

### Option C — Build Yourslef

```bash
git clone https://github.com/Felix-au/DeskX-Wallpaper-Engine.git
cd DeskX-Wallpaper-Engine
npm install
npm run build
```
Above will output the installer file in the `out/make/squirrel.windows/x64/`folder as `DeskX-Setup.exe` and a portable zip file in the `out/make/zip/win32/x64/` folder as `DeskX-win32-x64-1.0.0.zip`.

### Option D — From Source

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
| **🔒 Lock Widgets** | Disable drag-to-reposition on the desktop |
| **🚫 Disable Widget Interaction** | Make all widgets passive (no click/keyboard events) |
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

Drag any widget in the editor preview to set its initial position. Its position is saved as a percentage of the monitor size so it scales at any resolution.

> [!TIP]
> You can also **drag widgets directly on your desktop** — no need to open the settings window. Just grab and move any widget while the wallpaper is active.

### Configuring a Widget

Click a widget in the editor to select it. The **Widget Settings** panel on the right updates to show:

| Control | Description |
|---|---|
| **Description** | A brief tip explaining the widget and its desktop interactions |
| **Scale** | Resize the widget (0.5× to 3×) |
| **Theme** | Light or Dark text mode |
| **Type-specific options** | City search, custom text, embed code, countdown date, etc. |
| **Draggable on Desktop** | Allow live drag-to-reposition directly on the desktop (on by default) |
| **Interactive on Desktop** | Enable widget-specific click/keyboard interactions on the desktop (on by default) |

> [!NOTE]
> **Draggable** and **Interactive** are global toggles — they apply to all widgets at once. The position is automatically saved after every drag.

### Setting a City for Weather Widgets

1. Select a weather widget (Weather, Detailed Weather, Clock+Weather, Astronomy, AQI).
2. In the Inspector, find the **Location** field.
3. Type a city name — suggestions appear as you type.
4. Optionally type a country name first to narrow down results.
5. Click a suggestion to confirm — a green flash confirms the city was set.

> [!NOTE]
> The city name and country are displayed directly on the widget so you always know which location's data is shown.

### Deleting a Widget

Select a widget in the editor, then click the **Delete Widget** button in the Widget Settings panel. The button is always visible at the bottom of the panel regardless of how many settings are shown.

---

## 🖱️ Interacting with Widgets on the Desktop

Widgets sit on a transparent overlay layer **above** your desktop icons. Empty areas of the overlay pass mouse clicks through to the desktop and icons normally.

### Live Drag

While widgets are **Draggable**, you can grab any widget and move it anywhere on screen. The new position is saved automatically.

### Per-Widget Interactions

| Widget | Desktop Interaction |
|---|---|
| **Digital Clock** | Click to toggle 12h / 24h format |
| **Calendar** | Click **◀ ▶** arrows to navigate between months |
| **Quote of the Day** | Click the widget to load a new random quote |
| **Custom Text** | Double-click to edit the text inline; press Enter or click away to save |
| **Weather / Detailed Weather / Astronomy / AQI** | Hover over widget to reveal a 🔄 refresh button |

### Locking Widgets

To prevent accidental movement, right-click the tray icon and select **🔒 Lock Widgets**. Dragging is disabled until you unlock.

### Disabling All Interaction

Right-click the tray → **🚫 Disable Widget Interaction** to make all widgets completely passive (no mouse or click events). Select **👆 Enable Widget Interaction** to restore.

---

## 🧩 Widget Reference

| Widget | What It Shows | Config Options | Desktop Interaction |
|---|---|---|---|
| **Digital Clock** | Current time (12h or 24h) and optional date | 12h toggle, show date toggle | Click to toggle 12h/24h |
| **Analog Minimalist** | Clean borderless clock hands | Theme | — |
| **Analog Numbered** | Analog clock with hour numbers | Theme | — |
| **Weather** | Temperature, condition icon, city + country | City search | Hover to refresh |
| **Detailed Weather** | Feels Like, Humidity, Wind, UV + city | City search | Hover to refresh |
| **Clock + Weather** | Digital time + weather summary + city | City search, 12h toggle | — |
| **Astronomy** | Sunrise, Sunset, Moon phase + city | City search | Hover to refresh |
| **Air Quality (AQI)** | US-EPA level (1–6), label, PM2.5 + city | City search | Hover to refresh |
| **Custom Text** | Any user-written text or label | Text content | Double-click to edit inline |
| **HTML Embed (iframe)** | Any iframe-compatible embed code | Embed code textarea | — |
| **Battery Status** | Battery % + charging indicator | None | — |
| **Countdown Timer** | Days/Hours/Minutes/Seconds to a target | Label, target date & time | — |
| **Quote of the Day** | Random inspirational quote (refreshes every 2h) | None | Click to refresh |
| **Calendar** | Current month grid, today highlighted | None | ◀ ▶ month navigation |

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
| **Draggable on Desktop** | Widget Settings panel | Allow live drag-to-reposition on the desktop |
| **Interactive on Desktop** | Widget Settings panel | Enable widget click/keyboard interactions on desktop |

Settings are saved to `%AppData%/Roaming/DeskX/config.json` and persist across restarts.

---

## ⚠️ Important Notes

- **Windows only** — uses Win32 WorkerW injection which is Windows-specific.
- **Works behind icons** — DeskX renders wallpapers _behind_ your desktop icons and taskbar, not on top.
- **No GPU required** — video decoding uses Chromium's built-in codecs (hardware acceleration used when available).
- **Single instance** — only one DeskX can run at a time. Launching a second instance focuses the first.
- **Supported formats** — PNG, JPG, WebP, BMP, GIF, MP4, WebM, MKV, AVI, MOV, WMV, FLV, HTML.
- **Weather widgets require internet** — they use WeatherAPI.com (free tier, key bundled). Other widgets (Clock, Calendar, Battery, Custom Text) work fully offline.
