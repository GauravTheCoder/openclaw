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
  const presenter = createBtwPresenter({
    screenReader: true,
    chatLog: { showBtw: vi.fn(), dismissBtw: vi.fn() },
    tui: { requestRender: vi.fn() },
    openOverlay,
    closeOverlay,
  });
  return { presenter, openOverlay, closeOverlay, handles };
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
    const chatLog = { showBtw: vi.fn(), dismissBtw: vi.fn() };
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
});
