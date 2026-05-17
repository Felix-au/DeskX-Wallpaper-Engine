# DeskX: Wallpaper Engine — Technical Guide

> **DeskX** is a Windows desktop application that replaces your static wallpaper with dynamic media and **live interactive widgets**. It uses a **split-window architecture**: the wallpaper renders in the Win32 WorkerW layer (behind desktop icons), while an independent transparent overlay window hosts all 14 widget types with full mouse, drag, and keyboard support. Empty areas of the overlay pass clicks through to the shell, so desktop icons and the taskbar always work normally.

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
12. [v3.0 — New Features (In Development)](#v30--new-features-in-development)
13. [Project Summary](#project-summary)

---

## How It Works — The Big Picture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│  You pick    │───▶│  DeskX       │────▶│  WorkerW         │────▶│ Wallpaper     │
│  a wallpaper │     │  Settings UI │     │  Injection       │     │  Appears       │
│  (image/GIF/ │     │  fit mode,   │     │  (Win32 API)     │     │  behind icons  │
│  video/HTML) │     │  mode, opts  │     │  via koffi FFI   │     │  & taskbar     │
└──────────────┘     └──────┬───────┘     └──────────────────┘     └────────────────┘
                            │
                            ▼
                   ┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
                   │  Widget Editor  │────▶│  Widget Config   │───▶│  Widgets live  │
                   │  (drag & drop)  │     │  saved per       │     │  on top of     │
                   │  Inspector panel│     │  monitor to      │     │  wallpaper     │
                   │  city search    │     │  electron-store  │     │  (IPC push)    │
                   └─────────────────┘     └──────────────────┘     └────────────────┘
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
| **Digital Clock** | Left-click to toggle 12h/24h · Right-click → context menu: toggle 12h, Show Date, Show Seconds |
| **Analog Minimalist** | Right-click → switch to numbered face (toggles back on next right-click) |
| **Analog Numbered** | Right-click → switch to minimalist face (toggles back on next right-click) |
| **Calendar** | Click **◀** / **▶** to navigate · Click any date cell → add color mark + label · Click marked date → edit/delete |
| **Quote of the Day** | Click/🔄 load new · 📋 copy · 🤍 heart to favourite · ⭐ cycle favourites only · 🌐 back to random |
| **Custom Text** | Double-click to activate inline editing; press `Enter` or click away to save · `Esc` to cancel |
| **Weather** | Click temperature → toggle °C/°F · Hover → 🔄 refresh |
| **Detailed Weather** | Click temperature → toggle °C/°F · Tap ▼ 3-Day Forecast → expand hi/lo cards · Hover → 🔄 refresh |
| **Clock + Weather** | Click temperature → toggle °C/°F |
| **Astronomy** | Hover to refresh |
| **Air Quality (AQI)** | Hover to refresh |
| **HTML Embed** | Hover → 🔄 reload button to refresh embed |
| **Battery** | Automatic desktop notification when battery ≤15% while unplugged |
| **Countdown** | Click timer digits → inline date-picker popover · Double-click label → rename inline |

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

Displays the current time in a large, bold format.

| Config | Description |
|---|---|
| **12h Mode** | Toggle between 12-hour (AM/PM) and 24-hour format |
| **Show Date** | Display the full date below the time |

**Desktop interactions:**
- **Left-click** the time → toggle 12h/24h format
- **Right-click** → context menu with live toggles: 12h Format / Show Date / Show Seconds (changes apply instantly and persist)

**Refresh rate:** Every second.

---

### 🕐 Analog Minimalist

A clean, borderless analog clock with hour, minute, and red second hands.

| Config | Description |
|---|---|
| **Theme** | Light (white hands) or Dark (black hands) |

**Desktop interaction:** Right-click → switch to numbered face. Right-click again → switch back. Toggles every right-click. Face choice persisted in config.

**Refresh rate:** Every second (requestAnimationFrame).

---

### 🕐 Analog Numbered

Analog clock with hour numbers (1–12) positioned around the face.

| Config | Description |
|---|---|
| **Theme** | Light or Dark |

**Desktop interaction:** Right-click → switch to minimalist face. Right-click again → switch back.

**Refresh rate:** Every second (requestAnimationFrame).

---

### ☁️ Weather

Shows the current temperature, weather condition icon, and city name.

```
┌──────────────────────────┐
│  🌤️   24°C               │
│  Partly Cloudy           │
│  London, United Kingdom  │
└──────────────────────────┘
```

| Config | Description |
|---|---|
| **Location** | City autocomplete search (WeatherAPI.com) |
| **Use Fahrenheit (°F)** | Default unit for temperature display |

**Desktop interactions:**
- **Click the temperature** → toggle °C ↔ °F (persisted per widget)
- **Background tint** changes automatically to match condition (sunny=amber, rain=blue, snow=light-blue, thunder=purple, overcast=grey)
- **Hover** → 🔄 refresh button

**Refresh rate:** Every 30 minutes.

---

### 🌡️ Detailed Weather

Comprehensive weather panel with a full stats grid.

```
┌──────────────────────────┐
│  24°C  🌤️                │
│  Partly Cloudy           │
│  London, United Kingdom  │
│  Feels Like: 22°C        │
│  Humidity: 68%           │
│  Wind: 14 km/h           │
│  UV Index: 3             │
│  ▼ 3-Day Forecast        │
└──────────────────────────┘
```

| Config | Description |
|---|---|
| **Location** | City autocomplete search |
| **Use Fahrenheit (°F)** | Default unit for temperature display |

**Desktop interactions:**
- **Click the temperature** → toggle °C ↔ °F
- **Tap ▼ 3-Day Forecast** → expands Mon/Tue/Wed hi/lo cards (fetched from `forecast.json`; respects current unit)
- **Condition tint** applied to widget background automatically
- **Hover** → 🔄 refresh

**Refresh rate:** Every 30 minutes.

---

### 🕐☁️ Clock + Weather

Hybrid widget: digital time on top, weather summary below.

```
┌──────────────────────────┐
│  12:45                   │
│  🌤️  24°C   London       │
└──────────────────────────┘
```

| Config | Description |
|---|---|
| **Location** | City search |
| **12h Mode** | Toggle 12/24h |

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

**Desktop interaction:** Hover to refresh. Background tints to match severity level (green → yellow → amber → red → dark red → near-black). One-line health advisory displayed below the level label.

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

Embeds any iframe-compatible HTML snippet directly on your desktop.

| Config | Description |
|---|---|
| **Embed Code** | Paste the full `<iframe>` tag from any service |

Use cases: Spotify Now Playing, Twitch stream widget, custom clock from a web service, etc.

**Desktop interaction:** Hover → 🔄 reload button appears. Clicking it re-renders the embed container without needing to open settings.

> [!NOTE]
> This widget renders the raw HTML/iframe. Some sites block iframe embedding (X-Frame-Options header). Works best with services that explicitly provide embed codes.

---

### 🔋 Battery Status

Shows your laptop's battery level with a visual bar and charging indicator, plus estimated time remaining.

```
┌────────────────────────┐
│  [████████  ] 78%      │
│  ⚡ Charging  ~1h 20m  │
└────────────────────────┘
```

- Bar turns red when battery is below 20%.
- Lightning bolt (⚡) appears when charging.
- Time remaining shown as `~2h 15m` (discharging) or `~45m` (charging to full).
- **Desktop notification** fires automatically when battery drops to ≤15% while unplugged (fires once per session). Threshold configurable via `widget.config.lowBatteryAlert`.

**No config needed.** Uses the browser `navigator.getBattery()` API. Works offline.

**Refresh rate:** Every 60 seconds.

---

### ⏳ Countdown Timer

Counts down to a user-specified date and time.

```
┌────────────────────────────┐
│  EXAM DAY                  │
│  12d  04h  35m  22s        │
└────────────────────────────┘
```

| Config | Description |
|---|---|
| **Label** | Name for the event (e.g., "Exam Day", "Launch", "Vacation") |
| **Target Date** | Date + time picker for the countdown target |

When the countdown reaches zero the widget pulses with an indigo glow and shows "[Label] Finished! 🎉".

**Desktop interactions:**
- **Click the timer digits** → opens a dark inline date-picker popover directly on the desktop — set a new target without opening settings. Save or Cancel.
- **Double-click the label** → rename inline. Press `Enter` to save, `Esc` to cancel.

> [!NOTE]
> The DOM is built once at widget setup. The timer updates only text nodes each second, so label editing is never interrupted by tick redraws.

**Refresh rate:** Every second.

---

### 💬 Quote of the Day

Displays a random inspirational quote. Refreshes every 2 hours.

```
┌──────────────────────────────────┐
│  "The only way to do great work  │
│   is to love what you do."       │
│                — Steve Jobs      │
│  🤍  ⭐  🌐              📋     │
└──────────────────────────────────┘
```

No config needed. Fetches from the [type.fit API](https://type.fit/api/quotes).

**Desktop interactions:**
- **Click quote body / 🔄** → load a new random quote
- **📋** → copy `"quote" — Author` to clipboard (shows "Copied!" flash)
- **🤍 Heart** → save current quote to favourites (turns ❤️; click again to remove)
- **⭐** → switch to cycling through saved favourites only
- **🌐** → switch back to random mode (API)

Favourites are stored in `widget.config.favourites` and persist across restarts.

**Refresh rate:** Every 2 hours (random mode) / immediate cycle (favourites mode).

---

### 📅 Calendar

Shows the current month as a grid with today highlighted. Supports **date marking** — add color-coded dots and labels to any date.

```
┌─────────────────────────────┐
│  ◀ 1    MAY  2026    3 ▶   │
│  S  M  T  W  T  F  S        │
│              1  2  3        │
│  4  5  6  7  8  9 10        │
│ 11 12 13 14 15 16 17        │
│ 18 19 20 21 22 23 24        │
│ 25 26 27[28]29 30 31 ●      │
│          ↑ today  ↑ mark    │
└─────────────────────────────┘
```

Today's date cell has an accent-colored background with a glow effect.

**Desktop interactions:**
- **◀ / ▶ arrows** → navigate months. Arrows show the count of marks in the adjacent month (e.g., `◀ 1` / `3 ▶`).
- **Click any date cell** → opens a mark popover with 8 color swatches and a label input. Click Save to add a colored dot + label pill to that date.
- **Click a marked date** → reopens the popover to edit the color/label or Delete the mark.

**Inspector:** The "Marked Dates" section lists all marks with color swatch, label, and a delete button. An Add button lets you create marks without navigating to the date.

Marks are stored in `widget.config.marks` (ISO-date keyed object) and persist across restarts.

No API needed. Uses the system date. Automatically refreshes at midnight.

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

---

## v3.0 — New Features (In Development)

> All features in this section are implemented in the current dev build and will ship with the official v3.0 release.

### 📦 3-Layer Z-Order Overlay Architecture

Each monitor now runs **three** stacked overlay `BrowserWindow`s instead of one:

| Layer | Win32 Z-Order | Default For |
|---|---|---|
| **Bottom** | `HWND_BOTTOM` | All widgets by default |
| **Taskbar** | Above taskbar, below apps | `superimposeTaskbar=true` |
| **Topmost** | `HWND_TOPMOST` | `superimposeAll=true` ("Float Above All Windows") |

Widgets are distributed to their correct layer by `routeWidgetsByLayer()` in `wallpaper-manager.js`. All IPC handlers (hit-test, widget-moved, config-changed) now search all 3 layers.

Enable via the **"Float Above All Windows"** inspector toggle (replaces the old two-toggle Superimpose system).

### 📅 Calendar Date Marking

- Click any day cell → color-dot + label popover (8 swatches, text input, Save / Delete).
- Marks render as colored dots beneath the date number; label pill shows for single marks; `+N` badge for multiple.
- Navigation arrows show mark counts for adjacent months (`◄ 2` / `3 ►`).
- Inspector "Marked Dates" section: manage all marks with edit/delete without navigating months.
- Persisted in `widget.config.marks` via `electron-store`.

### 🌡️ Weather Upgrades

- **°C/°F toggle**: Click the temperature on any weather widget. Inspector toggle added. Persisted in `widget.config.useFahrenheit`.
- **3-Day Forecast**: ▼ expand button on Detailed Weather — fetches `forecast.json`, renders Mon/Tue/Wed hi/lo cards respecting current unit.
- **Condition tint**: Widget background subtly tints based on weather condition (sunny=amber, rain=blue, snow=light-blue, thunder=purple, overcast=grey).

### 🕐 Analog Clock Face Toggle

Right-click any analog widget to toggle between minimalist (no numbers) and numbered (1–12) face. Right-click again to switch back. Every right-click toggles. Face choice saved in `widget.config.analogFace`.

Implemented cleanly: the `contextmenu` listener is attached **once** per widget lifetime — not on every rebuild — preventing the listener-stacking bug where even-numbered clicks had no effect.

### ⏰ Digital Clock Context Menu

Right-click the digital clock to open a custom context menu with live ✓-checked toggles for:
- **12h Format** — switches between 12h AM/PM and 24h
- **Show Date** — toggles the date line below the time
- **Show Seconds** — toggles the seconds display

All changes apply instantly and persist.

### ⏳ Countdown Enhancements

- **No-flicker DOM rewrite**: DOM is built once at setup; `update()` patches only text content each second — label editing is never interrupted by tick redraws.
- **Inline label rename**: Double-click the label → `contentEditable` with `isEditing` guard. `Enter` saves, `Esc` cancels.
- **Inline date picker**: Click the timer digits → dark popover with `datetime-local` input + Save/Cancel appears above the widget. Updates the countdown immediately on save.

### 💬 Quote Favourites

- **🤍 Heart** button saves the current quote to `widget.config.favourites`.
- **⭐ Star** button switches to cycling through saved favourites only (no API calls).
- **🌐 Globe** button switches back to random API mode.
- **📋 Copy** button copies `"quote" — Author` to clipboard with a "Copied!" flash.
- Favourites persist in `electron-store`.

### 🔋 Battery Low-Alert Notification

A desktop notification fires once per session when battery level drops to ≤15% while unplugged. Uses the standard browser `Notification` API. Threshold is `widget.config.lowBatteryAlert` (default 15). Time remaining is displayed on the widget using `BatteryManager.dischargingTime` / `chargingTime`.

### 🧱 HTML Embed Reload

Hover over an embed widget to reveal a 🔄 reload button. Clicking it re-renders the embed container without opening the settings window.

### 🛡️ Settings Window Anti-Flicker

Dragging the settings window between monitors with different DPI no longer flickers:
- `thickFrame: false` on the `BrowserWindow` removes `WS_THICKFRAME`, preventing DWM repaints on monitor transitions.
- `backgroundThrottling: false` keeps the renderer active during drag.
- `in-process-gpu` + `disable-gpu-sandbox` commandLine switches suppress Chromium's brief transparent repaint.
- A debounced `move`-event `setBackgroundColor` call forces a repaint after each window move.

---

## Project Summary

DeskX is a Windows desktop application that injects dynamic wallpapers behind desktop icons using the undocumented Win32 WorkerW technique. On top of any wallpaper, a modular widget overlay system lets users place live widgets — weather, time, calendar, AQI, countdown, and more — independently configured per monitor.

### Key Components

| Component | File | Role |
|---|---|---|
| **App Entry** | `src/main/index.js` | Window creation, IPC handlers (multi-layer aware), anti-flicker switches |
| **Wallpaper Manager** | `src/main/wallpaper-manager.js` | Creates/manages wallpaper BrowserWindows (WorkerW) and **3 overlay layers** per monitor; `routeWidgetsByLayer()` |
| **Win32 Integration** | `src/main/win32-wallpaper.js` | WorkerW injection + `pinOverlayToBottom`, `pinOverlayAboveTaskbar`, `pinOverlayTopmost` |
| **Settings Store** | `src/main/settings-store.js` | electron-store wrapper; includes `widgetsDraggable`, `widgetsInteractive`, per-widget config keys |
| **System Tray** | `src/main/tray.js` | Tray icon + context menu including Lock Widgets and Disable Interaction toggles |
| **IPC Bridge** | `src/preload/preload.js` | Secure contextBridge; overlay channels: `overlay:hit-test`, `overlay:widget-moved`, `overlay:request-focus` |
| **Settings UI** | `src/renderer/settings/settings.js` | Monitor layout, fit preview, widget editor & drag, inspector panel with descriptions & all v3 toggles |
| **Settings Styles** | `src/renderer/settings/settings.css` | Glassmorphism design system, scrollable inspector, sliding toggle switches, widget description box |
| **Widget Picker** | `src/renderer/settings/index.html` | Scrollable widget type picker modal |
| **Overlay Renderer** | `src/renderer/overlay/overlay.js` | All 14 widget types, hit-test loop, live drag, all v3 interactions (context menus, forecasts, favourites, etc.) |
| **Overlay Styles** | `src/renderer/overlay/overlay.css` | Widget visual styles, context menu, forecast cards, date-picker popover, condition tints |
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
