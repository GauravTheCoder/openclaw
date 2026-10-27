import { CURSOR_MARKER, type Component } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import { SelectionCursor } from "./selection-cursor.js";

const list = (lines: string[]) => {
  const inner: Component & { focused: boolean; lines: string[] } = {
    focused: false,
    lines,
    render() {
      return this.lines;
    },
    invalidate: () => undefined,
  };
  return { inner, wrapper: new SelectionCursor(inner) };
};

const strip = (lines: string[]) => lines.map((line) => line.split(CURSOR_MARKER).join(""));

describe("SelectionCursor", () => {
  it("parks the cursor on the selected row only and blanks the arrow cue", () => {
    const { wrapper } = list([`search: ${CURSOR_MARKER}`, "  one", "→ two", "  three"]);
    wrapper.focused = true;
    expect(wrapper.render(40)).toEqual(["search: ", "  one", `  ${CURSOR_MARKER}two`, "  three"]);
  });

  it("changes only the cursor, not the row text, when the selection moves", () => {
    const { inner, wrapper } = list(["→ one", "  two", "  1/2"]);
    wrapper.focused = true;
    const first = wrapper.render(40);
    inner.lines = ["  one", "→ two", "  2/2"];
    const second = wrapper.render(40);
    expect(strip(second)).toEqual(strip(first));
    expect(first[0]).toContain(CURSOR_MARKER);
    expect(second[1]).toContain(CURSOR_MARKER);
  });

  it("drops the n/m position row", () => {
    const { wrapper } = list(["→ one", "  two", "  1/2"]);
    wrapper.focused = true;
    expect(strip(wrapper.render(40))).toEqual(["  one", "  two"]);
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
    expect(wrapper.render(40)).toEqual(["  one", `  ${CURSOR_MARKER}two`]);
  });

  it("leaves output alone when unfocused or nothing is selected", () => {
    const unfocused = list(["→ a"]).wrapper;
    expect(unfocused.render(40)).toEqual(["→ a"]);
    const none = list([`Question? ${CURSOR_MARKER}`]).wrapper;
    none.focused = true;
    expect(none.render(40)).toEqual([`Question? ${CURSOR_MARKER}`]);
  });
});
