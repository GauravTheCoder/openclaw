import chalk from "chalk";
import type { OpenClawConfig } from "../config/config.js";
import { isTuiBusyActivityStatus } from "./tui-activity-status.js";
import { formatElapsed } from "./tui-status-line.js";

export type TuiA11y = { screenReader: boolean };

// The flag can only turn the mode on; otherwise the config key decides.
export function resolveTuiA11y(params: { flag?: boolean; config?: OpenClawConfig }): TuiA11y {
  return { screenReader: params.flag === true || params.config?.ui?.tui?.screenReader === true };
}

export const TUI_BELL = "\x07";

// Screen reader mode: one line and at most one bell per status change, nothing per tick.
export function describeA11yStatusChange(params: {
  previous: string;
  next: string;
  wasBusy: boolean;
  isBusy: boolean;
  elapsed?: string;
}): { line: string; bell: boolean } | null {
  const { previous, next, wasBusy, isBusy, elapsed } = params;
  if (previous === next) {
    return null;
  }
  if (isBusy) {
    return { line: wasBusy ? `Status: ${next}` : "Working", bell: false };
  }
  if (next === "idle") {
    return wasBusy ? { line: `Done${elapsed ? ` in ${elapsed}` : ""}`, bell: true } : null;
  }
  return { line: `Status: ${next}`, bell: next === "error" || next === "abort failed" };
}

export function createA11yStatusReporter(deps: {
  addLine: (text: string) => void;
  bell: () => void;
}) {
  let previous = "idle";
  let startedAt: number | null = null;
  return {
    update(next: string) {
      const wasBusy = isTuiBusyActivityStatus(previous);
      const isBusy = isTuiBusyActivityStatus(next);
      const change = describeA11yStatusChange({
        previous,
        next,
        wasBusy,
        isBusy,
        elapsed: startedAt ? formatElapsed(startedAt) : undefined,
      });
      if (isBusy && !wasBusy) {
        startedAt = Date.now();
      } else if (!isBusy) {
        startedAt = null;
      }
      previous = next;
      if (change) {
        deps.addLine(change.line);
        if (change.bell) {
          deps.bell();
        }
      }
    },
  };
}

// No color, background, bold or italic: chalk renders every theme function as plain text.
export function applyTuiA11yTheme(a11y: TuiA11y) {
  if (a11y.screenReader) {
    chalk.level = 0;
  }
}

export function setupTuiA11y(params: Parameters<typeof resolveTuiA11y>[0]) {
  const a11y = resolveTuiA11y(params);
  applyTuiA11yTheme(a11y);
  return a11y;
}
