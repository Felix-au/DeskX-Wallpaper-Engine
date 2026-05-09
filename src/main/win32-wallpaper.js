// ===========================================================================
// Wallpaper Engine – Win32 Wallpaper Attachment via Koffi
// Uses the WorkerW technique to embed windows behind desktop icons
//
// TECHNIQUE:
//   1. Find "Progman" window
//   2. Send undocumented message 0x052C → spawns a WorkerW pair
//   3. Enumerate top-level windows → find the one with SHELLDLL_DefView
//   4. FindWindowEx(NULL, thatWindow, "WorkerW", NULL) → gives us the
//      empty WorkerW that sits BEHIND the desktop icons
//   5. SetParent(ourWindow, emptyWorkerW)
//
// FALLBACK (if WorkerW isn't found):
//   - Use SetWindowPos with HWND_BOTTOM and WS_EX_TOOLWINDOW
//   - This keeps the window at the very bottom of the z-order
//   - Combined with a timer that re-pushes it to bottom
// ===========================================================================

const koffi = require('koffi');

const user32 = koffi.load('user32.dll');

// ── Function declarations ───────────────────────────────────────────

const FindWindowW = user32.func('__stdcall', 'FindWindowW', 'void *', [
  'str16', 'str16',
]);

const FindWindowExW = user32.func('__stdcall', 'FindWindowExW', 'void *', [
  'void *', 'void *', 'str16', 'str16',
]);

const SendMessageTimeoutW = user32.func('__stdcall', 'SendMessageTimeoutW', 'intptr_t', [
  'void *', 'uint32', 'uintptr_t', 'intptr_t', 'uint32', 'uint32', 'void *',
]);

const EnumWindowsCallback = koffi.proto('__stdcall', 'EnumWindowsCallback', 'int32', [
  'void *', 'intptr_t',
]);
const EnumWindows = user32.func('__stdcall', 'EnumWindows', 'int32', [
  koffi.pointer(EnumWindowsCallback), 'intptr_t',
]);

const SetParent = user32.func('__stdcall', 'SetParent', 'void *', [
  'void *', 'void *',
]);

const ShowWindow = user32.func('__stdcall', 'ShowWindow', 'int32', [
  'void *', 'int32',
]);

const SetWindowLongPtrW = user32.func('__stdcall', 'SetWindowLongPtrW', 'intptr_t', [
  'void *', 'int32', 'intptr_t',
]);

const GetWindowLongPtrW = user32.func('__stdcall', 'GetWindowLongPtrW', 'intptr_t', [
  'void *', 'int32',
]);

const SetWindowPos = user32.func('__stdcall', 'SetWindowPos', 'int32', [
  'void *', // hWnd
  'void *', // hWndInsertAfter
  'int32',  // X
  'int32',  // Y
  'int32',  // cx
  'int32',  // cy
  'uint32', // uFlags
]);

// ── Constants ───────────────────────────────────────────────────────

const SMTO_NORMAL = 0x0000;
const GWL_STYLE = -16;
const GWL_EXSTYLE = -20;

const WS_CHILD       = 0x40000000;
const WS_POPUP       = 0x80000000;
const WS_VISIBLE     = 0x10000000;
const WS_CLIPSIBLINGS = 0x04000000;

const WS_EX_TOOLWINDOW    = 0x00000080; // Hide from taskbar + alt-tab
const WS_EX_NOACTIVATE    = 0x08000000; // Don't steal focus
const WS_EX_LAYERED       = 0x00080000;
const WS_EX_TRANSPARENT   = 0x00000020;
const WS_EX_APPWINDOW     = 0x00040000; // REMOVE this to hide from taskbar

const SW_SHOW = 5;
const SW_SHOWNOACTIVATE = 4;

// SetWindowPos constants
const HWND_BOTTOM = 1; // Place at bottom of z-order
const SWP_NOMOVE    = 0x0002;
const SWP_NOSIZE    = 0x0001;
const SWP_NOACTIVATE = 0x0010;
const SWP_NOSENDCHANGING = 0x0400;
const SWP_SHOWWINDOW = 0x0040;

