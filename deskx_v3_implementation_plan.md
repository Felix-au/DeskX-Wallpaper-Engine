# DeskX v3 — Implementation Plan

> Based on `future_ideas.md`, `DeskX.md`, `CHANGELOG.md`, and a full source audit.
> Current state: v3 IN DEV — 14 widget types, transparent overlay, interactive desktop layer all working.

---

## Phase 1 — Superimpose Toggles (Z-Order Control)

**Complexity: High | Impact: High**

### Architecture Decision

The `future_ideas.md` proposes two approaches. The **recommended path** is **3 fixed z-order layers** (not one window per widget), because:
- Fewer `BrowserWindow` instances → lower memory & CPU
- Simpler IPC routing
- Easier to reason about hit-test regions

```
Layer 0 (default):   HWND_BOTTOM   — below apps, below taskbar  ← current overlay
Layer 1 (taskbar):   z > taskbar   — above taskbar, below apps
Layer 2 (topmost):   HWND_TOPMOST  — above all apps
```

Each layer is one transparent, frameless `BrowserWindow`. Widgets are routed into the correct one based on their flags.

---

### 1.1 — Data Schema (`settings-store.js`)

Add two new boolean fields to **every widget object** in the per-widget config:

```js
// In widget schema (inside monitors[id].widgets[] and globalConfig.widgets[])
{
  type: 'digital-clock',
  x: 0.5, y: 0.1,
  scale: 1,
  theme: 'light',
  // --- NEW ---
  superimposeTaskbar: false,   // floats above Windows taskbar
  superimposeAll: false,       // floats above all app windows (HWND_TOPMOST)
  // ...existing type-specific keys
}
```

No schema change needed to `settings-store.js` top-level — the `widgets` array stores `type: 'object'` items, so extra keys are already accepted.

---

### 1.2 — Win32 Helpers (`win32-wallpaper.js`)

Add two new exported functions:

```js
/**
 * Raise a window above the taskbar but below normal app windows.
 * Uses SetWindowPos with HWND_TOPMOST then immediately HWND_NOTOPMOST
 * to position it above Shell_TrayWnd z-order.
 */
function pinOverlayAboveTaskbar(hwnd) { ... }

/**
 * Set a window as always-on-top above all apps (HWND_TOPMOST).
 */
function pinOverlayTopmost(hwnd) { ... }

/**
 * Restore window to bottom layer (below all apps + below taskbar).
 */
function pinOverlayToBottom(hwnd) { ... }   // already exists
```

---

### 1.3 — Wallpaper Manager (`wallpaper-manager.js`)

Create **3 overlay `BrowserWindow`s** per monitor instead of 1:

```js
// Existing:  overlayWindows[displayId] = BrowserWindow

// New:
overlayLayers[displayId] = {
  bottom:   BrowserWindow,   // default layer
  taskbar:  BrowserWindow,   // superimposeTaskbar
  topmost:  BrowserWindow,   // superimposeAll
};
```

Each layer window loads `overlay.html`. On widget config push, split widgets array by flags before sending:

```js
function routeWidgetsByLayer(widgets) {
  const bottom  = widgets.filter(w => !w.superimposeTaskbar && !w.superimposeAll);
  const taskbar = widgets.filter(w =>  w.superimposeTaskbar && !w.superimposeAll);
  const topmost = widgets.filter(w =>  w.superimposeAll);
  return { bottom, taskbar, topmost };
}
```

Send each subset to its respective BrowserWindow via IPC (`set-widgets`).

**Z-order maintenance loop** (currently `pinOverlayToBottom` is called periodically): expand to:
- `bottom` layer → `pinOverlayToBottom`
- `taskbar` layer → `pinOverlayAboveTaskbar`
- `topmost` layer → `pinOverlayTopmost`

---

### 1.4 — Inspector Panel (`settings.js`)

Below the existing **Draggable** / **Interactive** toggles in the per-widget inspector, add:

```
─────────────────────────────
Z-ORDER
[ ] Superimpose Taskbar    ← floats above taskbar
[ ] Superimpose All        ← floats above all apps
─────────────────────────────
```

