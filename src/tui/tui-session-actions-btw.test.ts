import { describe, expect, it, vi } from "vitest";
import {
  createBaseState,
  createTestSessionActions,
  makeTuiBackend,
} from "./tui-session-actions-test-support.js";

describe("tui session actions btw", () => {
  it("keeps an open btw answer through a same-session history reload", async () => {
    const btw = { clear: vi.fn() };
    const { loadHistory } = createTestSessionActions({
      btw,
      client: makeTuiBackend({
        loadHistory: vi.fn().mockResolvedValue({ messages: [], sessionId: "session-main" }),
      }),
      state: createBaseState({ historyLoaded: true }),
    });

    await loadHistory();

    expect(btw.clear).not.toHaveBeenCalled();
  });
});
