import type { OverlayHandle } from "@earendil-works/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { createBtwPresenter } from "./tui-btw-overlay.js";

const setup = () => {
  const handles: OverlayHandle[] = [];
  const openOverlay = vi.fn(() => {
    const handle = { hide: vi.fn() } as unknown as OverlayHandle;
    handles.push(handle);
    return handle;
  });
  const closeOverlay = vi.fn();
  const chatLog = { showBtw: vi.fn(), dismissBtw: vi.fn(), addSystem: vi.fn() };
  const presenter = createBtwPresenter({
    screenReader: true,
    chatLog,
    tui: { requestRender: vi.fn() },
    openOverlay,
    closeOverlay,
  });
  return { presenter, openOverlay, closeOverlay, handles, chatLog };
};

describe("createBtwPresenter", () => {
  it("opens one overlay per result and closes the previous one", () => {
    const { presenter, openOverlay, closeOverlay, handles } = setup();
    presenter.showResult({ question: "a", text: "one" });
    presenter.showResult({ question: "b", text: "two" });
    expect(openOverlay).toHaveBeenCalledTimes(2);
    expect(closeOverlay).toHaveBeenCalledExactlyOnceWith(handles[0]);
  });

  it("clear closes the open overlay and is a no-op when none is open", () => {
    const { presenter, closeOverlay } = setup();
    presenter.clear();
    expect(closeOverlay).not.toHaveBeenCalled();
    presenter.showResult({ question: "a", text: "one" });
    presenter.clear();
    presenter.clear();
    expect(closeOverlay).toHaveBeenCalledTimes(1);
  });

  it("keeps the inline card outside screen reader mode", () => {
    const chatLog = { showBtw: vi.fn(), dismissBtw: vi.fn(), addSystem: vi.fn() };
    const openOverlay = vi.fn();
    const presenter = createBtwPresenter({
      screenReader: false,
      chatLog,
      tui: { requestRender: vi.fn() },
      openOverlay,
      closeOverlay: vi.fn(),
    });
    presenter.showResult({ question: "a", text: "one" });
    presenter.clear();
    expect(chatLog.showBtw).toHaveBeenCalledWith({ question: "a", text: "one" });
    expect(chatLog.dismissBtw).toHaveBeenCalledTimes(1);
    expect(openOverlay).not.toHaveBeenCalled();
  });

  describe("feedback while waiting", () => {
    it("announces the send once, stays quiet when the answer arrives, and ends silently after", async () => {
      const { presenter, chatLog } = setup();
      presenter.noteRunId("r1");
      presenter.noteRunId("r2");
      expect(chatLog.addSystem).toHaveBeenCalledExactlyOnceWith("Asking side question");
      presenter.showResult({ question: "a", text: "one" });
      presenter.forgetRunId("r1");
      presenter.forgetRunId("r2");
      await Promise.resolve();
      expect(chatLog.addSystem).toHaveBeenCalledTimes(1);
    });

    it("says so when the run ends without an answer, but not during an id swap", async () => {
      const { presenter, chatLog } = setup();
      presenter.noteRunId("provisional");
      presenter.forgetRunId("provisional");
      presenter.noteRunId("accepted");
      await Promise.resolve();
      expect(chatLog.addSystem).toHaveBeenCalledTimes(1);
      presenter.forgetRunId("accepted");
      await Promise.resolve();
      expect(chatLog.addSystem).toHaveBeenLastCalledWith("btw ended without an answer.");
    });

    it("reports a failure when no answer arrives in time", () => {
      vi.useFakeTimers();
      try {
        const { presenter, chatLog } = setup();
        presenter.noteRunId("r1");
        vi.advanceTimersByTime(60_000);
        expect(chatLog.addSystem).toHaveBeenLastCalledWith(
          "btw failed: no answer received. Check the model, then try again.",
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