**Logic:**
- Checking `Superimpose All` auto-checks and disables `Superimpose Taskbar` (forced on).
- Unchecking `Superimpose All` re-enables `Superimpose Taskbar` independently.
- Sends updated config via `overlay:widget-config-changed` IPC.

---

### 1.5 — Tray Menu (`tray.js`)

No tray changes needed for Phase 1 — superimpose is per-widget only.

---

### 1.6 — Files Changed Summary

| File | Change |
|---|---|
| `win32-wallpaper.js` | Add `pinOverlayAboveTaskbar`, `pinOverlayTopmost` |
| `wallpaper-manager.js` | Create 3 overlay layers per monitor, `routeWidgetsByLayer`, update z-order loop |
| `settings.js` | Two new toggle rows in inspector, auto-link logic |
| `settings.css` | Style new Z-ORDER section in inspector |
| `DeskX.md` | Document new toggles and 3-layer architecture |
| `future_ideas.md` | Mark as planned/in-progress |

---

## Phase 2 — Calendar Widget: Date Marking

**Complexity: Medium | Impact: High**

### 2.1 — Data Schema

Each Calendar widget's config gains a `marks` object keyed by ISO date string:

```json
{
  "type": "calendar",
  "marks": {
    "2026-05-20": { "color": "#f59e0b", "label": "Exam" },
    "2026-05-25": { "color": "#10b981", "label": "Birthday" }
  }
}
```

- Persisted in `electron-store` as part of the widget config blob (no schema change needed — `widgets` array items are open objects).
- Survives restarts automatically.

---

### 2.2 — Overlay Renderer (`overlay.js`)

Update the `renderCalendar(widget)` function:

**Day cell rendering:**
- After rendering the date number, check `widget.config.marks[isoDate]`.
- If a mark exists, append:
  - A color dot `<span class="mark-dot" style="background:COLOR">` below the number.
  - A pill label `<span class="mark-label">LABEL</span>` if label is non-empty.
  - Multiple marks: show a count badge `+N` with a tooltip listing all.

**Click handler (interactive mode):**
- Click a date cell → open inline popover anchored to the cell:
  ```
  ┌──────────────────────┐
  │ 🎨 ● ● ● ● ●  (swatches)
  │ 📝 [____________]   (label input)
  │ [Save]  [Delete]
  └──────────────────────┘
  ```
- Sends updated `marks` object via `overlay:widget-config-changed` IPC.

**Cross-month indicator:**
- When navigating months, count marks in the prev/next month.
- Show `◀ 2` / `3 ▶` beside nav arrows when marks exist in adjacent months.

---

### 2.3 — Inspector Panel (`settings.js`)

Add a **"Marked Dates"** section at the bottom of the Calendar widget inspector:

```
MARKED DATES
┌─────────────────────────────────┐
│ 2026-05-20  🟡  Exam     [✏️][🗑️] │
│ 2026-05-25  🟢  Birthday [✏️][🗑️] │
└─────────────────────────────────┘
[+ Add Date Mark]
```

- Inline edit row → date picker + color swatch + label input.
- Delete row → removes from config, sends IPC update.

---

### 2.4 — Overlay Styles (`overlay.css`)

```css
.mark-dot { width: 6px; height: 6px; border-radius: 50%; margin: 1px auto; }
.mark-label { font-size: 8px; padding: 1px 3px; border-radius: 3px; background: rgba(255,255,255,0.15); }
.mark-popover { position: absolute; background: rgba(20,20,40,0.92); border-radius: 10px; padding: 10px; z-index: 100; }
```

---

### 2.5 — Files Changed Summary

| File | Change |
|---|---|
| `overlay.js` | Calendar renderer: mark dots/pills, click popover, cross-month count |
| `overlay.css` | `.mark-dot`, `.mark-label`, `.mark-popover` styles |
| `settings.js` | "Marked Dates" inspector section for calendar widgets |
| `settings.css` | Mark list row styles in inspector |
| `DeskX.md` | Update Calendar widget reference section |

---

## Phase 3 — Widget Interaction Enhancements

**Complexity: Low–Medium per widget | Impact: Medium**

Implement per-widget improvements. Ordered by effort (lowest first):

### 3.1 — Quick Wins (1–2 hours each)

