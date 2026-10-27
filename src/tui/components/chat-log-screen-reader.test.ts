import { describe, expect, it } from "vitest";
import { normalizeTestText } from "../../../test/helpers/normalize-text.js";
import { ChatLog } from "./chat-log.js";

const lines = (log: ChatLog) =>
  log
    .render(80)
    .map((line) => normalizeTestText(line).trim())
    .filter(Boolean);

describe("ChatLog screen reader mode", () => {
  it("labels messages and drops decoration", () => {
    const log = new ChatLog(50, undefined, true);
    log.addSystem("connected");
    log.addUser("hi");
    log.finalizeAssistant("hello", "r1");
    expect(lines(log)).toEqual(["System: connected", "You: hi", "Assistant: hello"]);
    expect(log.render(80).join("\n")).not.toContain("\x1b[");
  });

  it("streams append-only: earlier lines never change and the partial line waits", () => {
    const log = new ChatLog(50, undefined, true);
    log.updateAssistant("one", "r1");
    expect(lines(log)).toEqual([]);
    log.updateAssistant("one\ntwo", "r1");
    const first = lines(log);
    expect(first).toEqual(["Assistant: one"]);
    log.updateAssistant("one\ntwo\nthree", "r1");
    const second = lines(log);
    expect(second.slice(0, first.length)).toEqual(first);
    log.finalizeAssistant("one\ntwo\nthree", "r1");
    const done = lines(log);
    expect(done.slice(0, second.length)).toEqual(second);
    expect(done.join("\n")).toContain("three");
  });

  it("flushes the partial line when a tool starts", () => {
    const log = new ChatLog(50, undefined, true);
    log.updateAssistant("partial", "r1");
    log.startTool("t1", "read_file", { path: "a" }, "r1");
    expect(lines(log).join("\n")).toContain("Assistant: partial");
  });

  it("keeps the default rendering unlabeled", () => {
    const log = new ChatLog(50);
    log.addUser("hi");
    expect(lines(log).join("\n")).not.toContain("You:");
  });
});

describe("tool cards in screen reader mode", () => {
  const start = (log: ChatLog) => log.startTool("t1", "read_file", { path: "a.txt" }, "r1");
  const text = (log: ChatLog) => lines(log).join("\n");

  it("carries state as text prefixes with no background or padding rows", () => {
    const log = new ChatLog(50, undefined, true);
    start(log);
    expect(text(log)).toContain("[running]");
    expect(log.render(80)[0]).toMatch(/^Tool /);
    log.updateToolResult("t1", { content: [{ type: "text", text: "done" }] });
    expect(text(log)).toContain("[ok]");
    expect(text(log)).not.toContain("[running]");
  });

  it("marks failures", () => {
    const log = new ChatLog(50, undefined, true);
    start(log);
    log.updateToolResult("t1", { content: [{ type: "text", text: "boom" }] }, { isError: true });
    expect(text(log)).toContain("[failed]");
  });

  it("keeps the default title format outside screen reader mode", () => {
    const log = new ChatLog(50);
    start(log);
    expect(text(log)).toContain("(running)");
    expect(text(log)).not.toContain("[running]");
  });
});
