import { describe, expect, it, vi } from "vitest";
import {
  recoverFromStaleChunk,
  removeLegacyPwaCaches
} from "../../src/lib/pwaMigration";

describe("removeLegacyPwaCaches", () => {
  it("deletes only the preserved legacy site cache", async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);

    await removeLegacyPwaCaches({ delete: deleteCache });

    expect(deleteCache).toHaveBeenCalledOnce();
    expect(deleteCache).toHaveBeenCalledWith("armature-v16");
  });

  it("does nothing when Cache Storage is unavailable", async () => {
    await expect(removeLegacyPwaCaches(undefined)).resolves.toBeUndefined();
  });
});

describe("recoverFromStaleChunk", () => {
  it("reloads once when a deployed route chunk has disappeared", () => {
    const event = new Event("vite:preloadError", { cancelable: true });
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };
    const reload = vi.fn();

    recoverFromStaleChunk(event, storage, reload, 10_000);
    recoverFromStaleChunk(event, storage, reload, 20_000);

    expect(event.defaultPrevented).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("leaves the route error screen available when session storage is unavailable", () => {
    const reload = vi.fn();

    recoverFromStaleChunk(new Event("vite:preloadError"), null, reload);

    expect(reload).not.toHaveBeenCalled();
  });
});
