import { CURSOR_MARKER, type Component } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import { SelectionCursor } from "./selection-cursor.js";

const list = (lines: string[]) => {
  const inner: Component & { focused: boolean } = {
    focused: false,
    render: () => lines,
    invalidate: () => undefined,
  };
  return { inner, wrapper: new SelectionCursor(inner) };
};

describe("SelectionCursor", () => {
  it("parks the cursor on the selected row only", () => {
    const { wrapper } = list([`search: ${CURSOR_MARKER}`, "  one", "→ two", "  three"]);
    wrapper.focused = true;
    expect(wrapper.render(40)).toEqual(["search: ", "  one", `→ ${CURSOR_MARKER}two`, "  three"]);
  });

  it("forwards focus to the wrapped component", () => {
    const { inner, wrapper } = list(["→ a"]);
    wrapper.focused = true;
    expect(inner.focused).toBe(true);
  });

  it("tracks focus itself when the wrapped list has no focused field", () => {
    const inner: Component = { render: () => ["  one", "→ two"], invalidate: () => undefined };
    const wrapper = new SelectionCursor(inner);
    wrapper.focused = true;
    expect(wrapper.render(40)).toEqual(["  one", `→ ${CURSOR_MARKER}two`]);
  });

  it("leaves output alone when unfocused or nothing is selected", () => {
    const unfocused = list(["→ a"]).wrapper;
    expect(unfocused.render(40)).toEqual(["→ a"]);
    const none = list([`Question? ${CURSOR_MARKER}`]).wrapper;
    none.focused = true;
    expect(none.render(40)).toEqual([`Question? ${CURSOR_MARKER}`]);
  });
});
