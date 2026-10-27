import { CURSOR_MARKER } from "@earendil-works/pi-tui";
import { describe, expect, it, vi } from "vitest";
import { normalizeTestText } from "../../../test/helpers/normalize-text.js";
import { BtwOverlay } from "./btw-overlay.js";

const make = (copy = vi.fn(async () => true)) => {
  const close = vi.fn();
  const overlay = new BtwOverlay({ question: "2+2?", text: "It is 4." }, { close, copy });
  return { overlay, close, copy };
};
const text = (overlay: BtwOverlay) =>
  overlay.render(60).map((l) => normalizeTestText(l.split(CURSOR_MARKER).join("")).trim());

describe("BtwOverlay", () => {
  it("shows the question, answer and key hints, with the cursor on the first line when focused", () => {
    const { overlay } = make();
    overlay.focused = true;
    expect(overlay.render(60)[0]).toContain(CURSOR_MARKER);
    expect(text(overlay).filter(Boolean)).toEqual([
      "BTW: 2+2?",
      "It is 4.",
      "Esc or Enter: close. c: copy answer.",
    ]);
  });

  it("closes on Esc and Enter", () => {
    const { overlay, close } = make();
    overlay.handleInput("\x1b");
    overlay.handleInput("\r");
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("copies the answer on c and reports the outcome once", async () => {
    const { overlay, copy } = make();
    overlay.handleInput("c");
    await vi.waitFor(() => expect(text(overlay)).toContain("Copied."));
    expect(copy).toHaveBeenCalledExactlyOnceWith("It is 4.");
  });

  it("reports a failed copy", async () => {
    const { overlay } = make(vi.fn(async () => false));
    overlay.handleInput("c");
    await vi.waitFor(() => expect(text(overlay)).toContain("Copy failed."));
  });
});
