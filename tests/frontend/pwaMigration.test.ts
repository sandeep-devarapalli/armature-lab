import { describe, expect, it, vi } from "vitest";
import { removeLegacyPwaCaches } from "../../src/lib/pwaMigration";

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
