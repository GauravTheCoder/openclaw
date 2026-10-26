import type { OpenClawConfig } from "../config/config.js";

export type TuiA11y = { screenReader: boolean };

// The flag can only turn the mode on; otherwise the config key decides.
export function resolveTuiA11y(params: { flag?: boolean; config?: OpenClawConfig }): TuiA11y {
  return { screenReader: params.flag === true || params.config?.ui?.tui?.screenReader === true };
}
