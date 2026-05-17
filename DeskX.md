# DeskX: Wallpaper Engine — Technical Guide

> **Current release: v2.0.0.** Features marked **\[v3 DEV\]** are implemented in the development branch and will ship with the upcoming v3.0 release.

> **DeskX** is a Windows desktop application that replaces your static wallpaper with dynamic media and **live interactive widgets**. It uses a **split-window architecture**: the wallpaper renders in the Win32 WorkerW layer (behind desktop icons), while independent transparent overlay windows host all 14 widget types with full mouse, drag, and keyboard support. **\[v3 DEV\]** Three Z-order layers (bottom / taskbar / topmost) allow per-widget control over window stacking. Empty overlay areas pass clicks through to the shell, so desktop icons and the taskbar always work normally.

---

## Table of Contents

1. [How It Works — The Big Picture](#how-it-works--the-big-picture)
2. [Application Walkthrough](#application-walkthrough)
3. [Full Pathway #1 — Setting a Video Wallpaper](#full-pathway-1--setting-a-video-wallpaper)
4. [Full Pathway #2 — Spanning Across Monitors](#full-pathway-2--spanning-a-wallpaper-across-monitors)
5. [Full Pathway #3 — Adding a Weather Widget](#full-pathway-3--adding-a-weather-widget)
6. [Full Pathway #4 — Multi-Monitor Widget Setup](#full-pathway-4--independent-widgets-per-monitor)
7. [Full Pathway #5 — Interacting with Widgets on the Desktop](#full-pathway-5--interacting-with-widgets-on-the-desktop)
8. [Widget Reference — All 14 Types](#widget-reference--all-14-types)
9. [System Tray](#system-tray)
10. [Settings & Configuration](#settings--configuration)
11. [Building as Standalone EXE](#building-as-standalone-exe)
12. [Project Summary](#project-summary)

---

## How It Works — The Big Picture

```
┌──────────────┐     ┌──────────────┐     SetParent(wallpaperWindow, emptyWorkerW) → wallpaper is now behind desktop icons
│  You pick    │────▶│  DeskX       │                                    │
│  a wallpaper │     │  Settings UI │                                    ▼
│  (image/GIF/ │     │  fit mode,   │     3× overlay BrowserWindows per monitor (bottom / taskbar / topmost) [v3 DEV]
│  video/HTML) │     │  mode, opts  │                                    │
└──────────────┘     └──────┬───────┘                                    ▼
                            │             routeWidgetsByLayer() → distributes each widget to its correct layer [v3 DEV]
                            │                                    │
                            │                                    ▼
                            │             periodic SetWindowPos() per layer → maintains z-order automatically
                            │
                            │  ┌─────────────────────────────────┐
                            │  │  Layer 0 — Bottom Overlay       │
                            │  │  HWND_BOTTOM · default widgets  │
                            │  └─────────────────────────────────┘
                            │  ┌─────────────────────────────────┐
                            │  │  Layer 1 — Taskbar Overlay [v3] │
                            │  │  Above taskbar, below apps      │
                            │  └─────────────────────────────────┘
                            │  ┌─────────────────────────────────┐
                            │  │  Layer 2 — Topmost Overlay [v3] │
                            │  │  HWND_TOPMOST · above all apps  │
                            │  └─────────────────────────────────┘
```

**In plain English:**

1. **You pick a file** — drag and drop any image, GIF, video, or HTML file onto the DeskX settings window (or click Browse).
2. **You choose a fit mode** — Cover, Contain, Stretch, or Center. Live preview cards show you exactly what it'll look like before you apply.
3. **Click Apply** — DeskX injects a Chromium window behind your desktop icons using the Win32 WorkerW technique. Your wallpaper appears without covering anything.
4. **Configure Widgets** — open the widget editor, drag widgets onto the scaled WYSIWYG preview, and configure them in the inspector panel. City, scale, theme, and type-specific settings are all set here.
5. **Settings persist** — all configuration (wallpaper path, mode, fit, widget positions, and configs) is saved to `%AppData%/Roaming/DeskX/config.json` and automatically restored on next launch.

---

## Application Walkthrough

### Starting DeskX

When you launch DeskX (via `DeskX.exe` or `npm run dev`), the following happens:

1. The **Settings window** opens — showing your monitor layout, mode selector, wallpaper picker, and fit preview area.
2. A **system tray icon** (DeskX logo) appears in your taskbar notification area.
3. DeskX automatically **restores your last wallpaper configuration** from saved settings.
4. The **wallpaper windows** are injected into WorkerW on each monitor (or across all monitors in spanning mode).

### Closing / Minimizing

- Closing the settings window **minimizes DeskX to the system tray**. The wallpaper and widgets keep running.
- To fully quit, **right-click the tray icon → Quit**.
- To reopen settings, **click the tray icon** or right-click → Open Settings.

### The Settings Window

The settings window is divided into three areas:

| Area | What's Here |
|---|---|
| **Left Sidebar** | Monitor tiles (click to select), mode selector (Same/Different/Span), widget controls, apply/remove buttons |
| **Main Preview Area** | Fit mode preview cards (or widget editor canvas when in widget mode) |
| **Right Panel** | Widget Settings inspector (visible when a widget is selected) |

---

## Full Pathway #1 — Setting a Video Wallpaper

### Step 1: Choose Monitor Mode

Click **Same** in the mode selector — this applies one wallpaper to all monitors.

### Step 2: Pick the Video File

Drag an MP4 file onto the settings window, or click **Browse** and select it. The filename appears in the drop zone.

### Step 3: Choose Fit Mode

Four preview cards appear showing the video rendered at each fit:

| Card | What It Shows |
|---|---|
| **Cover** | Video scaled to fill the monitor — edges may be cropped |
| **Contain** | Full video visible — letterbox bars may appear |
| **Stretch** | Fills exactly — may distort aspect ratio |
| **Center** | Original size at screen center — may not fill |

Each card shows the monitor resolution and wallpaper resolution as a badge (e.g., `1920×1080 ← 3840×2160`).

Click the card you want. It highlights with an accent border.

### Step 4: Set Video Options

Below the fit cards, the **Options** panel appears for video files:

| Option | Description |
|---|---|
| **Sound** | Toggle audio playback on/off |
| **Loop** | Toggle continuous looping |

### Step 5: Apply

Click **Apply Wallpaper**. DeskX:

1. Sends the config to the main process via IPC.
2. Creates or reuses a `BrowserWindow` for each monitor (or all monitors in same mode).
3. Uses Win32 `SetParent()` to attach the window to the `WorkerW` behind desktop icons.
4. The wallpaper renderer loads the video with the selected fit CSS.

Your video now plays behind your desktop icons without covering anything.

---

## Full Pathway #2 — Spanning a Wallpaper Across Monitors

### Step 1: Select Span Mode

Click **Span** in the mode selector.

### Step 2: Add a Wide Wallpaper

Pick an image wider than a single monitor (e.g., a 3840×1080 dual-monitor wallpaper).

### Step 3: Preview the Span

The fit preview area changes to show the **multi-monitor layout**:

```
┌──────────────┐  ┌──────────────┐
│   Monitor 1  │  │   Monitor 2  │
│  (portion A) │  │  (portion B) │
└──────────────┘  └──────────────┘
       ↑ gap shown between monitors
```

Each tile shows its slice of the wallpaper at the correct aspect ratio. The gap between tiles represents the physical gap between your monitors.

### Step 4: Apply

Click **Apply Wallpaper**. DeskX creates a single spanning wallpaper window sized to cover the entire virtual desktop rectangle (across all monitors), then injects it into WorkerW. The wallpaper renders across all monitors as one continuous image.

---

## Full Pathway #3 — Adding a Weather Widget

### Step 1: Open the Widget Editor

In the settings window sidebar, click **Configure Widgets**. The main area switches to the widget editor — a scaled WYSIWYG canvas showing a preview of your wallpaper.

### Step 2: Add a Widget

Click **+ Add Widget** (or the monitor-specific button in Same mode). The widget picker modal opens.

The modal shows a scrollable 2-column grid of widget types, each with a live preview thumbnail. Scroll down to see all options.

Click **Weather**.

A Weather widget is added to the center of the canvas.

### Step 3: Position the Widget

Drag the widget to where you want it on screen. Its position is stored as a percentage so it scales correctly at any resolution.

### Step 4: Set the City

Click the weather widget to select it. The **Widget Settings** panel appears on the right.

In the **Location** field:

1. Start typing a city name — e.g., `"Lon"`.
2. Autocomplete suggestions appear below (e.g., London, Londrina, Long Beach…).
3. Optionally type a country first (e.g., `"United Kingdom"`) to narrow results.
4. Click a suggestion — the input shows `"London, United Kingdom"` with a green flash confirming success.

### Step 5: Adjust Scale and Theme

- Drag the **Scale** slider to resize (0.5× to 3×). The widget updates live on the canvas.
- Toggle **Theme** to switch between light text (for dark wallpapers) and dark text (for light wallpapers).

### Step 6: Apply

Click **Apply Wallpaper**. DeskX pushes the widget configuration to all wallpaper renderer windows via IPC. The weather widget appears on your desktop, fetching real data from WeatherAPI.com.

**What the widget shows:**

```
┌──────────────────────────┐
│  🌤️                      │
│  24°C                    │
│  Partly Cloudy           │
│  London, United Kingdom  │
└──────────────────────────┘
```

The widget refreshes automatically every 30 minutes.

---

## Full Pathway #4 — Independent Widgets Per Monitor

DeskX supports fully independent widget sets on each monitor, even when all monitors share the same wallpaper (Same mode).

### Step 1: Select Same Mode

Click **Same**. The wallpaper editor shows separate sections — one per monitor.

### Step 2: Add a Widget to Monitor 1

In the **Monitor 1** section, click its **+ Add Widget for Monitor 1** button. Add a Digital Clock. Position and configure it.

### Step 3: Add a Different Widget to Monitor 2

In the **Monitor 2** section, click **+ Add Widget for Monitor 2**. Add an Air Quality (AQI) widget. Set its city. Configure it independently.

### Step 4: Apply

Click **Apply Wallpaper**. Each monitor's wallpaper renderer window receives only its own widget configuration. Monitor 1 shows the clock; Monitor 2 shows the AQI panel.

> [!NOTE]
> In **Different** mode, click a monitor tile in the sidebar to switch context, then use the single **+ Add Widget** button. Each monitor’s wallpaper, fit mode, and widgets are all completely independent.

---

## Full Pathway #5 — Interacting with Widgets on the Desktop

Widgets render on a **transparent overlay window** that sits above the desktop but below all running applications. Empty areas of the overlay are fully transparent to mouse events — desktop icons, right-click menus, and drag-to-select all work normally.

### Live Drag

With **Draggable on Desktop** enabled (default), grab any widget and move it. The new position saves automatically via IPC.

### Per-Widget Desktop Interactions

| Widget | Interaction |
|---|---|
| **Digital Clock** | Left-click → toggle 12h/24h · **\[v3\]** Right-click → context menu (12h / Show Date / Show Seconds) |
| **Analog Minimalist / Numbered** | **\[v3\]** Right-click → toggle face between minimalist ↔ numbered (every click) |
| **Calendar** | Click **◀ ▶** to navigate months · **\[v3\]** Click any date → add color mark + label · Click marked date → edit/delete |
| **Quote of the Day** | Click to load new quote · **\[v3\]** 📋 copy · 🤍 save favourite · ⭐ cycle favs · 🌐 back to random |
| **Custom Text** | Double-click → inline edit; Enter saves; Esc cancels |
| **Weather / Detailed / Clock+Weather** | Hover → 🔄 refresh · **\[v3\]** Click temp → toggle °C/°F |
| **Detailed Weather** | **\[v3\]** Tap ▼ 3-Day Forecast → expand hi/lo forecast cards |
| **Astronomy / AQI** | Hover → 🔄 refresh |
| **HTML Embed** | **\[v3\]** Hover → 🔄 reload embed |
| **Battery** | **\[v3\]** Desktop notification fires when ≤15% unplugged |
| **Countdown Timer** | **\[v3\]** Click timer digits → inline date-picker popover · Double-click label → rename (Enter saves, Esc cancels) |

### Locking & Disabling

| Tray Action | Effect |
|---|---|
| **🔒 Lock Widgets** | Disables drag-to-reposition globally; tray shows 🔓 to unlock |
| **🚫 Disable Widget Interaction** | Makes all widgets fully passive (no click/hover events pass through); tray shows 👆 to re-enable |

> [!NOTE]
> When **Disable Widget Interaction** is active, the overlay behaves exactly like the old wallpaper-embedded widget layer — completely passive, click-through always on.

---

## Widget Reference — All 14 Types

### ⏰ Digital Clock

| Config | Description |
|---|---|
| **12h Mode** | Toggle 12h/24h |
| **Show Date** | Show full date below time |

**Desktop interactions:** Left-click → toggle 12h/24h · **\[v3\]** Right-click → context menu (12h / Date / Seconds).

**Refresh rate:** Every second.

---

### 🕐 Analog Minimalist / Analog Numbered

Minimalist (no numbers) or Classic (1–12 markers) analog clock faces.

| Config | Description |
|---|---|
| **Theme** | Light or Dark hands |

**\[v3\] Desktop interaction:** Right-click to toggle between minimalist and numbered face — persisted to config. Toggles back on every subsequent right-click.

**Refresh rate:** Continuous `requestAnimationFrame`.

---

### ☁️ Weather

| Config | Description |
|---|---|
| **Location** | City autocomplete search (WeatherAPI.com) |
| **\[v3\] Use Fahrenheit** | Toggle default unit |

**Desktop interactions:** Hover → 🔄 refresh · **\[v3\]** Click temperature → toggle °C/°F · **\[v3\]** Background tints to match condition.

**Refresh rate:** Every 30 minutes.

---

### 🌡️ Detailed Weather

Full stats: temp, feels-like, humidity, wind, UV index.

| Config | Description |
|---|---|
| **Location** | City autocomplete search |
| **\[v3\] Use Fahrenheit** | Toggle default unit |

**Desktop interactions:** Hover → 🔄 refresh · **\[v3\]** Click temperature → toggle °C/°F · **\[v3\]** Tap ▼ 3-Day Forecast → expand Mon/Tue/Wed hi/lo cards · **\[v3\]** Condition background tint.

**Refresh rate:** Every 30 minutes.

---

### 🕐☁️ Clock + Weather

Hybrid widget: digital time on top, weather summary below.

| Config | Description |
|---|---|
| **Location** | City search |
| **12h Mode** | Toggle 12/24h |
| **\[v3\] Use Fahrenheit** | Toggle default unit |

**\[v3\] Desktop interaction:** Click temperature → toggle °C/°F.

**Refresh rate:** Clock — every second. Weather — every 30 minutes.

---

### 🌅 Astronomy

Shows astronomical data for your location.

```
┌──────────────────────────┐
│  🌅 Sunrise: 05:47 AM    │
│  🌇 Sunset:  08:33 PM    │
│  🌙 Moon: Waxing Gibbous │
│  London, United Kingdom  │
└──────────────────────────┘
```

| Config | Description |
|---|---|
| **Location** | City search |

**Desktop interaction:** Hover to reveal a 🔄 refresh button.

**Refresh rate:** Every hour.

---

### 🌬️ Air Quality (AQI)

Displays the US-EPA Air Quality Index with color-coded severity.

```
┌────────────────────────────────┐
│ ║ Level 1: Good                │  ← green left border
│   PM2.5: 8 µg/m³               │
│   London, United Kingdom       │
└────────────────────────────────┘
```

| Level | Label | Border Color |
|---|---|---|
| 1 | Good | 🟢 Green |
| 2 | Moderate | 🟡 Yellow |
| 3 | Unhealthy for Sensitive Groups | 🟠 Amber |
| 4 | Unhealthy | 🔴 Red |
| 5 | Very Unhealthy | 🟣 Dark Red |
| 6 | Hazardous | ⚫ Near-Black |

| Config | Description |
|---|---|
| **Location** | City search |

**Desktop interaction:** Hover to reveal a 🔄 refresh button.

**Refresh rate:** Every 30 minutes.

---

### ✏️ Custom Text

Displays any user-defined text on the desktop.

| Config | Description |
|---|---|
| **Text Content** | Multi-line text area — anything you want shown |

**Desktop interaction:** Double-click to edit inline. Press `Enter` or click away to save. Keyboard input fully supported.

Use cases: Daily goals, motivational quotes, room labels on multi-monitor setups, team names, etc.

---

### 🪟 HTML Embed (iframe)

| Config | Description |
|---|---|
| **Embed Code** | Paste the full `<iframe>` tag from any service |

**\[v3\] Desktop interaction:** Hover → 🔄 reload button re-renders the embed without opening settings.

> [!NOTE]
> Some sites block iframe embedding via `X-Frame-Options`. Works best with services that provide explicit embed codes.

---

### 🔋 Battery Status

Shows battery level, visual bar, charging state, and estimated time remaining.

- Bar turns red when battery is below 20%.
- Lightning bolt (⚡) appears when charging.
- **\[v3\]** Estimated time remaining displayed (`~2h 15m`).
- **\[v3\]** Desktop notification fires once when battery ≤15% while unplugged.

**Refresh rate:** Every 60 seconds.

---

### ⏳ Countdown Timer

| Config | Description |
|---|---|
| **Label** | Event name (e.g., "Exam Day") — also editable directly on desktop |
| **Target Date** | Date + time picker |

**\[v3\] Desktop interactions:** Click timer digits → inline `datetime-local` popover to change target date · Double-click label → rename inline (Enter saves, Esc cancels) · Pulses with glow animation on completion.

**Refresh rate:** Every second.

---

### 💬 Quote of the Day

Displays a random inspirational quote.

No config needed. Fetches from the [type.fit API](https://type.fit/api/quotes).

**Desktop interactions:** Click/🔄 → new quote · 📋 copy to clipboard · **\[v3\]** 🤍 heart → save to favourites (❤️ when saved) · **\[v3\]** ⭐ → cycle through saved favourites only · **\[v3\]** 🌐 → back to random quotes.

**Refresh rate:** On demand / every 2 hours.

---

### 📅 Calendar

Shows the current month as a grid, with today highlighted.

Today's date cell has an accent-colored background with a glow effect.

**\[v3\] Desktop interactions:**
- Click **◀ ▶** arrows to navigate months (shows pending mark count per direction)
- Click any date cell → color-dot + label popover (8 swatches, Save / Delete)
- Click a marked date → edit or delete the existing mark
- Marks persist via `widget.config.marks` (ISO-keyed object) in `electron-store`
- **Inspector**: "Marked Dates" section lists all marks with add/edit/delete controls

**Refresh rate:** Midnight auto-refresh.

---

## System Tray

DeskX runs in the system tray. Right-click the icon for:

| Action | Description |
|---|---|
| **Open Settings** | Show the settings window |
| **Pause** | Pause all wallpaper and widget rendering |
| **Resume** | Resume after pause |
| **Mute** | Silence all video wallpapers |
| **Unmute** | Restore audio |
| **🔒 Lock Widgets** | Disable drag-to-reposition on the desktop |
| **🚫 Disable Widget Interaction** | Make all widgets passive (no click/keyboard events) |
| **Remove All Wallpapers** | Clear the desktop, remove all wallpapers and widgets |
| **Quit** | Fully exit DeskX |

---

## Settings & Configuration

All settings are persisted automatically to:

```
%AppData%\Roaming\DeskX\config.json
```

| Setting | Description |
|---|---|
| **Mode** | `same`, `different`, or `spanning` |
| **Wallpaper path** | Absolute path to the file |
| **Fit** | `cover`, `contain`, `stretch`, or `center` |
| **Sound** | `true`/`false` for video wallpapers |
| **Loop** | `true`/`false` for video wallpapers |
| **Autostart** | Toggles Windows startup via the registry |
| **widgetsDraggable** | `true`/`false` — allow live drag-to-reposition on the desktop |
| **widgetsInteractive** | `true`/`false` — enable widget click/keyboard interactions |
| **Widgets (per monitor)** | Array of widget objects keyed by display ID, each containing type, x, y, scale, theme, and type-specific config (locationQuery, customText, targetDate, etc.) |

---

## Building as Standalone EXE

To package DeskX as a distributable installer and portable ZIP:

```bash
npm run build
```

This runs the icon generator and then `electron-forge make`. Output:

```
out/make/
├── squirrel.windows/x64/
│   ├── DeskX-Setup.exe           # Squirrel installer (~118 MB)
│   └── DeskX-1.0.0-full.nupkg   # Update package
└── zip/win32/x64/
    └── DeskX-win32-x64-1.0.0.zip # Portable ZIP (~122 MB)
```

### What's Bundled Inside the EXE

- Full Chromium browser engine (Electron)
- Node.js runtime
- koffi Win32 FFI module (for WorkerW injection — extracted from asar at runtime)
- electron-store (JSON persistence)
- All application source, HTML, CSS, and JS

**Nothing downloads at runtime.** The EXE is entirely self-contained.

---

## Project Summary

DeskX is a Windows desktop application that injects dynamic wallpapers behind desktop icons using the undocumented Win32 WorkerW technique. On top of any wallpaper, a modular widget overlay system lets users place live widgets — weather, time, calendar, AQI, countdown, and more — independently configured per monitor.

### Key Components

| Component | File | Role |
|---|---|---|
| **App Entry** | `src/main/index.js` | Window creation, IPC handlers (all 3 layers), autostart, single-instance lock, anti-flicker flags |
| **Wallpaper Manager** | `src/main/wallpaper-manager.js` | Creates/manages wallpaper BrowserWindows (WorkerW) and **3 overlay BrowserWindows** per monitor; `routeWidgetsByLayer()` |
| **Win32 Integration** | `src/main/win32-wallpaper.js` | WorkerW injection + `pinOverlayToBottom`, `pinOverlayAboveTaskbar`, `pinOverlayTopmost` |
| **Settings Store** | `src/main/settings-store.js` | electron-store wrapper; includes `widgetsDraggable`, `widgetsInteractive` keys |
| **System Tray** | `src/main/tray.js` | Tray icon + context menu including Lock Widgets and Disable Interaction toggles |
| **IPC Bridge** | `src/preload/preload.js` | Secure contextBridge; overlay channels: `overlay:hit-test`, `overlay:widget-moved`, `overlay:widget-config-changed`, `overlay:request-focus` |
| **Settings UI** | `src/renderer/settings/settings.js` | Monitor layout, fit preview, widget editor & drag, inspector (all 14 widget descriptions + interactions + Z-order toggle) |
| **Settings Styles** | `src/renderer/settings/settings.css` | Glassmorphism design system, sliding toggle switches, calendar marks inspector |
| **Widget Picker** | `src/renderer/settings/index.html` | Scrollable widget type picker modal |
| **Overlay Renderer** | `src/renderer/overlay/overlay.js` | All 14 widgets + hit-test + live drag + all v3 interactions (context menus, forecasts, favourites, date picker, marks) |
| **Overlay Styles** | `src/renderer/overlay/overlay.css` | Widget styles incl. context menus, forecast cards, date-picker popover, condition tints, glow animations |
| **Wallpaper Renderer** | `src/renderer/wallpaper/renderer.js` | Media loading and fit CSS only (no widgets) |

### Technology Stack

- **Language**: JavaScript (Node.js + browser)
- **Framework**: Electron 34 (Chromium + Node.js)
- **Win32 FFI**: koffi (User32.dll — FindWindowW, EnumWindows, SetParent, SetWindowPos)
- **Persistence**: electron-store (JSON in `%AppData%`)
- **Weather Data**: WeatherAPI.com (free tier)
- **Quote Data**: type.fit API
- **Packaging**: Electron Forge (Squirrel installer + portable ZIP)
- **Platform**: Windows 10/11

---

*DeskX: Wallpaper Engine — your desktop, your rules.*
