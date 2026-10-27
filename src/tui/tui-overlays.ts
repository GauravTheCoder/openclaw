import type { Component, OverlayHandle, TUI } from "@earendil-works/pi-tui";
import { SelectionCursor } from "./components/selection-cursor.js";

type OverlayHost = Pick<TUI, "showOverlay" | "hasOverlay" | "setFocus" | "setShowHardwareCursor">;

/**
 * Creates open/close handlers that restore focus when no overlay is active.
 * `screenReaderBell` doubles as the screen reader switch: it rings on open, shows the real
 * cursor, and makes overlays park that cursor on the selected row.
 */
export function createOverlayHandlers(
  host: OverlayHost,
  fallbackFocus: Component,
  screenReaderBell?: () => void,
) {
  if (screenReaderBell) {
    host.setShowHardwareCursor(true);
  }
  const closeOverlay = (handle: OverlayHandle) => {
    handle.hide();
    if (!host.hasOverlay()) {
      host.setFocus(fallbackFocus);
    }
  };

  const openOverlay: OverlayHost["showOverlay"] = (component, options) => {
    if (!screenReaderBell) {
      return host.showOverlay(component, options);
    }
    screenReaderBell();
    return host.showOverlay(new SelectionCursor(component), options);
  };
  return { openOverlay, closeOverlay };
}