| Widget | Enhancement | Notes |
|---|---|---|
| **Quote of the Day** | Copy-to-clipboard button on hover | `navigator.clipboard.writeText(quote)` |
| **Countdown** | Completion glow animation | CSS keyframe on `.countdown-finished` class |
| **Countdown** | Double-click label to rename inline | Same pattern as Custom Text inline edit |
| **Battery** | Time remaining display | `BatteryManager.dischargingTime` → format as `Xh Ym` |
| **Custom Text** | Already done | — |

### 3.2 — Medium Effort (2–4 hours each)

| Widget | Enhancement | Notes |
|---|---|---|
| **AQI** | Full-background color tint | Apply `background-color` with low opacity matching severity color |
| **AQI** | Health advisory text | Static lookup table: AQI level → advisory string |
| **Weather** | °C/°F unit toggle on click | Store `useFahrenheit: bool` in widget config |
| **Weather** | 3-day forecast expand | WeatherAPI `forecast.json` endpoint (already using WeatherAPI) |
| **Weather** | Condition background tint | Map `condition.code` to a tint color |
| **Digital Clock** | Right-click context menu | `contextmenu` event → custom overlay menu |
| **HTML Embed** | Manual reload button on hover | `iframe.src = iframe.src` reassignment |

### 3.3 — Lower Priority

| Widget | Enhancement | Notes |
|---|---|---|
| **Analog Clock** | Right-click face switch | Toggle minimalist ↔ numbered via config |
| **Battery** | Low battery desktop notification | `Notification` API + threshold in inspector |
| **Quote of the Day** | Favourite quotes list | Store array in widget config, cycle through |

---

### 3.4 — Files Changed Summary

| File | Change |
|---|---|
| `overlay.js` | Per-widget interaction additions (see table above) |
| `overlay.css` | Hover buttons, tint effects, glow animations |
| `settings.js` | New inspector config fields (unit toggle, threshold, etc.) |
| `DeskX.md` | Update Widget Reference section for each changed widget |

---

## Phase 4 — High Impact Roadmap Items

**Plan only — no implementation scope yet**

| Feature | Complexity | Notes |
|---|---|---|
| **Pomodoro Timer Widget** | Low-Medium | New widget type: 25/5 cycle, start/pause/reset, desktop notification on break |
| **RSS News Ticker** | Medium | New widget: horizontal scroll marquee, RSS fetch + parse, configurable feed URL |
| **Global Hotkeys** | Low | Electron `globalShortcut` — `Ctrl+Alt+W` toggle interactive, `Ctrl+Alt+P` pause |
| **World Clock Widget** | Low | New widget: digital clock with timezone offset from `Intl.DateTimeFormat` |
| **Wallpaper Scheduler** | Medium | time-based switching — cron-style config, triggers `applyWallpapers()` |
| **Export/Import Config** | Low | `dialog.showSaveDialog` + JSON dump of entire store; import via file picker |
| **Auto-Update** | Medium | `electron-updater` package + GitHub Releases feed |
| **Wallpaper Gallery** | High | Separate BrowserWindow, community feed or curated ZIP catalog |
| **Playlist Mode** | Medium | Array of wallpaper paths + timer, cycle via `setInterval` |

---

## Recommended Execution Order

```
Phase 1: Superimpose Toggles      ← most unique, architectural
Phase 3.1: Quick Win Widgets      ← fast wins, good UX payoff
Phase 2: Calendar Date Marking    ← medium complexity, high delight
Phase 3.2: Medium Widgets         ← iterative, one widget at a time
Phase 4 items (as needed)
```

---

## Open Questions

1. **3-layer vs. per-widget BrowserWindow?** The 3-layer approach is recommended but requires all 3 overlay windows to stay in sync for hit-testing. Confirm this is acceptable.
2. **Calendar popover UX**: Should the click-to-mark popover appear in the overlay (desktop interactive mode only) or also be accessible from the inspector? Both is ideal but doubles the work.
3. **WeatherAPI forecast call**: The 3-day forecast needs a `forecast.json` call instead of `current.json`. Is the same API key used, or a separate quota concern?
4. **Battery low-alert**: Use Electron's `Notification` API or a custom in-overlay toast? Notification is simpler; in-overlay toast is more consistent with DeskX's style.
