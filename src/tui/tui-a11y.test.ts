import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import { resolveTuiA11y } from "./tui-a11y.js";

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