// ── State ───────────────────────────────────────────────────────────

let workerWHandle = null;
let fallbackTimers = new Map(); // hwndValue → setInterval id
let usingFallback = false;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Convert Electron's getNativeWindowHandle() Buffer to a numeric pointer.
 */
function bufferToHwnd(buf) {
  if (buf.length >= 8) return Number(buf.readBigUInt64LE(0));
  return buf.readUInt32LE(0);
}

// ── Core: Find the WorkerW ──────────────────────────────────────────

/**
 * Find the correct WorkerW window for wallpaper embedding.
 *
 * After sending 0x052C to Progman, Windows creates a WorkerW pair:
 *   - WorkerW-A: contains SHELLDLL_DefView (desktop icons)
 *   - WorkerW-B: empty, sits BEHIND WorkerW-A (this is our target)
 *
 * We find WorkerW-B by:
 *   1. Enumerating top-level windows to find the one with SHELLDLL_DefView
 *   2. Calling FindWindowEx(NULL, thatWindow, "WorkerW", NULL) to get the
 *      next WorkerW in z-order — which is the empty one behind the icons.
 */
function findWorkerW() {
  // Step 1: Find Progman
  const progman = FindWindowW('Progman', null);
  if (!progman) {
    console.error('[Win32] Cannot find Progman window');
    return null;
  }
  console.log('[Win32] Found Progman');

  // Step 2: Send 0x052C to spawn WorkerW pair
  const resultBuf = Buffer.alloc(8);
  SendMessageTimeoutW(progman, 0x052C, 0xD, 0x1, SMTO_NORMAL, 1000, resultBuf);
  console.log('[Win32] Sent 0x052C to Progman');

  // Step 3: Find the window that contains SHELLDLL_DefView
  let shellViewParent = null;

  const cb = koffi.register((hwnd, _lp) => {
    const defView = FindWindowExW(hwnd, null, 'SHELLDLL_DefView', null);
    if (defView) {
      shellViewParent = hwnd;
      return 0; // Stop enumeration
    }
    return 1;
  }, koffi.pointer(EnumWindowsCallback));

  EnumWindows(cb, 0);
  koffi.unregister(cb);

  if (!shellViewParent) {
    console.warn('[Win32] Could not find SHELLDLL_DefView parent');
    return null;
  }

  // Step 4: Find the NEXT WorkerW in z-order after shellViewParent
  // This is the empty WorkerW that sits behind the desktop icons
  const targetWorkerW = FindWindowExW(null, shellViewParent, 'WorkerW', null);

  if (targetWorkerW) {
    workerWHandle = targetWorkerW;
    console.log('[Win32] Found target WorkerW (behind desktop icons)');
    return targetWorkerW;
  }

  console.warn('[Win32] No WorkerW found behind SHELLDLL_DefView — will use fallback');
  return null;
}

// ── Attach / Detach ─────────────────────────────────────────────────

/**
 * Attach an Electron BrowserWindow behind the desktop icons.
 */
