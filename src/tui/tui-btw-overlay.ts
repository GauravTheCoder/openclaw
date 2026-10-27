import type { OverlayHandle, TUI } from "@earendil-works/pi-tui";
import { copyToClipboard } from "../infra/clipboard.js";
import { BtwOverlay } from "./components/btw-overlay.js";
import { createTuiRunIdTracker } from "./tui-session-run-coordinator.js";

type BtwResult = { question: string; text: string; isError?: boolean };

// Past this a reader hears nothing, so the wait is announced as a failure.
const BTW_ANSWER_TIMEOUT_MS = 60_000;

/**
 * Screen reader mode presents BTW results as one modal overlay instead of an inline card, and
 * announces when a side question is sent and when it ends without an answer.
 */
export function createBtwPresenter(deps: {
  screenReader: boolean;
  chatLog: {
    showBtw: (params: BtwResult) => unknown;
    dismissBtw: () => void;
    addSystem: (text: string) => void;
  };
  tui: Pick<TUI, "requestRender">;
  openOverlay: TUI["showOverlay"];
  closeOverlay: (handle: OverlayHandle) => void;
  copy?: (text: string) => Promise<boolean>;
  timeoutMs?: number;
}) {
  const runIds = createTuiRunIdTracker();
  const tracking = { isRunId: runIds.has, clearRunIds: runIds.clear };
  if (!deps.screenReader) {
    return {
      showResult: (params: BtwResult) => void deps.chatLog.showBtw(params),
      clear: () => deps.chatLog.dismissBtw(),
      ...tracking,
      noteRunId: runIds.note,
      forgetRunId: runIds.forget,
    };
  }
  let handle: OverlayHandle | null = null;
  let waiting: ReturnType<typeof setTimeout> | null = null;
  const liveRunIds = new Set<string>();
  const stopWaiting = () => {
    clearTimeout(waiting ?? undefined);
    waiting = null;
  };
  const clear = () => {
    if (handle) {
      deps.closeOverlay(handle);
      handle = null;
      deps.tui.requestRender();
    }
  };
  const showResult = (params: BtwResult) => {
    stopWaiting();
    clear();
    const overlay = new BtwOverlay(params, {
      close: clear,
      copy: deps.copy ?? copyToClipboard,
      requestRender: () => deps.tui.requestRender(),
    });
    handle = deps.openOverlay(overlay, { width: "100%" });
  };
  // The tracker sees each run id once or twice (provisional and accepted); announce once.
  const noteRunId = (runId: string) => {
    runIds.note(runId);
    liveRunIds.add(runId);
    if (waiting) {
      return;
    }
    deps.chatLog.addSystem("Asking side question");
    waiting = setTimeout(() => {
      waiting = null;
      deps.chatLog.addSystem("btw failed: no answer received. Check the model, then try again.");
      deps.tui.requestRender();
    }, deps.timeoutMs ?? BTW_ANSWER_TIMEOUT_MS);
    waiting.unref?.();
  };
  const forgetRunId = (runId: string) => {
    runIds.forget(runId);
    liveRunIds.delete(runId);
    // A run that ends before any answer was shown would otherwise stay silent. The check waits
    // a tick because a provisional id is forgotten just before the accepted one is noted.
    queueMicrotask(() => {
      if (waiting && liveRunIds.size === 0) {
        stopWaiting();
        deps.chatLog.addSystem("btw ended without an answer.");
        deps.tui.requestRender();
      }
    });
  };
  return { showResult, clear, noteRunId, forgetRunId, ...tracking };
}
