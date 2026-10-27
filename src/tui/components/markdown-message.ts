import { Container, Spacer, Text } from "@earendil-works/pi-tui";
import { markdownTheme, tuiTheme as theme } from "../theme/theme.js";
import { sanitizeTerminalControlsAndBinary } from "../tui-formatters.js";
import type { TuiImageSource } from "../tui-images.js";
import { HyperlinkMarkdown } from "./hyperlink-markdown.js";
import { MessageImages, type TuiImageRenderer } from "./message-images.js";

const PLAIN_LABELS = { user: "You:", assistant: "Assistant:" } as const;
// A line break, or a sentence end followed by more text; "1." and "e.g." are not sentence ends.
const SENTENCE_END = /(?<!\b\d+|\b\p{L})[.!?](?=[ \t]+\S)|\n/gu;

/**
 * Screen reader rendering: unstyled labeled text. While streaming, only completed lines and
 * sentences show, so a reader hears whole sentences; finish() reveals the trailing partial one.
 */
export type PlainMessageOptions = { streaming: boolean };

export class MarkdownMessageComponent extends Container {
  private body: HyperlinkMarkdown | Text;
  private images: MessageImages;
  private raw = "";
  private streaming = false;

  constructor(
    readonly role: "user" | "assistant",
    text: string,
    imageRenderer?: TuiImageRenderer,
    private readonly plain?: PlainMessageOptions,
  ) {
    super();
    if (plain) {
      this.streaming = plain.streaming;
      this.body = new Text("", 0, 0);
      this.addChild(this.body);
      this.images = new MessageImages(imageRenderer);
      this.addChild(this.images);
      this.setText(text);
      return;
    }
    const user = role === "user";
    this.body = new HyperlinkMarkdown(
      text,
      0,
      user ? 1 : 0,
      markdownTheme,
      user
        ? { bgColor: (line) => theme.userBg(line), color: (line) => theme.userText(line) }
        : { color: (line) => theme.assistantText(line) },
      user ? { preserveOrderedListMarkers: true, preserveBackslashEscapes: true } : undefined,
    );
    this.addChild(new Spacer(1));
    this.addChild(this.body);
    this.images = new MessageImages(imageRenderer);
    this.addChild(this.images);
  }

  setText(text: string) {
    if (!this.plain) {
      this.body.setText(text);
      return;
    }
    this.raw = sanitizeTerminalControlsAndBinary(text);
    this.renderPlain();
  }

  finish() {
    if (!this.plain) {
      return;
    }
    this.streaming = false;
    this.renderPlain();
  }

  private renderPlain() {
    // The text itself is never rewritten: code and quoted strings must read as sent.
    const end = this.streaming
      ? Math.max(0, ...Array.from(this.raw.matchAll(SENTENCE_END), (match) => match.index + 1))
      : this.raw.length;
    const visible = this.raw.slice(0, end);
    const trimmed = visible.trim();
    this.body.setText(trimmed ? `${PLAIN_LABELS[this.role]} ${trimmed}` : "");
  }

  setImages(images: readonly TuiImageSource[]) {
    this.images.setImages(images);
  }

  dispose() {
    this.images.dispose();
  }
}
