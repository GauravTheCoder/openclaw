import { CURSOR_MARKER } from "@earendil-works/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { normalizeTestText } from "../../../test/helpers/normalize-text.js";
import { BtwOverlay } from "./btw-overlay.js";

const make = (copy = vi.fn(async () => true), isError = false) => {
  const close = vi.fn();
  const requestRender = vi.fn();
  const overlay = new BtwOverlay(
    { question: "2+2?", text: "It is 4.", isError },
    { close, copy, requestRender },
  );
  overlay.focused = true;
  return { overlay, close, copy, requestRender };
};
const strip = (line: string) => normalizeTestText(line.split(CURSOR_MARKER).join("")).trim();
const text = (overlay: BtwOverlay) => overlay.render(60).map(strip);
const cursorRow = (overlay: BtwOverlay) =>
  strip(overlay.render(60).find((line) => line.includes(CURSOR_MARKER)) ?? "");

describe("BtwOverlay", () => {
  it("leads with 'Your btw answer:' and puts the cursor on it when opened", () => {
    const { overlay } = make();
    expect(cursorRow(overlay)).toBe("Your btw answer: It is 4.");
    expect(text(overlay).filter(Boolean)).toEqual([
      "Your btw answer: It is 4.",
      "Question: 2+2?",
      "Esc or Enter: close. c: copy answer.",
    ]);
  });

  it("labels an error answer", () => {
    const { overlay } = make(undefined, true);
    expect(cursorRow(overlay)).toBe("btw error: It is 4.");
  });

  it("closes on Esc and Enter", () => {
    const { overlay, close } = make();
    overlay.handleInput("\x1b");
    overlay.handleInput("\r");
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("copies on c, repaints, and moves the cursor to 'Copied to clipboard.'", async () => {
    const { overlay, copy, requestRender } = make();
    overlay.handleInput("c");
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalledTimes(1));
    expect(copy).toHaveBeenCalledExactlyOnceWith("It is 4.");
    expect(cursorRow(overlay)).toBe("Copied to clipboard.");
  });

  it("reports a failed copy at the cursor", async () => {
    const { overlay, requestRender } = make(vi.fn(async () => false));
    overlay.handleInput("c");
    await vi.waitFor(() => expect(requestRender).toHaveBeenCalled());
    expect(cursorRow(overlay)).toBe("Copy failed.");
  });
});
