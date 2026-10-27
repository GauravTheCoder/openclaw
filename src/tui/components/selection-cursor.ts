import { CURSOR_MARKER, type Component, type Focusable } from "@earendil-works/pi-tui";

const SELECTED_ROW = /^(\s*→ )/u;

/** Screen reader mode: parks the real cursor on the selected row so readers follow selection. */
export class SelectionCursor implements Component, Focusable {
  handleMouse: Component["handleMouse"];

  constructor(private readonly inner: Component) {
    this.handleMouse = inner.handleMouse?.bind(inner);
  }

  get focused() {
    return "focused" in this.inner && this.inner.focused === true;
  }

  set focused(value: boolean) {
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
    // The inner component's own marker (search box) would compete for the single cursor.
    return lines.map((line, index) =>
      index === selected
        ? line.replace(SELECTED_ROW, `$1${CURSOR_MARKER}`)
        : line.split(CURSOR_MARKER).join(""),
    );
  }

  handleInput(data: string) {
    this.inner.handleInput?.(data);
  }

  invalidate() {
    this.inner.invalidate();
  }
}
