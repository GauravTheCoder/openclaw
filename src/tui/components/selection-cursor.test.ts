import { CURSOR_MARKER, type Component } from "@earendil-works/pi-tui";
import { describe, expect, it } from "vitest";
import { QuestionPrompt } from "./question-prompt.js";
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

  it("drops the ruled divider and the (n/m) counter used by the session picker", () => {
    const { wrapper } = list(["Filter: ", "──────", "→ one", "  two", "  (1/9)"]);
    wrapper.focused = true;
    expect(strip(wrapper.render(40))).toEqual(["Filter: ", "  one", "  two"]);
  });

  it("turns column padding into a comma so a row reads as one phrase", () => {
    const { wrapper } = list([
      "→ main                        just now · hi, this is a test",
      "  other   2d",
    ]);
    wrapper.focused = true;
    expect(strip(wrapper.render(80))).toEqual([
      "  main, just now · hi, this is a test",
      "  other, 2d",
    ]);
  });

  it("says a model once when its description only restates the id", () => {
    const { wrapper } = list([
      "→ opencode-go/deepseek-v4.1-flash          DeepSeek V4.1 Flash",
      "  opencode-go/glm-5.3          GLM 5.3 · unavailable",
    ]);
    wrapper.focused = true;
    expect(strip(wrapper.render(100))).toEqual([
      "  opencode-go/deepseek-v4.1-flash",
      "  opencode-go/glm-5.3, GLM 5.3 · unavailable",
    ]);
  });

  it("leaves prompt text with double spaces and a bare 3/4 line alone", () => {
    const { wrapper } = list(["Pick one:  fast  or  slow", "3/4", "→ yes", "  no"]);
    wrapper.focused = true;
    expect(strip(wrapper.render(80))).toEqual([
      "Pick one:  fast  or  slow",
      "3/4",
      "  yes",
      "  no",
    ]);
  });

  it("keeps a description that is not a restatement of the label", () => {
    const { wrapper } = list(["→ opencode-go/glm-5.3-air          GLM 5.3"]);
    wrapper.focused = true;
    expect(strip(wrapper.render(80))).toEqual(["  opencode-go/glm-5.3-air, GLM 5.3"]);
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

  it("follows the selected option of an ask_user question prompt", () => {
    const prompt = new QuestionPrompt(
      {
        id: "request-1",
        agentId: "main",
        sessionKey: "agent:main:main",
        createdAtMs: 1_000,
        expiresAtMs: Date.now() + 60_000,
        status: "pending",
        questions: [
          {
            questionId: "target",
            header: "Target",
            question: "→ Where should the sample run?",
            options: [{ label: "Staging" }, { label: "Production" }],
          },
        ],
      },
      { onSubmit() {}, onSkip() {}, onCollapse() {}, requestRender() {} },
    );
    const wrapper = new SelectionCursor(prompt);
    wrapper.focused = true;
    const first = wrapper.render(60);
    prompt.handleInput("\x1b[B");
    const second = wrapper.render(60);
    expect(first.find((line) => line.includes(CURSOR_MARKER))).toBe(`  ${CURSOR_MARKER}1. Staging`);
    expect(second.find((line) => line.includes(CURSOR_MARKER))).toBe(
      `  ${CURSOR_MARKER}2. Production`,
    );
    expect(strip(second)).toEqual(strip(first));
  });

  it("leaves output alone when unfocused or nothing is selected", () => {
    const unfocused = list(["→ a"]).wrapper;
    expect(unfocused.render(40)).toEqual(["→ a"]);
    const none = list([`Question? ${CURSOR_MARKER}`]).wrapper;
    none.focused = true;
    expect(none.render(40)).toEqual([`Question? ${CURSOR_MARKER}`]);
  });
});
