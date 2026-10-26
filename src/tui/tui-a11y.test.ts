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

  it("enables from the flag even when env and config are off", () => {
    expect(resolveTuiA11y({ flag: true, env: "0", config: configOff })).toEqual({
      screenReader: true,
    });
  });

  it.each(["1", "true", "TRUE", "yes", "on"])("enables from env %s", (env) => {
    expect(resolveTuiA11y({ env, config: configOff })).toEqual({ screenReader: true });
  });

  it.each(["0", "false", "no", "off", "", "maybe"])("defers to config for env %j", (env) => {
    expect(resolveTuiA11y({ env, config: configOn })).toEqual({ screenReader: true });
    expect(resolveTuiA11y({ env, config: configOff })).toEqual({ screenReader: false });
  });

  it("enables from config alone", () => {
    expect(resolveTuiA11y({ config: configOn })).toEqual({ screenReader: true });
  });
});
