import { expect, it } from "vitest";
import {
  objectFieldEquals,
  startTuiFixture,
  waitForSynchronizedFrameRows,
} from "./tui-pty-harness-fixture-test-support.js";

// Terminal bells that are not OSC/APC terminators.
function countBells(output: string) {
  const OSC_OR_APC = new RegExp("\\u001b[\\]_][^\\u0007\\u001b]*(?:\\u0007|\\u001b\\\\)", "gu");
  return output.replace(OSC_OR_APC, "").split("\x07").length - 1;
}

it(
  "rings once and keeps chat output plain when a screen reader run finishes",
  {
    timeout: 40_000,
  },
  async ({ signal }) => {
    const message = "screen reader probe";
    const fixture = await startTuiFixture({ screenReader: true });
    try {
      await fixture.run.waitForOutput("local ready", 20_000);
      expect(countBells(fixture.run.output())).toBe(0);
      await fixture.run.write(`${message}\r`, { delay: false });
      await fixture.waitForLogEntry(
        (entry) => entry.method === "sendChat" && objectFieldEquals(entry, "message", message),
        signal,
      );
      await fixture.run.waitForOutput("PTY_RESPONSE:", 20_000);
      const rows = await waitForSynchronizedFrameRows(
        fixture.run,
        (frame) => frame.some((row) => row.includes("Done in")),
        20_000,
      );
      const text = rows.join("\n");
      expect(text).toContain("You: " + message);
      expect(text).toContain("Assistant: ");
      expect(rows.some((row) => row.startsWith("$"))).toBe(true);
      expect(countBells(fixture.run.output())).toBe(1);
      await fixture.run.write("/exit\r", { delay: false });
      expect((await fixture.run.waitForExit()).exitCode).toBe(0);
    } finally {
      await fixture.cleanup();
    }
  },
);
