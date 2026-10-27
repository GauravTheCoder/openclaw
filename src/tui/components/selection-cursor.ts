import { CURSOR_MARKER, type Component, type Focusable } from "@earendil-works/pi-tui";

const SELECTED_ROW = /^(\s*)→ /u;
// Position counters ("1/9", "(1/9)") and ruled dividers are decoration that a reader would
// announce again on every repaint.
const DECORATION_ROW = /^\s*(?:\(?\d+\/\d+\)?|─+)\s*$/u;

/** Screen reader mode: parks the real cursor on the selected row so readers follow selection. */
export class SelectionCursor implements Component, Focusable {
  handleMouse: Component["handleMouse"];

  constructor(private readonly inner: Component) {
    this.handleMouse = inner.handleMouse?.bind(inner);
  }

  // Kept here: pi-tui lists such as SettingsList have no focused field of their own.
  private isFocused = false;

  get focused() {
    return this.isFocused;
  }

  set focused(value: boolean) {
    this.isFocused = value;
    if ("focused" in this.inner) {
      this.inner.focused = value;
    }
  }

  get wantsKeyRelease() {
    return this.inner.wantsKeyRelease;
  }

  render(width: number): string[] {
    const lines = this.inner.render(width);
    const selected = this.focused ? lines.findIndex((line) => SELECTED_ROW.test(line)) : -1;
    if (selected < 0) {
      return lines;
    }
    // Rows stay byte-identical while you arrow: the "→" cue is blanked everywhere and only the
    // zero-width cursor marker moves, so a reader announces the selected row once instead of
    // every repainted row. The inner component's own marker (search box) would compete for it.
    return lines
      .map((line, index) => {
        const row = line.split(CURSOR_MARKER).join("").replace(SELECTED_ROW, "$1  ");
        return index === selected ? row.replace(/^(\s*)/u, `$1${CURSOR_MARKER}`) : row;
      })
      .filter((line) => !DECORATION_ROW.test(line));
  }

  handleInput(data: string) {
    this.inner.handleInput?.(data);
  }

  invalidate() {
    this.inner.invalidate();
  }
}
