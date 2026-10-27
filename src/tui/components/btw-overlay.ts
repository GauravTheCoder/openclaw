import { Container, CURSOR_MARKER, matchesKey, Text, type Focusable } from "@earendil-works/pi-tui";
import { sanitizeRenderableLine, sanitizeRenderableText } from "../tui-formatters.js";

type BtwOverlayParams = { question: string; text: string; isError?: boolean };

/** Screen reader mode: a focused, modal BTW answer that closes with Esc/Enter and copies with c. */
export class BtwOverlay extends Container implements Focusable {
  focused = false;
  private readonly notice = new Text("", 0, 0);

  constructor(
    params: BtwOverlayParams,
    private readonly actions: { close: () => void; copy: (text: string) => Promise<boolean> },
  ) {
    super();
    this.answer = sanitizeRenderableText(params.text).trim() || "(no output)";
    this.addChild(new Text(`BTW: ${sanitizeRenderableLine(params.question)}`, 0, 0));
    this.addChild(new Text(`${params.isError ? "Error: " : ""}${this.answer}`, 0, 0));
    this.addChild(new Text("Esc or Enter: close. c: copy answer.", 0, 0));
    this.addChild(this.notice);
  }

  private readonly answer: string;

  override render(width: number): string[] {
    const lines = super.render(width);
    // Cursor on the first line so the reader starts at the question.
    return this.focused && lines[0] !== undefined
      ? [`${CURSOR_MARKER}${lines[0]}`, ...lines.slice(1)]
      : lines;
  }

  handleInput(data: string) {
    if (matchesKey(data, "escape") || matchesKey(data, "enter")) {
      this.actions.close();
    } else if (data === "c" || data === "C") {
      void this.actions.copy(this.answer).then((copied) => {
        this.notice.setText(copied ? "Copied." : "Copy failed.");
        this.invalidate();
      });
    }
  }
}
