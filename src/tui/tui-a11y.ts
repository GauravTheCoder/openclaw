import type { OpenClawConfig } from "../config/config.js";
import { isTruthyEnvValue } from "../infra/env.js";

export type TuiA11y = { screenReader: boolean };

// The flag and env can only turn the mode on; a falsy env value defers to config.
export function resolveTuiA11y(params: {
  flag?: boolean;
  env?: string;
  config?: OpenClawConfig;
}): TuiA11y {
  return {
    screenReader:
      params.flag === true ||
      isTruthyEnvValue(params.env) ||
      params.config?.ui?.tui?.screenReader === true,
  };
}