function attachWindow(browserWindow, options = {}) {
  const nativeHandle = browserWindow.getNativeWindowHandle();
  const childHwnd = bufferToHwnd(nativeHandle);

  // First, always hide from taskbar by adding WS_EX_TOOLWINDOW
  // and removing WS_EX_APPWINDOW
  const exStyle = Number(GetWindowLongPtrW(childHwnd, GWL_EXSTYLE));
  const newExStyle = (exStyle | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE) & ~WS_EX_APPWINDOW;
  SetWindowLongPtrW(childHwnd, GWL_EXSTYLE, newExStyle);

  // Try WorkerW technique
  const target = findWorkerW();

  if (target) {
    // WorkerW found — parent our window to it
    try {
      const style = Number(GetWindowLongPtrW(childHwnd, GWL_STYLE));
      const newStyle = (style & ~WS_POPUP) | WS_CHILD;
      SetWindowLongPtrW(childHwnd, GWL_STYLE, newStyle);

      SetParent(childHwnd, target);

      // After SetParent, coordinates are relative to WorkerW.
      // Explicitly reposition to ensure correct placement (critical for spanning).
      if (options.targetBounds) {
        const b = options.targetBounds;
        SetWindowPos(
          childHwnd, null,
          b.x, b.y, b.width, b.height,
          SWP_NOACTIVATE | SWP_SHOWWINDOW
        );
        console.log(`[Win32] Repositioned child to ${b.x},${b.y} ${b.width}x${b.height}`);
      }

      ShowWindow(childHwnd, SW_SHOWNOACTIVATE);

      usingFallback = false;
      console.log('[Win32] ✓ Attached via WorkerW (true wallpaper mode)');
      return true;
    } catch (err) {
      console.error('[Win32] WorkerW attach failed:', err.message);
      // Fall through to fallback
    }
  }

  // Fallback: keep as top-level window but push to HWND_BOTTOM
  console.log('[Win32] Using fallback: HWND_BOTTOM z-order mode');
  usingFallback = true;

  try {
    // Make sure it's not WS_CHILD (top-level window for z-order control)
    const style = Number(GetWindowLongPtrW(childHwnd, GWL_STYLE));
    const newStyle = (style & ~WS_CHILD) | WS_POPUP | WS_VISIBLE | WS_CLIPSIBLINGS;
    SetWindowLongPtrW(childHwnd, GWL_STYLE, newStyle);

    // Push to absolute bottom of z-order
    pushToBottom(childHwnd);

    // Set up a recurring timer to keep it at the bottom
    const timerId = setInterval(() => {
      try {
        pushToBottom(childHwnd);
      } catch {
        clearInterval(timerId);
        fallbackTimers.delete(childHwnd);
      }
    }, 500);
    fallbackTimers.set(childHwnd, timerId);

    ShowWindow(childHwnd, SW_SHOWNOACTIVATE);
    console.log('[Win32] ✓ Attached via fallback (bottom z-order)');
    return true;
  } catch (err) {
    console.error('[Win32] Fallback attach failed:', err.message);
    return false;
  }
}

/**
 * Push a window to the absolute bottom of the z-order.
 */
function pushToBottom(hwndValue) {
  SetWindowPos(
    hwndValue,
    HWND_BOTTOM,
    0, 0, 0, 0,
    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_NOSENDCHANGING
  );
}

/**
 * Detach a window from the desktop.
 */
function detachWindow(browserWindow) {
  try {
    if (browserWindow.isDestroyed()) return false;

    const nativeHandle = browserWindow.getNativeWindowHandle();
    const childHwnd = bufferToHwnd(nativeHandle);

    // Clear fallback timer
    const timerId = fallbackTimers.get(childHwnd);
    if (timerId) {
      clearInterval(timerId);
      fallbackTimers.delete(childHwnd);
    }

    // If was parented via WorkerW, restore to top-level
    const style = Number(GetWindowLongPtrW(childHwnd, GWL_STYLE));
    if (style & WS_CHILD) {
      const newStyle = (style & ~WS_CHILD) | WS_POPUP;
      SetWindowLongPtrW(childHwnd, GWL_STYLE, newStyle);
      SetParent(childHwnd, null);
    }

    // Restore ex style
    const exStyle = Number(GetWindowLongPtrW(childHwnd, GWL_EXSTYLE));
    const newExStyle = (exStyle & ~WS_EX_TOOLWINDOW & ~WS_EX_NOACTIVATE) | WS_EX_APPWINDOW;
    SetWindowLongPtrW(childHwnd, GWL_EXSTYLE, newExStyle);

    console.log('[Win32] Window detached');
    return true;
  } catch (err) {
    console.error('[Win32] Detach failed:', err.message);
    return false;
  }
}

/**
 * Clean up all state.
 */
function resetDesktop() {
  for (const [, timerId] of fallbackTimers) {
    clearInterval(timerId);
  }
  fallbackTimers.clear();
  workerWHandle = null;
  usingFallback = false;
  console.log('[Win32] Desktop reset');
}

/**
 * Check if we're using the fallback method.
 */
function isUsingFallback() {
  return usingFallback;
}

module.exports = {
  findWorkerW,
  attachWindow,
  detachWindow,
  resetDesktop,
  isUsingFallback,
};
