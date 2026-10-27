import type { OverlayHandle, TUI } from "@earendil-works/pi-tui";
import { copyToClipboard } from "../infra/clipboard.js";
import { BtwOverlay } from "./components/btw-overlay.js";

type BtwResult = { question: string; text: string; isError?: boolean };

/** Screen reader mode presents BTW results as one modal overlay instead of an inline card. */
export function createBtwPresenter(deps: {
  screenReader: boolean;
  chatLog: { showBtw: (params: BtwResult) => unknown; dismissBtw: () => void };
  tui: Pick<TUI, "requestRender">;
  openOverlay: TUI["showOverlay"];
  closeOverlay: (handle: OverlayHandle) => void;
  copy?: (text: string) => Promise<boolean>;
}) {
  if (!deps.screenReader) {
    return {
      showResult: (params: BtwResult) => void deps.chatLog.showBtw(params),
      clear: () => deps.chatLog.dismissBtw(),
    };
  }
  let handle: OverlayHandle | null = null;
  const clear = () => {
    if (handle) {
      deps.closeOverlay(handle);
      handle = null;
      deps.tui.requestRender();
    }
  };
  const showResult = (params: BtwResult) => {
    clear();
    const overlay = new BtwOverlay(params, { close: clear, copy: deps.copy ?? copyToClipboard });
    handle = deps.openOverlay(overlay, { width: "100%" });
  };
  return { showResult, clear };
}
