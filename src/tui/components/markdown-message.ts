import { Container, Spacer, Text } from "@earendil-works/pi-tui";
import { markdownTheme, tuiTheme as theme } from "../theme/theme.js";
import type { TuiImageSource } from "../tui-images.js";
import { HyperlinkMarkdown } from "./hyperlink-markdown.js";
import { MessageImages, type TuiImageRenderer } from "./message-images.js";

const PLAIN_LABELS = { user: "You:", assistant: "Assistant:" } as const;

/**
 * Screen reader rendering: unstyled labeled text. While streaming, only completed lines show,
 * so earlier rows are never repainted; finish() reveals the trailing partial line.
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
      (this.body as HyperlinkMarkdown).setText(text);
      return;
    }
    this.raw = text;
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
    // Sentence ends become line breaks (streaming and final alike) so a long paragraph surfaces
    // sentence by sentence while earlier rows stay unchanged.
    const text = this.raw.replace(/([.!?])[ \t]+(?=\S)/gu, "$1\n");
    const visible = this.streaming ? text.slice(0, text.lastIndexOf("\n") + 1) : text;
    const trimmed = visible.trim();
    (this.body as Text).setText(trimmed ? `${PLAIN_LABELS[this.role]} ${trimmed}` : "");
  }

  setImages(images: readonly TuiImageSource[]) {
    this.images.setImages(images);
  }

  dispose() {
    this.images.dispose();
  }
}
