import { Container, CURSOR_MARKER, matchesKey, Text, type Focusable } from "@earendil-works/pi-tui";
import { sanitizeRenderableLine, sanitizeRenderableText } from "../tui-formatters.js";

type BtwOverlayParams = { question: string; text: string; isError?: boolean };

/** Screen reader mode: a focused, modal BTW answer that closes with Esc/Enter and copies with c. */
export class BtwOverlay extends Container implements Focusable {
  focused = false;
  private readonly notice = new Text("", 0, 0);
  private readonly answer: string;
  private noticeText = "";

  constructor(
    params: BtwOverlayParams,
    private readonly actions: {
      close: () => void;
      copy: (text: string) => Promise<boolean>;
      requestRender: () => void;
    },
  ) {
    super();
    this.answer = sanitizeRenderableText(params.text).trim() || "(no output)";
    const lead = params.isError ? "btw error" : "Your btw answer";
    this.addChild(new Text(`${lead}: ${this.answer}`, 0, 0));
    this.addChild(new Text(`Question: ${sanitizeRenderableLine(params.question)}`, 0, 0));
    this.addChild(new Text("Esc or Enter: close. c: copy answer.", 0, 0));
    this.addChild(this.notice);
  }

  override render(width: number): string[] {
    const lines = super.render(width);
    if (!this.focused) {
      return lines;
    }
    // A reader speaks the line under the cursor: the answer when it opens, the copy result
    // once there is one.
    const target = this.noticeText ? lines.length - this.notice.render(width).length : 0;
    return lines.map((line, index) => (index === target ? `${CURSOR_MARKER}${line}` : line));
  }

  handleInput(data: string) {
    if (matchesKey(data, "escape") || matchesKey(data, "enter")) {
      this.actions.close();
    } else if (data === "c" || data === "C") {
      void this.actions.copy(this.answer).then((copied) => {
        this.noticeText = copied ? "Copied to clipboard." : "Copy failed.";
        this.notice.setText(this.noticeText);
        this.invalidate();
        this.actions.requestRender();
      });
    }
  }
}
