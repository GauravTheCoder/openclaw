import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { describeA11yStatusChange as change, resolveTuiA11y } from "./tui-a11y.js";

const configOn = { ui: { tui: { screenReader: true } } } as OpenClawConfig;
const configOff = { ui: { tui: { screenReader: false } } } as OpenClawConfig;

describe("resolveTuiA11y", () => {
  it("defaults to off", () => {
    expect(resolveTuiA11y({})).toEqual({ screenReader: false });
    expect(resolveTuiA11y({ config: {} as OpenClawConfig })).toEqual({ screenReader: false });
  });

  it("enables from the flag even when config is off", () => {
    expect(resolveTuiA11y({ flag: true, config: configOff })).toEqual({ screenReader: true });
  });

  it("enables from config alone", () => {
    expect(resolveTuiA11y({ config: configOn })).toEqual({ screenReader: true });
  });

  it("stays off when the flag is false and config is off", () => {
    expect(resolveTuiA11y({ flag: false, config: configOff })).toEqual({ screenReader: false });
  });
});

describe("describeA11yStatusChange", () => {
  it("ignores repeated statuses", () => {
    expect(change({ previous: "streaming", next: "streaming", wasBusy: true, isBusy: true })).toBe(
      null,
    );
  });

  it("announces run start without a bell", () => {
    expect(change({ previous: "idle", next: "waiting", wasBusy: false, isBusy: true })).toEqual({
      line: "Working",
      bell: false,
    });
  });

  it("announces busy-to-busy transitions without a bell", () => {
    expect(change({ previous: "waiting", next: "streaming", wasBusy: true, isBusy: true })).toEqual(
      { line: "Status: streaming", bell: false },
    );
  });

  it("rings once when a run finishes", () => {
    expect(
      change({ previous: "streaming", next: "idle", wasBusy: true, isBusy: false, elapsed: "12s" }),
    ).toEqual({ line: "Done in 12s", bell: true });
  });

  it("stays silent when idle follows a non-busy status", () => {
    expect(change({ previous: "aborted", next: "idle", wasBusy: false, isBusy: false })).toBe(null);
  });

  it("rings on error and abort failure, not on user abort", () => {
    expect(change({ previous: "running", next: "error", wasBusy: true, isBusy: false })?.bell).toBe(
      true,
    );
    expect(
      change({ previous: "running", next: "abort failed", wasBusy: true, isBusy: false })?.bell,
    ).toBe(true);
    expect(
      change({ previous: "running", next: "aborted", wasBusy: true, isBusy: false })?.bell,
    ).toBe(false);
  });
});

describe("applyTuiA11yTheme", () => {
  it("strips styling only when screen reader mode is on", async () => {
    const { default: chalk } = await import("chalk");
    const { applyTuiA11yTheme } = await import("./tui-a11y.js");
    const saved = chalk.level;
    try {
      chalk.level = 3;
      applyTuiA11yTheme({ screenReader: false });
      expect(chalk.bold("x")).not.toBe("x");
      applyTuiA11yTheme({ screenReader: true });
      expect(chalk.bold("x")).toBe("x");
      expect(chalk.bgHex("#ffffff")("x")).toBe("x");
    } finally {
      chalk.level = saved;
    }
  });
});
