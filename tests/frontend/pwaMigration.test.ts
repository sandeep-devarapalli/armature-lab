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
  it("reloads only once per tab and lets a second failure reach the route boundary", () => {
    const firstEvent = new Event("vite:preloadError", { cancelable: true });
    const secondEvent = new Event("vite:preloadError", { cancelable: true });
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };
    const reload = vi.fn();

    recoverFromStaleChunk(firstEvent, storage, reload);
    recoverFromStaleChunk(secondEvent, storage, reload);

    expect(firstEvent.defaultPrevented).toBe(true);
    expect(secondEvent.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });

  it("leaves the route error screen available when session storage is unavailable", () => {
    const event = new Event("vite:preloadError", { cancelable: true });
    const reload = vi.fn();

    recoverFromStaleChunk(event, null, reload);

    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it.each(["getItem", "setItem"] as const)(
    "falls through when session storage %s fails",
    (failedMethod) => {
      const event = new Event("vite:preloadError", { cancelable: true });
      const storage = {
        getItem: () => {
          if (failedMethod === "getItem") throw new Error("blocked");
          return null;
        },
        setItem: () => {
          if (failedMethod === "setItem") throw new Error("blocked");
        }
      };
      const reload = vi.fn();

      recoverFromStaleChunk(event, storage, reload);

      expect(event.defaultPrevented).toBe(false);
      expect(reload).not.toHaveBeenCalled();
    }
  );
});
