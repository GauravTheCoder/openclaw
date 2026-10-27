import type { Component, OverlayHandle, TUI } from "@earendil-works/pi-tui";

type OverlayHost = Pick<TUI, "showOverlay" | "hasOverlay" | "setFocus">;

/** Creates open/close handlers that restore focus when no overlay is active. */
export function createOverlayHandlers(
  host: OverlayHost,
  fallbackFocus: Component,
  onOpen?: () => void,
) {
  const closeOverlay = (handle: OverlayHandle) => {
    handle.hide();
    if (!host.hasOverlay()) {
      host.setFocus(fallbackFocus);
    }
  };

  const openOverlay: OverlayHost["showOverlay"] = (...args) => {
    onOpen?.();
    return host.showOverlay(...args);
  };
  return { openOverlay, closeOverlay };
}
