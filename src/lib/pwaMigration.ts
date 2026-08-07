const legacyCacheNames = ["armature-v16"];

export async function removeLegacyPwaCaches(
  cacheStorage: Pick<CacheStorage, "delete"> | undefined =
    typeof caches === "undefined" ? undefined : caches
) {
  if (!cacheStorage) return;

  await Promise.allSettled(
    legacyCacheNames.map((cacheName) => cacheStorage.delete(cacheName))
  );
}
